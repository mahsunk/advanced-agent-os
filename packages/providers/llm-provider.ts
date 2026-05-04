export type LlmMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
};

export type LlmResponse = {
  content: string;
  model: string;
  usage?: {
    inputTokens?: number;
    outputTokens?: number;
  };
};

export interface LlmProvider {
  name: string;
  complete(messages: LlmMessage[]): Promise<LlmResponse>;
}

export class MockLlmProvider implements LlmProvider {
  name = 'mock-provider';

  async complete(messages: LlmMessage[]): Promise<LlmResponse> {
    const last = messages[messages.length - 1]?.content ?? '';
    return {
      model: 'mock-model',
      content: `Mock response for: ${last}`,
      usage: {
        inputTokens: last.length,
        outputTokens: 10
      }
    };
  }
}
