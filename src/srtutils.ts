import { Either, Right, Left } from "./either";

export class Phrase {
  number: number;
  time: string;
  text: string;

  constructor(number: number, time: string, text: string) {
    this.number = number;
    this.time = time;
    this.text = text;
  }
}

export function convertToPhraseObject(phrases: Phrase[]): {
  [key: number]: string;
} {
  return phrases.reduce((obj, phrase) => {
    obj[phrase.number] = phrase.text;
    return obj;
  }, {} as { [key: number]: string });
}

export function parse(text: string): Either<string, Phrase[]> {
  try {
    const lines = text.trim().split("\n\n");
    const phrases: Phrase[] = [];

    for (let line of lines) {
      const parts = line.split("\n");
      const num = parseInt(parts[0]);
      const time = parts[1];
      const text = parts.slice(2).join("\n");

      if (isNaN(num)) {
        throw new Error(
          `Invalid input format: ${parts[0]} couldn't be parsed as number`
        );
      }
      if (!time || !text) {
        throw new Error(
          `Invalid input format: ${parts} couldn't be parsed as .srt phrase`
        );
      }

      phrases.push(new Phrase(num, time, text));
    }

    return new Right(phrases);
  } catch (error) {
    return new Left((error as Error).message);
  }
}
