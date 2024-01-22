import { useState, useEffect } from "react";
import { fixCompletion, translateBatch } from "./ai";
import { Phrase } from "./srtutils";
import { batchSize } from "./translate";
import { convertToPhraseObject } from "./srtutils";
import {
  convertStringToExpectedObject,
  ExpectedObject,
  areKeysEqual,
} from "./aiutils";

const fetchData = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[]
): Promise<[Error | null, string]> {
  const response = await translateBatch(initPrompt, context, batch);
  if (response.isLeft()) {
    return [response.value, ""];
  }

  const translations = response.value;
  let parsed: ExpectedObject | null = null;
  try {
    parsed = convertStringToExpectedObject(translations);
  } catch (err) {
    console.log(err);
  }

  const correct = convertToPhraseObject(batch);
  if (!parsed || !areKeysEqual(correct, parsed)) {
    const fixedResponse = await fixCompletion(
      initPrompt,
      context,
      batch,
      translations
    );

    if (fixedResponse.isLeft()) {
      return [fixedResponse.value, response.value];
    }

    try {
      parsed = convertStringToExpectedObject(fixedResponse.value);
    } catch (err) {
      return [err as Error, fixedResponse.value];
    }
  }
  if (!parsed || !areKeysEqual(correct, parsed)) {
    return [
      new Error("Number of subtitles don't match"),
      JSON.stringify(parsed, null, 4),
    ];
  }
  return [null, JSON.stringify(parsed, null, 4)];
};

export type BatchComponentProps = {
  numBatches: number;
  phrases: Phrase[];
  initPrompt: string;
  batchShown: number | string;
  setBatchShown: (_: number | string) => void;
  setBatchInput: (_: string) => void;
  setErr: (_: string) => void;
  setOutput: (_: string) => void;
};

const BatchItem: React.FC<{
  index: number;
  isOK: boolean | null;
}> = ({ index, isOK }) => {
  const showBatch = (i: number) => {
    // setBatchShown(i);
    // setBatchInput(JSON.stringify(convertToPhraseObject(batch), null, 4));
    // if (batchError) {
    //   setErr((batchError as Error).message);
    // } else {
    //   setErr("");
    // }
    // setOutput(batchOutput);
  };

  return (
    <div
      className="batch-item"
      id={`batch_${index}`}
      onClick={async () => {
        showBatch(index);
      }}
    >
      {isOK === null && (
        <img src="./loading.gif" className="loading" alt="loading" />
      )}
      {isOK === true && (
        <img src="./check-mark.png" className="loading" alt="ok" />
      )}
      {isOK === false && (
        <img src="./red-cross.png" className="loading" alt="failed" />
      )}
      {`Batch ${index}`}
    </div>
  );
};

export const BatchComponent: React.FC<BatchComponentProps> = ({
  numBatches,
  phrases,
  initPrompt,
  batchShown,
  setBatchShown,
  setBatchInput,
  setErr,
  setOutput,
}) => {
  const [batchDataResults, setBatchDataResults] = useState<
    Array<[Error | null, string]>
  >([]);

  useEffect(() => {
    const fetchDataForAllBatches = async () => {
      const fetchPromises = Array.from({ length: numBatches }, (_, i) => {
        const start = i * batchSize;
        const end = start + batchSize;
        const currentBatch = phrases.slice(start, end);
        const previousBatch =
          i > 0 ? phrases.slice(start - batchSize, start) : [];

        return fetchData(initPrompt, previousBatch, currentBatch);
      });

      const results = await Promise.all(fetchPromises);
      setBatchDataResults(results);
    };

    fetchDataForAllBatches();
  }, [numBatches, phrases, initPrompt]);

  const getBatchStatus = (index: number): boolean | null => {
    const result = batchDataResults[index];
    if (result === undefined) {
      return null;
    }
    return result[0] === null;
  };

  return (
    <>
      {Array.from({ length: numBatches }, (_, i) => {
        return <BatchItem index={i} isOK={getBatchStatus(i)} />;
      })}
    </>
  );
};
