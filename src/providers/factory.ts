import { AIProvider, ProviderType, ProviderConfig, ModelInfo } from "./types";
import { OpenAIProvider } from "./openai";
import { AnthropicProvider } from "./anthropic";
import { GoogleProvider } from "./google";

export class ProviderFactory {
  static createProvider(type: ProviderType, config: ProviderConfig): AIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'google':
        return new GoogleProvider(config);
      default:
        throw new Error(`Unknown provider type: ${type}`);
    }
  }

  static getProviderFromModel(modelId: string): ProviderType {
    if (modelId.includes('claude')) {
      return 'anthropic';
    }
    if (modelId.includes('gemini')) {
      return 'google';
    }
    if (modelId.includes('gpt') || modelId.includes('o1') || modelId.includes('chatgpt')) {
      return 'openai';
    }
    
    console.warn('Unknown model, defaulting to openai:', modelId);
    return 'openai';
  }

  static getAllModelInfo(): ModelInfo[] {
    return [
      { id: 'gpt-4o', provider: 'openai', displayName: 'GPT-4o' },
      { id: 'gpt-4o-mini', provider: 'openai', displayName: 'GPT-4o Mini' },
      { id: 'gpt-4-turbo', provider: 'openai', displayName: 'GPT-4 Turbo' },
      { id: 'gpt-4-0125-preview', provider: 'openai', displayName: 'GPT-4 (0125)' },
      { id: 'gpt-3.5-turbo', provider: 'openai', displayName: 'GPT-3.5 Turbo' },
      { id: 'o1-preview', provider: 'openai', displayName: 'O1 Preview' },
      { id: 'o1-mini', provider: 'openai', displayName: 'O1 Mini' },
      
      { id: 'claude-3-5-sonnet-20241022', provider: 'anthropic', displayName: 'Claude 3.5 Sonnet' },
      { id: 'claude-3-5-haiku-20241022', provider: 'anthropic', displayName: 'Claude 3.5 Haiku' },
      { id: 'claude-3-opus-20240229', provider: 'anthropic', displayName: 'Claude 3 Opus' },
      { id: 'claude-3-sonnet-20240229', provider: 'anthropic', displayName: 'Claude 3 Sonnet' },
      { id: 'claude-3-haiku-20240307', provider: 'anthropic', displayName: 'Claude 3 Haiku' },
      
      { id: 'gemini-1.5-flash', provider: 'google', displayName: 'Gemini 1.5 Flash' },
      { id: 'gemini-1.5-flash-8b', provider: 'google', displayName: 'Gemini 1.5 Flash 8B' },
      { id: 'gemini-1.5-pro', provider: 'google', displayName: 'Gemini 1.5 Pro' },
      { id: 'gemini-1.0-pro', provider: 'google', displayName: 'Gemini 1.0 Pro' },
    ];
  }
}