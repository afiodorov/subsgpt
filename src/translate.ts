import { Dispatch, SetStateAction } from "react";
import { parse, Phrase } from "./srtutils";
import { convertToPhraseObject } from "./srtutils";
import {
  convertStringToExpectedObject,
  areKeysEqual,
  ExpectedObject,
} from "./aiutils";

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

    let parsed: ExpectedObject | null = null;
    const newResults = [...prevResults];
    try {
      parsed = convertStringToExpectedObject(prev[1]);
    } catch (err) {
      newResults[index] = [(err as Error).message, prev[1]];
      setErr((err as Error).message);
      return newResults;
    }

    if (!parsed || !areKeysEqual(correct, parsed)) {
      const err = "Number of subtitles don't match";
      newResults[index] = [err, prev[1]];
      setErr(err);
      return newResults;
    }

    newResults[index] = ["", prev[1]];
    setErr("");
    return newResults;
  });
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

    let parsed: ExpectedObject | null = null;
    try {
      parsed = convertStringToExpectedObject(prev[1]);
    } catch (err) {
      return prevResults;
    }

    if (!parsed) {
      return prevResults;
    }

    const newResults = [...prevResults];
    const value = JSON.stringify(parsed, null, 4);
    newResults[index] = [prev[0], value];
    setBatchOutput(value);
    return newResults;
  });
}
