/**
 * Gemini Direct Service
 * Direct API calls to Google Gemini (for testing/development only)
 * In production, use the AI Gateway Edge Function instead
 */

const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models";

// Default model - using Gemini 2.5 Flash (latest)
const DEFAULT_MODEL = "gemini-2.5-flash";

// Debug flag - set to true to enable detailed logging
const DEBUG_GEMINI = true;

function debugLog(tag: string, ...args: unknown[]) {
  if (DEBUG_GEMINI) {
    console.log(`[GeminiService][${tag}]`, ...args);
  }
}

export type GeminiMessage = {
  role: "user" | "model";
  parts: { text: string }[];
};

export type GeminiChatRequest = {
  contents: GeminiMessage[];
  generationConfig?: {
    temperature?: number;
    topK?: number;
    topP?: number;
    maxOutputTokens?: number;
    stopSequences?: string[];
  };
  safetySettings?: {
    category: string;
    threshold: string;
  }[];
};

export type GeminiResponse = {
  candidates?: {
    content: {
      parts: { text: string }[];
      role: string;
    };
    finishReason: string;
    safetyRatings?: {
      category: string;
      probability: string;
    }[];
  }[];
  promptFeedback?: {
    safetyRatings?: {
      category: string;
      probability: string;
    }[];
    blockReason?: string;
  };
  error?: {
    code: number;
    message: string;
    status: string;
  };
};

export class GeminiDirectError extends Error {
  code: string;
  status?: number;

  constructor(code: string, message: string, status?: number) {
    super(message);
    this.name = "GeminiDirectError";
    this.code = code;
    this.status = status;
  }
}

/**
 * Send a chat message to Gemini
 */
export async function sendChatMessage(
  apiKey: string,
  messages: GeminiMessage[],
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const model = options?.model || DEFAULT_MODEL;
  const url = `${GEMINI_API_URL}/${model}:generateContent?key=${apiKey}`;

  // Add system prompt as first user message if provided
  let contents = [...messages];
  if (options?.systemPrompt && contents.length > 0) {
    // Prepend system context to first user message
    const firstUserIdx = contents.findIndex((m) => m.role === "user");
    if (firstUserIdx >= 0) {
      const originalText = contents[firstUserIdx].parts[0].text;
      contents[firstUserIdx] = {
        ...contents[firstUserIdx],
        parts: [{ text: `[System: ${options.systemPrompt}]\n\n${originalText}` }],
      };
    }
  }

  const request: GeminiChatRequest = {
    contents,
    generationConfig: {
      temperature: options?.temperature ?? 0.7,
      maxOutputTokens: options?.maxTokens ?? 1024,
      topK: 40,
      topP: 0.95,
    },
    safetySettings: [
      { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
      { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
    ],
  };

  try {
    debugLog("REQUEST", {
      url: url.replace(apiKey, "***API_KEY***"),
      model,
      messageCount: contents.length,
      temperature: options?.temperature ?? 0.7,
    });

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });

    debugLog("RESPONSE_STATUS", {
      status: response.status,
      statusText: response.statusText,
      ok: response.ok,
    });

    const data: GeminiResponse = await response.json();
    
    debugLog("RESPONSE_DATA", {
      hasError: !!data.error,
      hasCandidates: !!data.candidates?.length,
      hasPromptFeedback: !!data.promptFeedback,
      errorDetails: data.error,
      blockReason: data.promptFeedback?.blockReason,
    });

    // Check for API error
    if (data.error) {
      debugLog("API_ERROR", data.error);
      throw new GeminiDirectError(
        data.error.status || "API_ERROR",
        data.error.message,
        data.error.code
      );
    }

    // Check for blocked content
    if (data.promptFeedback?.blockReason) {
      throw new GeminiDirectError(
        "CONTENT_BLOCKED",
        `Content blocked: ${data.promptFeedback.blockReason}`
      );
    }

    // Extract response text
    const candidate = data.candidates?.[0];
    if (!candidate) {
      throw new GeminiDirectError("NO_RESPONSE", "No response from Gemini");
    }

    const text = candidate.content?.parts?.[0]?.text;
    if (!text) {
      throw new GeminiDirectError("EMPTY_RESPONSE", "Empty response from Gemini");
    }

    return text;
  } catch (error) {
    if (error instanceof GeminiDirectError) {
      debugLog("GEMINI_ERROR", {
        code: error.code,
        message: error.message,
        status: error.status,
      });
      throw error;
    }
    
    // Network or other errors
    debugLog("NETWORK_ERROR", {
      name: error instanceof Error ? error.name : "Unknown",
      message: error instanceof Error ? error.message : String(error),
    });
    throw new GeminiDirectError(
      "NETWORK_ERROR",
      error instanceof Error ? error.message : "Failed to connect to Gemini"
    );
  }
}

