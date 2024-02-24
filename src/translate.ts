import { Dispatch, SetStateAction } from "react";
import { parse, Phrase } from "./srtutils";
import { convertToPhraseObject } from "./srtutils";
import { validateBatch } from "./validate";
import { convertStringToExpectedObject, ExpectedObject } from "./aiutils";

export const batchSize = 20;

export function translateHandler(
  text: string,
  setErr: (err: string) => void,
  setNumBatches: (b: number) => void,
  setPhrases: (_: Phrase[]) => void
) {
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

export function editBatchHandler(
  index: number,
  results: string,
  setBatchDataResults: Dispatch<
    SetStateAction<Array<[string, string] | undefined | null>>
  >
) {
  setBatchDataResults((prevResults) => {
    const newResults = [...prevResults];
    const prev = prevResults[index];

    let err = "";
    if (prev !== undefined && prev !== null) {
      err = prev[0];
    }
    newResults[index] = [err, results];
    return newResults;
  });
}

export function validateHandler(
  index: number,
  phrases: Phrase[],
  setBatchDataResults: Dispatch<
    SetStateAction<Array<[string, string] | undefined | null>>
  >,
  setErr: (_: string) => void
) {
  const start = index * batchSize;
  const end = start + batchSize;
  const correct = convertToPhraseObject(phrases.slice(start, end));

  setBatchDataResults((prevResults) => {
    const prev = prevResults[index];
    if (prev === undefined || prev === null) {
      return prevResults;
    }

    const newResults = [...prevResults];

    const errors = validateBatch(correct, prev[1]);
    if (errors.length > 0) {
      const err = errors[0];
      newResults[index] = [err, prev[1]];
      setErr(err);
      return newResults;
    }

    newResults[index] = ["", prev[1]];
    setErr("");
    return newResults;
  });
}

export function formatBatch(input: string): string {
  let parsed: ExpectedObject | null = null;
  try {
    parsed = convertStringToExpectedObject(input);
  } catch (err) {
    return "";
  }

  if (!parsed) {
    return "";
  }

  return JSON.stringify(parsed, null, 4);
}

export function formatHandler(
  index: number,
  setBatchDataResults: Dispatch<
    SetStateAction<Array<[string, string] | undefined | null>>
  >,
  setBatchOutput: (v: string) => void
) {
  setBatchDataResults((prevResults) => {
    const prev = prevResults[index];
    if (prev === undefined || prev === null) {
      return prevResults;
    }

    const value = formatBatch(prev[1]);
    if (!value) {
      console.log(`Format returned empty string.`);
      return prevResults;
    }

    const newResults = [...prevResults];
    newResults[index] = [prev[0], value];
    setBatchOutput(value);
    return newResults;
  });
}

export function downloadTranslatedFileHandler(translated: string) {
  const blob = new Blob([translated], { type: "text/plain" });
  const href = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = href;
  link.download = "translated.srt";
  document.body.appendChild(link);
  link.click();

  document.body.removeChild(link);
  URL.revokeObjectURL(href);
}

export function makeResultHandler(
  isDone: () => boolean,
  phrases: Phrase[],
  batchDataResults: Array<[string, string] | undefined | null>,
  setTranslated: (s: string) => void
) {
  let res = "";
  if (!isDone()) {
    return;
  }

  for (let i = 0; i < phrases.length; i++) {
    const phrase = phrases[i];
    const batchNumber = Math.floor(i / batchSize);
    const batch = batchDataResults[batchNumber];
    if (!batch) {
      console.log("expected batch");
      return;
    }

    let parsed: ExpectedObject | null = null;
    try {
      parsed = convertStringToExpectedObject(batch[1]);
    } catch (error) {
      console.log(`should have parsed: ${error}`);
      return;
    }
    if (!parsed) {
      console.log("parsed is null");
      return;
    }

    const translated = parsed[i + 1];
    if (!translated) {
      console.log(`not translated for batch ${batchNumber} phrase ${i}`);
      return;
    }

    res += `${phrase.number}\n${phrase.time}\n${translated}`;
    if (i !== phrases.length - 1) {
      res += "\n\n";
    }
  }

  setTranslated(res);
}
