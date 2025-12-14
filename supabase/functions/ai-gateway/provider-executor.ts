/**
 * Provider Executor
 * Executes AI requests against providers with fallback support
 */

import type {
  ExecutionContext,
  ProviderResult,
  ModelConfig,
  AIMessage,
  UsageInfo,
} from "./types.ts";

export async function executeWithProvider(
  supabase: any,
  context: ExecutionContext
): Promise<ProviderResult> {
  const { config, traceId } = context;
  const fallbackPath: string[] = [];

  // Try primary model first
  if (config.model && config.provider) {
    try {
      const result = await executeModel(context, config.model, config.provider.api_key);
      return { ...result, fallbackPath };
    } catch (error) {
      console.error(`Primary model ${config.model.model_id} failed:`, error);
      fallbackPath.push(config.model.model_id);
    }
  }

  // Try fallback models
  for (const fallbackModel of config.fallbackModels) {
    const provider = await getProviderForModel(supabase, context.tenantId, fallbackModel.provider_id);
    if (!provider) continue;

    try {
      const result = await executeModel(context, fallbackModel, provider.api_key);
      return { ...result, status: "fallback", fallbackPath };
    } catch (error) {
      console.error(`Fallback model ${fallbackModel.model_id} failed:`, error);
      fallbackPath.push(fallbackModel.model_id);
    }
  }

  // All models failed
  return {
    status: "error",
    safetyFlags: [],
    provider: "",
    model: "",
    fallbackPath,
  };
}

async function executeModel(
  context: ExecutionContext,
  model: ModelConfig,
  apiKey: string
): Promise<ProviderResult> {
  const { config, input, outputMode } = context;
  const startTime = Date.now();

  // Build messages
  const messages = buildMessages(context, model);

  // Determine provider and execute
  let result: ProviderResult;

  switch (model.provider_id) {
    case "openai":
      result = await executeOpenAI(model, messages, apiKey, config, outputMode);
      break;
    case "anthropic":
      result = await executeAnthropic(model, messages, apiKey, config, outputMode);
      break;
    case "google":
      result = await executeGoogle(model, messages, apiKey, config, outputMode);
      break;
    default:
      throw new Error(`Unsupported provider: ${model.provider_id}`);
  }

  // Add timing to usage
  if (result.usage) {
    result.usage.latencyMs = Date.now() - startTime;
  }

  return result;
}

function buildMessages(context: ExecutionContext, model: ModelConfig): AIMessage[] {
  const { config, input } = context;
  const messages: AIMessage[] = [];

  // Add system prompt
  if (config.prompt?.system_prompt) {
    let systemPrompt = config.prompt.system_prompt;

    // Apply audience profile tone
    if (config.audienceProfile) {
      systemPrompt = `${systemPrompt}\n\nTone: ${config.audienceProfile.tone}`;
      if (config.audienceProfile.max_response_length) {
        systemPrompt += `\nKeep responses under ${config.audienceProfile.max_response_length} characters.`;
      }
    }

    messages.push({ role: "system", content: systemPrompt });
  }

  // Add conversation history or single input
  if (input.messages?.length) {
    messages.push(...input.messages);
  } else if (input.text) {
    messages.push({ role: "user", content: input.text });
  }

  return messages;
}

