import { Phrase } from "./srtutils";
import { Either, Right, Left } from "./either";

export const translateBatch = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[],
  signal: AbortSignal
): Promise<Either<Error, string>> {
  const randomNumber = Math.floor(Math.random() * 5_000);
  await new Promise((resolve) => setTimeout(resolve, randomNumber));
  return new Right('{"10": "hi"}');
};

export const fixCompletion = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[],
  wrongResponse: string,
  signal: AbortSignal
): Promise<Either<Error, string>> {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const randomNumber = Math.floor(Math.random() * 101);
  return new Right(`{"${randomNumber}": "hi"}`);
};
