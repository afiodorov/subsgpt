import { OpenAI } from "openai";
import { AIProvider, ProviderConfig } from "./types";
import { Phrase, convertToPhraseObject } from "../srtutils";
import { Either, Right, Left } from "../either";

export class OpenAIProvider implements AIProvider {
  name = "OpenAI";
  private openai: OpenAI;

  constructor(config: ProviderConfig) {
    this.openai = new OpenAI({
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

    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: initPrompt },
    ];
    
    if (context) {
      msgs.push({
        role: "user",
        content: `Conversational context to help you translate better ${JSON.stringify(
          convertToPhraseObject(context)
        )}`,
      });
    }

    msgs.push({
      role: "user",
      content: JSON.stringify(convertToPhraseObject(batch)),
    });
    
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages: msgs,
        model: model,
        response_format: { type: "json_object" },
        seed: 0,
      });
      return new Right(chatCompletion.choices[0].message.content || "");
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
    const msgs: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: "system", content: initPrompt },
    ];
    
    if (context) {
      msgs.push({
        role: "user",
        content: `Conversational context to help you translate better ${JSON.stringify(
          convertToPhraseObject(context)
        )}`,
      });
    }

    msgs.push({
      role: "user",
      content: JSON.stringify(original),
    });
    msgs.push({
      role: "assistant",
      content: wrongResponse,
    });
    msgs.push({
      role: "user",
      content: `Great, but fix these errors now: ${JSON.stringify(
        errors
      )}. Fix them all.`,
    });
    
    try {
      const chatCompletion = await this.openai.chat.completions.create({
        messages: msgs,
        model: model,
        response_format: { type: "json_object" },
        seed: 0,
      });
      return new Right(chatCompletion.choices[0].message.content || "");
    } catch (error) {
      return new Left(error as Error);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.openai.models.list();
      return response.data
        .map(m => m.id)
        .filter(id => 
          id.includes('gpt') || 
          id.includes('o1') || 
          id.includes('chatgpt')
        )
        .sort();
    } catch (error) {
      console.error('Failed to fetch OpenAI models:', error);
      return [];
    }
  }

  async validateApiKey(): Promise<boolean> {
    try {
      await this.openai.models.list();
      return true;
    } catch {
      return false;
    }
  }
}