async function executeOpenAI(
  model: ModelConfig,
  messages: AIMessage[],
  apiKey: string,
  config: any,
  outputMode?: string
): Promise<ProviderResult> {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.model_id,
      messages,
      max_tokens: config.feature?.max_tokens || model.max_output_tokens,
      temperature: config.feature?.temperature || model.temperature,
      response_format: outputMode === "JSON" ? { type: "json_object" } : undefined,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`OpenAI API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.choices[0]?.message?.content || "";
  const usage = data.usage;

  // Check for safety flags (content filter)
  const safetyFlags: string[] = [];
  if (data.choices[0]?.finish_reason === "content_filter") {
    safetyFlags.push("CONTENT_FILTERED");
  }

  return {
    status: "success",
    outputText: outputMode !== "JSON" ? content : undefined,
    outputJson: outputMode === "JSON" ? tryParseJson(content) : undefined,
    safetyFlags,
    provider: "openai",
    model: model.model_id,
    usage: {
      tokensIn: usage?.prompt_tokens || 0,
      tokensOut: usage?.completion_tokens || 0,
      costUsd: calculateCost(usage?.prompt_tokens || 0, usage?.completion_tokens || 0, model),
      latencyMs: 0,
    },
  };
}

async function executeAnthropic(
  model: ModelConfig,
  messages: AIMessage[],
  apiKey: string,
  config: any,
  outputMode?: string
): Promise<ProviderResult> {
  // Extract system message
  const systemMessage = messages.find((m) => m.role === "system")?.content || "";
  const userMessages = messages.filter((m) => m.role !== "system");

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: model.model_id,
      system: systemMessage,
      messages: userMessages.map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content,
      })),
      max_tokens: config.feature?.max_tokens || model.max_output_tokens,
      temperature: config.feature?.temperature || model.temperature,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Anthropic API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.content[0]?.text || "";
  const usage = data.usage;

  return {
    status: "success",
    outputText: outputMode !== "JSON" ? content : undefined,
    outputJson: outputMode === "JSON" ? tryParseJson(content) : undefined,
    safetyFlags: [],
    provider: "anthropic",
    model: model.model_id,
    usage: {
      tokensIn: usage?.input_tokens || 0,
      tokensOut: usage?.output_tokens || 0,
      costUsd: calculateCost(usage?.input_tokens || 0, usage?.output_tokens || 0, model),
      latencyMs: 0,
    },
  };
}

async function executeGoogle(
  model: ModelConfig,
  messages: AIMessage[],
  apiKey: string,
  config: any,
  outputMode?: string
): Promise<ProviderResult> {
  // Convert messages to Google format
  const contents = messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

  const systemInstruction = messages.find((m) => m.role === "system")?.content;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model.model_id}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction ? { parts: [{ text: systemInstruction }] } : undefined,
        generationConfig: {
          maxOutputTokens: config.feature?.max_tokens || model.max_output_tokens,
          temperature: config.feature?.temperature || model.temperature,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Google API error: ${response.status} - ${error}`);
  }

  const data = await response.json();
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
  const usage = data.usageMetadata;

  // Check safety ratings
  const safetyFlags: string[] = [];
  const safetyRatings = data.candidates?.[0]?.safetyRatings || [];
  for (const rating of safetyRatings) {
    if (rating.probability === "HIGH" || rating.probability === "MEDIUM") {
      safetyFlags.push(`SAFETY_${rating.category}`);
    }
  }

  return {
    status: "success",
    outputText: outputMode !== "JSON" ? content : undefined,
    outputJson: outputMode === "JSON" ? tryParseJson(content) : undefined,
    safetyFlags,
    provider: "google",
    model: model.model_id,
    usage: {
      tokensIn: usage?.promptTokenCount || 0,
      tokensOut: usage?.candidatesTokenCount || 0,
      costUsd: calculateCost(usage?.promptTokenCount || 0, usage?.candidatesTokenCount || 0, model),
      latencyMs: 0,
    },
  };
}

async function getProviderForModel(
  supabase: any,
  tenantId: string,
  providerId: string
): Promise<{ api_key: string } | null> {
  const { data } = await supabase
    .from("customer_ai_providers")
    .select("api_key_ref")
    .eq("customer_id", tenantId)
    .eq("provider_id", providerId)
    .eq("is_enabled", true)
    .single();

  if (!data?.api_key_ref) return null;

  return { api_key: Deno.env.get(data.api_key_ref) || "" };
}

function calculateCost(tokensIn: number, tokensOut: number, model: ModelConfig): number {
  const inputCost = (tokensIn / 1000) * (model.cost_per_1k_input || 0);
  const outputCost = (tokensOut / 1000) * (model.cost_per_1k_output || 0);
  return inputCost + outputCost;
}

function tryParseJson(text: string): Record<string, unknown> | undefined {
  try {
    return JSON.parse(text);
  } catch {
    return undefined;
  }
}
