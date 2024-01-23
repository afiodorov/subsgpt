import { Either, Left, Right } from "./either";

type NumericKeyObject = {
  [key: number]: string | object;
};

export type ExpectedObject = {
  [key: number]: string;
};

function processTranslation(
  translation: NumericKeyObject
): Either<Error, ExpectedObject> {
  const result: ExpectedObject = {};

  for (const key in translation) {
    if (translation.hasOwnProperty(key)) {
      let value: any = translation[key];

      if (typeof value === "string") {
        try {
          value = JSON.parse(value);
        } catch {}
      }

      if (typeof value === "object" && value !== null) {
        const keys = Object.keys(value);
        if (keys.length === 1) {
          value = value[keys[0]];
        } else {
          return new Left(new Error(`Unknown dict: ${JSON.stringify(value)}`));
        }
      }

      if (typeof value !== "string") {
        return new Left(new Error(`Wrong type: ${JSON.stringify(value)}`));
      }

      result[key] = value;
    }
  }

  return new Right(result);
}

export function convertStringToExpectedObject(str: string): ExpectedObject {
  let parsedObj: any;
  try {
    parsedObj = JSON.parse(str);
  } catch (error) {
    throw new Error(`Failed to parse JSON: ${(error as Error).message}`);
  }

  const result: { [key: number]: object | string } = {};
  for (const key in parsedObj) {
    if (parsedObj.hasOwnProperty(key)) {
      const numericKey = Number(key);
      if (isNaN(numericKey)) {
        throw new Error(`All keys must be numeric: ${key} is not`);
      }
      const value = parsedObj[key];
      if (typeof value !== "string" && typeof value !== "object") {
        throw new Error(`Value for key '${key}' must be a string or an object`);
      }
      result[numericKey] = value;
    }
  }

  const res = processTranslation(result);
  if (res.isLeft()) {
    throw res.value;
  }

  return res.value;
}

export const areKeysEqual = function (
  obj1: ExpectedObject,
  obj2: ExpectedObject
): boolean {
  const keys1 = new Set(Object.keys(obj1).map(Number));
  const keys2 = new Set(Object.keys(obj2).map(Number));

  return keys1.size === keys2.size && [...keys1].every((key) => keys2.has(key));
};
