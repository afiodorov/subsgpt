import {
  ExpectedObject,
  areKeysEqual,
  convertStringToExpectedObject,
} from "./aiutils";

export function validateBatch(
  correct: ExpectedObject,
  batch: string
): Array<string> {
  const res: Array<string> = [];
  let parsed: ExpectedObject | null = null;

  try {
    parsed = convertStringToExpectedObject(batch);
  } catch (err) {
    res.push((err as Error).message);
    return res;
  }

  if (!areKeysEqual(correct, parsed)) {
    const keys = Object.keys(correct).map(Number);
    res.push(
      `Translated object keys should be a range from ${keys[0]} to ${
        keys[keys.length - 1]
      }.`
    );
  }

  for (const key in parsed) {
    if (!parsed[key]) {
      const err = `Subtitle at key ${key} is empty.`;
      res.push(err);
    }
  }

  return res;
}
