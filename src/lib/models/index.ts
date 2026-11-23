import { ModelProvider } from './types';
import { MockModelProvider } from './mock-provider';
import { OpenAIProvider } from './openai-provider';
import { GrokProvider } from './grok-provider';

export function getModelProvider(preferredProvider?: string): ModelProvider {
  const provider = preferredProvider || process.env.MODEL_PROVIDER || 'mock';

  if (provider === 'openai' && process.env.OPENAI_API_KEY) {
    return new OpenAIProvider();
  }

  if (provider === 'grok' && process.env.GROK_API_KEY) {
    return new GrokProvider();
  }

  // Default to deterministic Mock provider if credentials are not configured
  return new MockModelProvider();
}

export * from './types';
export * from './mock-provider';
export * from './openai-provider';
export * from './grok-provider';
