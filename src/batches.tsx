import { useState, useEffect } from "react";
import { translateBatch } from "./ai";
import { Phrase } from "./srtutils";
import { batchSize } from "./translate";

export type BatchComponentProps = {
  numBatches: number;
  phrases: Phrase[];
};

const BatchItem: React.FC<{
  index: number;
  context: Phrase[];
  batch: Phrase[];
}> = ({ index, context, batch }) => {
  const [isOK, setIsOK] = useState<boolean | null>(null);

  const showBatch = () => {};

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await translateBatch(context, batch);
      } catch (error) {
        setIsOK(false);
      }
    };

    fetchData();
  }, [index]);

  return (
    <div className="batch-item" id={`batch_${index}`} onClick={showBatch}>
      {isOK === null && <img src="./loading.gif" className="loading" />}
      {isOK === true && <img src="./check-mark.png" className="loading" />}
      {isOK === false && <img src="./red-cross.png" className="loading" />}
      {`Batch ${index}`}
    </div>
  );
};

export const BatchComponent: React.FC<BatchComponentProps> = ({
  numBatches,
  phrases,
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
          />
        );
      })}
    </>
  );
};
