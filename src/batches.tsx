import { useEffect, Dispatch, SetStateAction } from "react";
import { translateBatch, fixCompletion, APIKeys } from "./ai-refactored";
import { Phrase } from "./srtutils";
import { batchSize, formatBatch } from "./translate";
import { convertToPhraseObject } from "./srtutils";
import { validateBatch } from "./validate";

const fetchData = async function (
  initPrompt: string,
  context: Phrase[],
  batch: Phrase[],
  signal: AbortSignal,
  model: string,
  apiKeys: APIKeys
): Promise<[string, string]> {
  try {
    const response = await translateBatch(
      initPrompt,
      context,
      batch,
      signal,
      model,
      apiKeys
    );
    
    if (response.isLeft()) {
      return [response.value.message, ""];
    }

    let translations = response.value;
    const correct = convertToPhraseObject(batch);

    let errors = validateBatch(correct, translations);
    if (errors.length > 0) {
      const fixedResponse = await fixCompletion(
        initPrompt,
        context,
        batch,
        translations,
        signal,
        model,
        apiKeys,
        errors
      );

      if (fixedResponse.isLeft()) {
        return [fixedResponse.value.message, response.value];
      }

      translations = fixedResponse.value;
      errors = validateBatch(correct, fixedResponse.value);
    }

    if (errors.length > 0) {
      return [errors[0], translations];
    }
    return ["", formatBatch(translations) || translations];
  } catch (error) {
    return [(error as Error).message, ""];
  }
};

export type BatchComponentProps = {
  numBatches: number;
  phrases: Phrase[];
  initPrompt: string;
  setBatchShown: (_: number | string) => void;
  setBatchInput: (_: string) => void;
  setErr: (_: string) => void;
  setOutput: (_: string) => void;
  batchDataResults: Array<[string, string] | undefined | null>;
  setBatchDataResults: Dispatch<
    SetStateAction<Array<[string, string] | undefined | null>>
  >;
  model: string;
  apiKeys: APIKeys;
};

const BatchItem: React.FC<{
  index: number;
  isOK: boolean | null;
  showBatch: () => void;
}> = ({ index, isOK, showBatch }) => {
  return (
    <div className="batch-item" id={`batch_${index}`} onClick={showBatch}>
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
  setBatchShown,
  setBatchInput,
  setErr,
  setOutput,
  batchDataResults,
  setBatchDataResults,
  model,
  apiKeys,
}) => {
  const batches = new Array<string>();
  for (let i = 0; i < numBatches; i++) {
    const start = i * batchSize;
    const end = start + batchSize;
    const batch = phrases.slice(start, end);
    batches.push(JSON.stringify(convertToPhraseObject(batch), null, 4));
  }

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const fetchDataForBatch = async (index: number) => {
      if (batchDataResults[index] === null) {
        return;
      }
      
      setBatchDataResults((prevResults) => {
        const newResults = [...prevResults];
        if (newResults[index] === undefined) {
          newResults[index] = null;
        }
        return newResults;
      });

      const start = index * batchSize;
      const end = start + batchSize;
      const currentBatch = phrases.slice(start, end);
      const previousBatch =
        index > 0 ? phrases.slice(start - batchSize, start) : [];

      try {
        const result = await fetchData(
          initPrompt,
          previousBatch,
          currentBatch,
          signal,
          model,
          apiKeys
        );

        setBatchDataResults((prevResults) => {
          if (signal.aborted) {
            return prevResults;
          }
          const newResults = [...prevResults];
          newResults[index] = result;
          return newResults;
        });
      } catch (error) {
        console.error(`Error processing batch ${index}:`, error);
        setBatchDataResults((prevResults) => {
          const newResults = [...prevResults];
          newResults[index] = [(error as Error).message, ""];
          return newResults;
        });
      }
    };

    for (let i = 0; i < numBatches; i++) {
      if (batchDataResults[i] === undefined) {
        fetchDataForBatch(i);
      }
    }

    return () => {
      controller.abort();
    };
  }, [numBatches, phrases, initPrompt, model, apiKeys]);

  const getBatchStatus = (index: number): boolean | null => {
    const result = batchDataResults[index];
    if (result === undefined || result === null) {
      return null;
    }
    return result[0] === "";
  };

  const showBatch = (index: number) => {
    const result = batchDataResults[index];
    if (result === undefined || result === null) {
      return;
    }
    const err = result[0];
    const output = result[1];

    setBatchInput(batches[index]);
    setBatchShown(index);
    setErr(err);
    setOutput(output);
  };

  return (
    <>
      {Array.from({ length: numBatches }, (_, i) => {
        return (
          <BatchItem
            key={i}
            index={i}
            isOK={getBatchStatus(i)}
            showBatch={() => showBatch(i)}
          />
        );
      })}
    </>
  );
};
