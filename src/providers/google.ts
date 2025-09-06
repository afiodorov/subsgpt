import { GoogleGenerativeAI } from "@google/generative-ai";
import { AIProvider, ProviderConfig } from "./types";
import { Phrase, convertToPhraseObject } from "../srtutils";
import { Either, Right, Left } from "../either";

export class GoogleProvider implements AIProvider {
  name = "Google Gemini";
  private genAI: GoogleGenerativeAI;

  constructor(config: ProviderConfig) {
    this.genAI = new GoogleGenerativeAI(config.apiKey);
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

    try {
      const genModel = this.genAI.getGenerativeModel({ model });
      
      let prompt = `${initPrompt}\n\nIMPORTANT: You must respond with valid JSON only.\n\n`;
      
      if (context) {
        prompt += `Conversational context to help you translate better: ${JSON.stringify(
          convertToPhraseObject(context)
        )}\n\n`;
      }
      
      prompt += `Now translate this JSON object:\n${JSON.stringify(convertToPhraseObject(batch))}`;
      
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = text.substring(jsonStart, jsonEnd);
        JSON.parse(jsonStr);
        return new Right(jsonStr);
      }
      
      return new Right(text);
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

    try {
      const genModel = this.genAI.getGenerativeModel({ model });
      const original = convertToPhraseObject(batch);
      
      let prompt = `${initPrompt}\n\nIMPORTANT: You must respond with valid JSON only.\n\n`;
      
      if (context) {
        prompt += `Conversational context: ${JSON.stringify(
          convertToPhraseObject(context)
        )}\n\n`;
      }
      
      prompt += `Original to translate: ${JSON.stringify(original)}\n\n`;
      prompt += `Previous translation attempt: ${wrongResponse}\n\n`;
      prompt += `Please fix these errors in your translation: ${JSON.stringify(errors)}. Fix them all and return the corrected JSON.`;
      
      const result = await genModel.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      const jsonStart = text.indexOf('{');
      const jsonEnd = text.lastIndexOf('}') + 1;
      if (jsonStart !== -1 && jsonEnd > jsonStart) {
        const jsonStr = text.substring(jsonStart, jsonEnd);
        JSON.parse(jsonStr);
        return new Right(jsonStr);
      }
      
      return new Right(text);
    } catch (error) {
      return new Left(error as Error);
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return [
      "gemini-1.5-flash",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro",
      "gemini-1.0-pro"
    ];
  }

  async validateApiKey(): Promise<boolean> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
      await model.generateContent("Hi");
      return true;
    } catch {
      return false;
    }
  }
}