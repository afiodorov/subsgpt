import { Phrase } from "../srtutils";
import { Either } from "../either";

export interface AIProvider {
  name: string;
  translateBatch(
    initPrompt: string,
    context: Phrase[],
    batch: Phrase[],
    signal: AbortSignal,
    model: string
  ): Promise<Either<Error, string>>;
  
  fixCompletion(
    initPrompt: string,
    context: Phrase[],
    batch: Phrase[],
    wrongResponse: string,
    signal: AbortSignal,
    model: string,
    errors: Array<string>
  ): Promise<Either<Error, string>>;
  
  getAvailableModels(): Promise<string[]>;
  validateApiKey(): Promise<boolean>;
}

export interface ProviderConfig {
  apiKey: string;
  endpoint?: string;
}

export type ProviderType = 'openai' | 'anthropic' | 'google';

export interface ModelInfo {
  id: string;
  provider: ProviderType;
  displayName: string;
}