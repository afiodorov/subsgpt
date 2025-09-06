import { Phrase } from "./srtutils";
import { Either } from "./either";
import { ProviderFactory } from "./providers/factory";
import { ProviderType } from "./providers/types";

export interface APIKeys {
  openai?: string;
  anthropic?: string;
  google?: string;
}

export const translateBatch = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[],
  signal: AbortSignal,
  model: string,
  apiKeys: APIKeys
): Promise<Either<Error, string>> {
  const providerType = ProviderFactory.getProviderFromModel(model);
  const apiKey = apiKeys[providerType];
  
  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${providerType}. Model: ${model}. Available keys: ${Object.keys(apiKeys).filter(k => apiKeys[k as keyof APIKeys]).join(', ')}`);
  }
  
  const provider = ProviderFactory.createProvider(providerType, { apiKey });
  return provider.translateBatch(initPrompt, context, batch, signal, model);
};

export const fixCompletion = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[],
  wrongResponse: string,
  signal: AbortSignal,
  model: string,
  apiKeys: APIKeys,
  errors: Array<string>
): Promise<Either<Error, string>> {
  const providerType = ProviderFactory.getProviderFromModel(model);
  const apiKey = apiKeys[providerType];
  
  if (!apiKey) {
    throw new Error(`No API key configured for provider: ${providerType}. Model: ${model}. Available keys: ${Object.keys(apiKeys).filter(k => apiKeys[k as keyof APIKeys]).join(', ')}`);
  }
  
  const provider = ProviderFactory.createProvider(providerType, { apiKey });
  return provider.fixCompletion(
    initPrompt,
    context,
    batch,
    wrongResponse,
    signal,
    model,
    errors
  );
};

export const getAvailableModels = async function (
  apiKeys: APIKeys
): Promise<Array<{ id: string; provider: ProviderType; displayName: string }>> {
  const allModels: Array<{ id: string; provider: ProviderType; displayName: string }> = [];
  
  for (const [providerType, apiKey] of Object.entries(apiKeys)) {
    if (!apiKey) continue;
    
    try {
      const provider = ProviderFactory.createProvider(
        providerType as ProviderType,
        { apiKey }
      );
      const models = await provider.getAvailableModels();
      
      models.forEach(modelId => {
        const modelInfo = ProviderFactory.getAllModelInfo().find(m => m.id === modelId);
        if (modelInfo) {
          allModels.push(modelInfo);
        } else {
          allModels.push({
            id: modelId,
            provider: providerType as ProviderType,
            displayName: modelId
          });
        }
      });
    } catch (error) {
      console.error(`Failed to fetch models for ${providerType}:`, error);
    }
  }
  
  return allModels;
};