/**
 * Simple text completion (single turn)
 */
export async function completeText(
  apiKey: string,
  prompt: string,
  options?: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
  }
): Promise<string> {
  const messages: GeminiMessage[] = [
    { role: "user", parts: [{ text: prompt }] },
  ];
  return sendChatMessage(apiKey, messages, options);
}

/**
 * Validation result with detailed info
 */
export type ValidationResult = {
  valid: boolean;
  error?: string;
  errorCode?: string;
  errorStatus?: number;
  debugInfo?: Record<string, unknown>;
};

/**
 * Validate API key by making a simple request
 * Returns detailed result for debugging
 * Tries multiple models in case one is not available
 */
export async function validateApiKey(apiKey: string): Promise<ValidationResult> {
  debugLog("VALIDATE_START", { keyLength: apiKey?.length, keyPrefix: apiKey?.substring(0, 8) });
  
  if (!apiKey || apiKey.trim().length === 0) {
    debugLog("VALIDATE_FAIL", "Empty API key");
    return { valid: false, error: "API key is empty", errorCode: "EMPTY_KEY" };
  }

  // Try multiple models in case one is not available
  const modelsToTry = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash"];
  
  for (const model of modelsToTry) {
    debugLog("VALIDATE_TRY_MODEL", model);
    try {
      await completeText(apiKey, "Hi", { maxTokens: 5, model });
      debugLog("VALIDATE_SUCCESS", { model, message: "API key is valid" });
      return { valid: true, debugInfo: { validatedWithModel: model } };
    } catch (error) {
      debugLog("VALIDATE_MODEL_ERROR", { model, error });
      
      if (error instanceof GeminiDirectError) {
        // If it's an auth error (400/401), the key is definitely invalid
        if (error.status === 400 || error.status === 401 || error.code === "INVALID_ARGUMENT") {
          // Check if it's specifically about the API key vs model not found
          const isKeyError = error.message?.toLowerCase().includes("api key") || 
                            error.message?.toLowerCase().includes("invalid") ||
                            error.code === "INVALID_ARGUMENT";
          
          if (isKeyError) {
            const result: ValidationResult = {
              valid: false,
              error: error.message,
              errorCode: error.code,
              errorStatus: error.status,
              debugInfo: {
                triedModel: model,
                errorName: error.name,
              },
            };
            debugLog("VALIDATE_INVALID_KEY", result);
            return result;
          }
        }
        
        // Model not found - try next model
        if (error.code === "NOT_FOUND" || error.message?.includes("not found")) {
          debugLog("VALIDATE_MODEL_NOT_FOUND", { model, tryingNext: true });
          continue;
        }
      }
      
      // For other errors on last model, return the error
      if (model === modelsToTry[modelsToTry.length - 1]) {
        const result: ValidationResult = {
          valid: false,
          error: error instanceof Error ? error.message : "Unknown error",
          errorCode: error instanceof GeminiDirectError ? error.code : "UNKNOWN",
          errorStatus: error instanceof GeminiDirectError ? error.status : undefined,
          debugInfo: {
            triedModels: modelsToTry,
            lastError: String(error),
          },
        };
        debugLog("VALIDATE_ALL_MODELS_FAILED", result);
        return result;
      }
    }
  }
  
  // Should not reach here, but just in case
  return { valid: false, error: "Validation failed for all models", errorCode: "ALL_FAILED" };
}

/**
 * Legacy validation function (returns boolean for backward compatibility)
 */
export async function validateApiKeySimple(apiKey: string): Promise<boolean> {
  const result = await validateApiKey(apiKey);
  return result.valid;
}
