import { useState } from "react";

export type BatchComponentProps = {
  numBatches: number;
};

const BatchItem: React.FC<{ index: number }> = ({ index }) => {
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const showBatch = () => {
    setIsLoading(false);
  };

  return (
    <div className="batch-item" id={`batch_${index}`} onClick={showBatch}>
      {isLoading && <img src="./loading.gif" className="loading" />}
      {`Batch ${index}`}
    </div>
  );
};

export const BatchComponent: React.FC<BatchComponentProps> = ({
  numBatches,
}) => {
  return (
    <>
      {Array.from({ length: numBatches }, (_, i) => (
        <BatchItem key={i} index={i} />
      ))}
    </>
  );
};

export default BatchComponent;
