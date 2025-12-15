/**
 * Safety & Input Validation
 * Validates requests and sanitizes input for safety
 */

import type { AIExecuteRequest, AudienceProfileConfig } from "./types.ts";

interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate the structure of an AI request
 */
export function validateRequest(request: AIExecuteRequest): ValidationResult {
  if (!request.tenantId) {
    return { valid: false, error: "tenantId is required" };
  }

  if (!request.userId) {
    return { valid: false, error: "userId is required" };
  }

  if (!request.role) {
    return { valid: false, error: "role is required" };
  }

  if (!["student", "teacher", "parent", "admin"].includes(request.role)) {
    return { valid: false, error: "Invalid role" };
  }

  if (!request.audienceProfile) {
    return { valid: false, error: "audienceProfile is required" };
  }

  if (!["kid", "teen", "adult", "coaching"].includes(request.audienceProfile)) {
    return { valid: false, error: "Invalid audienceProfile" };
  }

  if (!request.featureId) {
    return { valid: false, error: "featureId is required" };
  }

  if (!request.input) {
    return { valid: false, error: "input is required" };
  }

  if (!request.input.text && !request.input.messages?.length) {
    return { valid: false, error: "input.text or input.messages is required" };
  }

  // Validate input length
  const inputText = request.input.text || request.input.messages?.map(m => m.content).join(" ") || "";
  if (inputText.length > 100000) {
    return { valid: false, error: "Input too long (max 100,000 characters)" };
  }

  return { valid: true };
}

/**
 * Sanitize input based on audience profile
 */
export function sanitizeInput(
  input: { text?: string; messages?: Array<{ role: string; content: string }> },
  profile: AudienceProfileConfig | null
): { text?: string; messages?: Array<{ role: string; content: string }> } {
  if (!profile) return input;

  // For kids, apply stricter sanitization
  if (profile.safety_level === "strict") {
    if (input.text) {
      input.text = sanitizeText(input.text, profile.forbidden_topics);
    }
    if (input.messages) {
      input.messages = input.messages.map((m) => ({
        ...m,
        content: sanitizeText(m.content, profile.forbidden_topics),
      }));
    }
  }

  return input;
}

/**
 * Remove or flag potentially problematic content
 */
function sanitizeText(text: string, forbiddenTopics: string[]): string {
  let sanitized = text;

  // Remove potential prompt injection attempts
  sanitized = sanitized.replace(/ignore (all )?(previous |prior )?instructions/gi, "[FILTERED]");
  sanitized = sanitized.replace(/you are now/gi, "[FILTERED]");
  sanitized = sanitized.replace(/pretend (to be|you are)/gi, "[FILTERED]");
  sanitized = sanitized.replace(/act as/gi, "[FILTERED]");
  sanitized = sanitized.replace(/system:/gi, "[FILTERED]");
  sanitized = sanitized.replace(/\[INST\]/gi, "[FILTERED]");
  sanitized = sanitized.replace(/<\|.*?\|>/g, "[FILTERED]");

  // Remove forbidden topic mentions (basic keyword filter)
  for (const topic of forbiddenTopics) {
    const regex = new RegExp(`\\b${escapeRegex(topic)}\\b`, "gi");
    sanitized = sanitized.replace(regex, "[TOPIC_FILTERED]");
  }

  return sanitized;
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Check if output contains safety concerns
 */
export function checkOutputSafety(
  output: string,
  profile: AudienceProfileConfig | null
): string[] {
  const flags: string[] = [];

  if (!profile) return flags;

  // Check for forbidden topics in output
  for (const topic of profile.forbidden_topics) {
    if (output.toLowerCase().includes(topic.toLowerCase())) {
      flags.push(`FORBIDDEN_TOPIC:${topic}`);
    }
  }

  // Check for potentially harmful content patterns
  const harmfulPatterns = [
    { pattern: /\b(kill|murder|harm)\s+(yourself|myself|someone)/i, flag: "SELF_HARM" },
    { pattern: /\b(suicide|self-harm)\b/i, flag: "SELF_HARM" },
    { pattern: /\b(drugs?|cocaine|heroin|meth)\b/i, flag: "DRUGS" },
    { pattern: /\b(weapon|gun|bomb|explosive)\b/i, flag: "WEAPONS" },
  ];

  // Only apply strict checks for kid/teen profiles
  if (profile.safety_level === "strict") {
    for (const { pattern, flag } of harmfulPatterns) {
      if (pattern.test(output)) {
        flags.push(flag);
      }
    }
  }

  return flags;
}

/**
 * Detect potential prompt injection in user input
 */
export function detectPromptInjection(text: string): boolean {
  const injectionPatterns = [
    /ignore (all )?(previous |prior )?instructions/i,
    /you are now/i,
    /pretend (to be|you are)/i,
    /new instructions:/i,
    /override:/i,
    /system prompt:/i,
    /\[INST\]/i,
    /<\|system\|>/i,
    /```system/i,
    /disregard (all )?(previous |prior )?/i,
  ];

  return injectionPatterns.some((pattern) => pattern.test(text));
}
