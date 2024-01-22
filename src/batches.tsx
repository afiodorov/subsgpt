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
  context: Phrase[];
  batch: Phrase[];
  initPrompt: string;
  batchShown: number | string;
  setBatchShown: (_: number | string) => void;
  setBatchInput: (_: string) => void;
  setErr: (_: string) => void;
  setOutput: (_: string) => void;
}> = ({
  index,
  context,
  batch,
  initPrompt,
  batchShown,
  setBatchShown,
  setBatchInput,
  setErr,
  setOutput,
}) => {
  const [isOK, setIsOK] = useState<boolean | null>(null);
  const [batchError, setBatchErr] = useState<Error | null>(null);
  const [batchOutput, setBatchOutput] = useState<string>("");

  const showBatch = (i: number) => {
    setBatchShown(i);
    setBatchInput(JSON.stringify(convertToPhraseObject(batch), null, 4));
    if (batchError) {
      setErr((batchError as Error).message);
    } else {
      setErr("");
    }
    setOutput(batchOutput);
  };

  useEffect(() => {
    const handleError = (err: any, idx: number, output: string) => {
      if (err instanceof Error) {
        console.log(err);
        setBatchErr(err);
        setBatchOutput(output);
        if (batchShown === idx) {
          setErr(err.message);
          setOutput(output);
        }
      }
      setIsOK(false);
    };

    const fetchData = async () => {
      const response = await translateBatch(initPrompt, context, batch);
      if (response.isLeft()) {
        handleError(response.value, index, "");
        return;
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
          handleError(fixedResponse.value, index, response.value);
          return;
        }

        try {
          parsed = convertStringToExpectedObject(fixedResponse.value);
        } catch (err) {
          handleError(err, index, fixedResponse.value);
          return;
        }
      }
      if (!parsed || !areKeysEqual(correct, parsed)) {
        handleError(
          new Error("Number of subtitles don't match"),
          index,
          JSON.stringify(parsed, null, 4)
        );
        return;
      }
      setBatchOutput(JSON.stringify(parsed, null, 4));
      if (batchShown === index) {
        setOutput(batchOutput);
      }
      setIsOK(true);
    };

    fetchData();
  }, [
    index,
    context,
    initPrompt,
    batch,
    batchShown,
    setErr,
    batchOutput,
    setOutput,
  ]);

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
  return (
    <>
      {Array.from({ length: numBatches }, (_, i) => {
        const start = i * batchSize;
        const end = start + batchSize;
        const currentBatch = phrases.slice(start, end);
        const previousBatch =
          i > 0 ? phrases.slice(start - batchSize, start) : [];

        return (
          <BatchItem
            key={i}
            index={i}
            batch={currentBatch}
            context={previousBatch}
            initPrompt={initPrompt}
            batchShown={batchShown}
            setBatchShown={setBatchShown}
            setBatchInput={setBatchInput}
            setErr={setErr}
            setOutput={setOutput}
          />
        );
      })}
    </>
  );
};
