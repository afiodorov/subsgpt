import { Phrase } from "./srtutils";

export const translateBatch = async function (
  context: Phrase[],
  batch: Phrase[]
): Promise<string> {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      reject(new Error("An error occurred"));
    }, 1000);
  });
};
