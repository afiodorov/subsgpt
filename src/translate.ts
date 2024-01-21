import { parse, Phrase } from "./srtutils";

export const batchSize = 20;

export function translateHandler(
  text: string,
  setErr: (err: string) => void,
  setNumBatches: (b: number) => void,
  setIsTranslating: (_: boolean) => void,
  setPhrases: (_: Phrase[]) => void
) {
  setIsTranslating(true);

  const subs = parse(text);
  if (subs.isLeft()) {
    setErr(subs.value);
    return;
  }
  setErr("");
  const numBatches = Math.ceil(subs.value.length / batchSize);
  setNumBatches(numBatches);
  setPhrases(subs.value);
}
