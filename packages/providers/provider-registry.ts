import { LlmProvider } from './llm-provider.js';

export class ProviderRegistry {
  private providers = new Map<string, LlmProvider>();
  private defaultProvider?: string;

  register(provider: LlmProvider, options?: { default?: boolean }) {
    this.providers.set(provider.name, provider);

    if (options?.default || !this.defaultProvider) {
      this.defaultProvider = provider.name;
    }
  }

  get(name?: string) {
    const providerName = name ?? this.defaultProvider;

    if (!providerName) {
      throw new Error('No LLM provider registered.');
    }

    const provider = this.providers.get(providerName);

    if (!provider) {
      throw new Error(`LLM provider not found: ${providerName}`);
    }

    return provider;
  }

  list() {
    return [...this.providers.keys()];
  }
}
