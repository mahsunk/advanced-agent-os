import { LlmMessage, LlmProvider, LlmResponse } from './llm-provider.js';

export type OpenAiProviderOptions = {
  apiKey?: string;
  baseUrl?: string;
  model?: string;
};

export class OpenAiCompatibleProvider implements LlmProvider {
  name = 'openai-compatible';

  private apiKey?: string;
  private baseUrl: string;
  private model: string;

  constructor(options: OpenAiProviderOptions = {}) {
    this.apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
    this.baseUrl = options.baseUrl ?? process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1';
    this.model = options.model ?? process.env.DEFAULT_MODEL ?? 'gpt-4o-mini';
  }

  async complete(messages: LlmMessage[]): Promise<LlmResponse> {
    if (!this.apiKey) {
      return {
        model: 'mock-no-api-key',
        content: 'OPENAI_API_KEY is not configured. Using safe mock response instead.'
      };
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: this.model,
        messages,
        temperature: 0.2
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI-compatible provider failed: ${response.status} ${errorText}`);
    }

    const data = await response.json();

    return {
      model: data.model ?? this.model,
      content: data.choices?.[0]?.message?.content ?? '',
      usage: {
        inputTokens: data.usage?.prompt_tokens,
        outputTokens: data.usage?.completion_tokens
      }
    };
  }
}
