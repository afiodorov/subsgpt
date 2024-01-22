import { useState, useEffect } from "react";
import { translateBatch } from "./ai";
import { Phrase } from "./srtutils";
import { batchSize } from "./translate";
import { convertToPhraseObject } from "./srtutils";

export type BatchComponentProps = {
  numBatches: number;
  phrases: Phrase[];
  initPrompt: string;
  batchShown: number | string;
  setBatchShown: (_: number | string) => void;
  setBatchInput: (_: string) => void;
  setErr: (_: string) => void;
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
}> = ({
  index,
  context,
  batch,
  initPrompt,
  batchShown,
  setBatchShown,
  setBatchInput,
  setErr,
}) => {
  const [isOK, setIsOK] = useState<boolean | null>(null);
  const [batchError, setBatchErr] = useState<Error | null>(null);

  const showBatch = (i: number) => {
    setBatchShown(i);
    setBatchInput(JSON.stringify(convertToPhraseObject(batch), null, 4));
    if (batchError) {
      setErr((batchError as Error).message);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await translateBatch(initPrompt, context, batch);
      } catch (err) {
        if (err instanceof Error) {
          setBatchErr(err);
          if (batchShown === index) {
            setErr(err.message);
          }
        }
        setIsOK(false);
      }
    };

    fetchData();
  }, [index, context, initPrompt, batch, batchShown, setErr]);

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
          />
        );
      })}
    </>
  );
};
