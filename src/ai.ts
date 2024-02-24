import { OpenAI } from "openai";
import { Phrase } from "./srtutils";
import { Either, Right, Left } from "./either";
import { convertToPhraseObject } from "./srtutils";

export const translateBatch = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[],
  signal: AbortSignal,
  model: string,
  apiKey: string
): Promise<Either<Error, string>> {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
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
    const chatCompletion = await openai.chat.completions.create({
      messages: msgs,
      model: model,
      response_format: { type: "json_object" },
      seed: 0,
    });
    return new Right(chatCompletion.choices[0].message.content || "");
  } catch (error) {
    return new Left(error as Error);
  }
};

export const fixCompletion = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[],
  wrongResponse: string,
  signal: AbortSignal,
  model: string,
  apiKey: string,
  errors: Array<string>
): Promise<Either<Error, string>> {
  const openai = new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true,
  });
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
    const chatCompletion = await openai.chat.completions.create({
      messages: msgs,
      model: model,
      response_format: { type: "json_object" },
      seed: 0,
    });
    return new Right(chatCompletion.choices[0].message.content || "");
  } catch (error) {
    return new Left(error as Error);
  }
};
