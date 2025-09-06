import Anthropic from "@anthropic-ai/sdk";
import { AIProvider, ProviderConfig } from "./types";
import { Phrase, convertToPhraseObject } from "../srtutils";
import { Either, Right, Left } from "../either";

export class AnthropicProvider implements AIProvider {
  name = "Anthropic";
  private anthropic: Anthropic;
  private apiKey: string;

  constructor(config: ProviderConfig) {
    this.apiKey = config.apiKey;
    this.anthropic = new Anthropic({
      apiKey: config.apiKey,
      dangerouslyAllowBrowser: true,
    });
  }

  async translateBatch(
    initPrompt: string,
    context: Phrase[],
    batch: Phrase[],
    signal: AbortSignal,
    model: string
  ): Promise<Either<Error, string>> {
    if (signal.aborted) {
      return new Left(new Error("aborted"));
    }

    let systemPrompt = initPrompt + "\n\nIMPORTANT: You must respond with valid JSON only.";
    let userMessage = JSON.stringify(convertToPhraseObject(batch));
    
    if (context) {
      userMessage = `Conversational context to help you translate better ${JSON.stringify(
        convertToPhraseObject(context)
      )}\n\nNow translate:\n${userMessage}`;
    }

    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: [
          { role: "user", content: userMessage }
        ],
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return new Right(content.text);
      }
      return new Left(new Error("Unexpected response format"));
    } catch (error) {
      return new Left(error as Error);
    }
  }

  async fixCompletion(
    initPrompt: string,
    context: Phrase[],
    batch: Phrase[],
    wrongResponse: string,
    signal: AbortSignal,
    model: string,
    errors: Array<string>
  ): Promise<Either<Error, string>> {
    if (signal.aborted) {
      return new Left(new Error("aborted"));
    }

    const original = convertToPhraseObject(batch);
    let systemPrompt = initPrompt + "\n\nIMPORTANT: You must respond with valid JSON only.";
    
    const messages: Anthropic.MessageParam[] = [];
    
    if (context) {
      messages.push({
        role: "user",
        content: `Conversational context to help you translate better ${JSON.stringify(
          convertToPhraseObject(context)
        )}\n\nNow translate:\n${JSON.stringify(original)}`
      });
    } else {
      messages.push({
        role: "user",
        content: JSON.stringify(original)
      });
    }
    
    messages.push({
      role: "assistant",
      content: wrongResponse
    });
    
    messages.push({
      role: "user",
      content: `Great, but fix these errors now: ${JSON.stringify(errors)}. Fix them all.`
    });

    try {
      const response = await this.anthropic.messages.create({
        model: model,
        max_tokens: 4096,
        system: systemPrompt,
        messages: messages,
      });

      const content = response.content[0];
      if (content.type === 'text') {
        return new Right(content.text);
      }
      return new Left(new Error("Unexpected response format"));
    } catch (error) {
      return new Left(error as Error);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await fetch('https://api.anthropic.com/v1/models', {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.data
          .map((model: any) => model.id)
          .filter((id: string) => id.includes('claude'))
          .sort();
      }
    } catch (error) {
      console.error('Failed to fetch Anthropic models:', error);
    }
    
    // Fallback to static models if API fails
    return [
      "claude-3-5-sonnet-20241022",
      "claude-3-5-haiku-20241022",
      "claude-3-opus-20240229", 
      "claude-3-sonnet-20240229",
      "claude-3-haiku-20240307"
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.anthropic.messages.create({
        model: "claude-3-haiku-20240307",
        max_tokens: 1,
        messages: [{ role: "user", content: "Hi" }],
      });
      return true;
    } catch {
      return false;
    }
  }
}