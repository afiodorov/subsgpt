import { OpenAIProvider } from './openai';
import { AnthropicProvider } from './anthropic';
import { GoogleProvider } from './google';
import { ProviderFactory } from './factory';
import { Phrase } from '../srtutils';

const mockPhrases: Phrase[] = [
  new Phrase(1, "00:00:01,000 --> 00:00:02,000", "Hello world"),
  new Phrase(2, "00:00:03,000 --> 00:00:04,000", "How are you?")
];

const mockInitPrompt = "Translate the following text to Spanish, maintaining the JSON structure.";

describe('Provider Factory', () => {
  it('should create OpenAI provider', () => {
    const provider = ProviderFactory.createProvider('openai', { apiKey: 'test-key' });
    expect(provider).toBeInstanceOf(OpenAIProvider);
    expect(provider.name).toBe('OpenAI');
  });

  it('should create Anthropic provider', () => {
    const provider = ProviderFactory.createProvider('anthropic', { apiKey: 'test-key' });
    expect(provider).toBeInstanceOf(AnthropicProvider);
    expect(provider.name).toBe('Anthropic');
  });

  it('should create Google provider', () => {
    const provider = ProviderFactory.createProvider('google', { apiKey: 'test-key' });
    expect(provider).toBeInstanceOf(GoogleProvider);
    expect(provider.name).toBe('Google Gemini');
  });

  it('should identify provider from model name', () => {
    expect(ProviderFactory.getProviderFromModel('gpt-4')).toBe('openai');
    expect(ProviderFactory.getProviderFromModel('gpt-3.5-turbo')).toBe('openai');
    expect(ProviderFactory.getProviderFromModel('o1-preview')).toBe('openai');
    
    expect(ProviderFactory.getProviderFromModel('claude-3-opus')).toBe('anthropic');
    expect(ProviderFactory.getProviderFromModel('claude-3-5-sonnet')).toBe('anthropic');
    
    expect(ProviderFactory.getProviderFromModel('gemini-1.5-pro')).toBe('google');
    expect(ProviderFactory.getProviderFromModel('gemini-1.5-flash')).toBe('google');
  });

  it('should return all model info', () => {
    const models = ProviderFactory.getAllModelInfo();
    
    expect(models.length).toBeGreaterThan(0);
    
    const openaiModels = models.filter(m => m.provider === 'openai');
    expect(openaiModels.length).toBeGreaterThan(0);
    
    const anthropicModels = models.filter(m => m.provider === 'anthropic');
    expect(anthropicModels.length).toBeGreaterThan(0);
    
    const googleModels = models.filter(m => m.provider === 'google');
    expect(googleModels.length).toBeGreaterThan(0);
  });
});

describe('OpenAI Provider', () => {
  let provider: OpenAIProvider;
  
  beforeEach(() => {
    provider = new OpenAIProvider({ apiKey: 'test-api-key' });
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('OpenAI');
  });

  it('should return available models', async () => {
    const spy = jest.spyOn(provider as any, 'getAvailableModels');
    spy.mockResolvedValue(['gpt-4', 'gpt-3.5-turbo']);
    
    const models = await provider.getAvailableModels();
    expect(models).toContain('gpt-4');
    expect(models).toContain('gpt-3.5-turbo');
  });

  it('should handle aborted signal in translateBatch', async () => {
    const abortController = new AbortController();
    abortController.abort();
    
    const result = await provider.translateBatch(
      mockInitPrompt,
      [],
      mockPhrases,
      abortController.signal,
      'gpt-4'
    );
    
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.message).toBe('aborted');
    }
  });

  it('should handle aborted signal in fixCompletion', async () => {
    const abortController = new AbortController();
    abortController.abort();
    
    const result = await provider.fixCompletion(
      mockInitPrompt,
      [],
      mockPhrases,
      '{"1": "Hola mundo", "2": "¿Cómo estás?"}',
      abortController.signal,
      'gpt-4',
      ['Fix grammar']
    );
    
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.message).toBe('aborted');
    }
  });
});

describe('Anthropic Provider', () => {
  let provider: AnthropicProvider;
  
  beforeEach(() => {
    provider = new AnthropicProvider({ apiKey: 'test-api-key' });
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('Anthropic');
  });

  it('should return available models', async () => {
    const models = await provider.getAvailableModels();
    expect(models).toContain('claude-3-5-sonnet-20241022');
    expect(models).toContain('claude-3-opus-20240229');
    expect(models.length).toBe(5);
  });

  it('should handle aborted signal in translateBatch', async () => {
    const abortController = new AbortController();
    abortController.abort();
    
    const result = await provider.translateBatch(
      mockInitPrompt,
      [],
      mockPhrases,
      abortController.signal,
      'claude-3-opus'
    );
    
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.message).toBe('aborted');
    }
  });
});

describe('Google Provider', () => {
  let provider: GoogleProvider;
  
  beforeEach(() => {
    provider = new GoogleProvider({ apiKey: 'test-api-key' });
  });

  it('should have correct name', () => {
    expect(provider.name).toBe('Google Gemini');
  });

  it('should return available models', async () => {
    const models = await provider.getAvailableModels();
    expect(models).toContain('gemini-1.5-flash');
    expect(models).toContain('gemini-1.5-pro');
    expect(models.length).toBe(4);
  });

  it('should handle aborted signal in translateBatch', async () => {
    const abortController = new AbortController();
    abortController.abort();
    
    const result = await provider.translateBatch(
      mockInitPrompt,
      [],
      mockPhrases,
      abortController.signal,
      'gemini-1.5-pro'
    );
    
    expect(result.isLeft()).toBe(true);
    if (result.isLeft()) {
      expect(result.value.message).toBe('aborted');
    }
  });
});

describe('Integration Tests', () => {
  it('should handle provider switching seamlessly', async () => {
    const apiKeys = {
      openai: 'test-openai-key',
      anthropic: 'test-anthropic-key',
      google: 'test-google-key'
    };

    const models = [
      { model: 'gpt-4', expectedProvider: 'openai' },
      { model: 'claude-3-opus', expectedProvider: 'anthropic' },
      { model: 'gemini-1.5-pro', expectedProvider: 'google' }
    ];

    for (const { model, expectedProvider } of models) {
      const providerType = ProviderFactory.getProviderFromModel(model);
      expect(providerType).toBe(expectedProvider);
      
      const provider = ProviderFactory.createProvider(
        providerType,
        { apiKey: apiKeys[providerType] }
      );
      
      expect(provider).toBeDefined();
    }
  });
});