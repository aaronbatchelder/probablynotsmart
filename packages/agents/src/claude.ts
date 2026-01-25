import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export interface ClaudeMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface ClaudeResponse {
  content: string;
  tokensUsed: {
    input: number;
    output: number;
    total: number;
  };
  stopReason: string | null;
}

export interface ClaudeOptions {
  model?: string;
  maxTokens?: number;
  temperature?: number;
  system?: string;
}

const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
const DEFAULT_MAX_TOKENS = 4096;
const DEFAULT_TEMPERATURE = 0.7;

/**
 * Send a message to Claude and get a response
 */
export async function chat(
  messages: ClaudeMessage[],
  options: ClaudeOptions = {}
): Promise<ClaudeResponse> {
  const {
    model = DEFAULT_MODEL,
    maxTokens = DEFAULT_MAX_TOKENS,
    temperature = DEFAULT_TEMPERATURE,
    system,
  } = options;

  const response = await anthropic.messages.create({
    model,
    max_tokens: maxTokens,
    temperature,
    system,
    messages: messages.map((m) => ({
      role: m.role,
      content: m.content,
    })),
  });

  const textContent = response.content.find((c) => c.type === 'text');
  const content = textContent?.type === 'text' ? textContent.text : '';

  return {
    content,
    tokensUsed: {
      input: response.usage.input_tokens,
      output: response.usage.output_tokens,
      total: response.usage.input_tokens + response.usage.output_tokens,
    },
    stopReason: response.stop_reason,
  };
}

/**
 * Simple single-turn prompt
 */
export async function prompt(
  userMessage: string,
  options: ClaudeOptions = {}
): Promise<ClaudeResponse> {
  return chat([{ role: 'user', content: userMessage }], options);
}

/**
 * Parse JSON from Claude's response, with fallback
 */
export function parseJsonResponse<T>(content: string, fallback: T): T {
  try {
    // Try to find JSON in the response (might be wrapped in markdown code blocks)
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/) ||
                      content.match(/\{[\s\S]*\}/);

    if (jsonMatch) {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      return JSON.parse(jsonStr) as T;
    }

    // Try parsing the whole content as JSON
    return JSON.parse(content) as T;
  } catch {
    console.error('Failed to parse JSON from Claude response:', content.slice(0, 200));
    return fallback;
  }
}

export { anthropic };
