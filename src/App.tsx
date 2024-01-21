import { useState, useEffect } from "react";
import "./App.css";
import { Editor } from "./editor";
import { uploadAndStoreFile } from "./fileutils";
import { translate } from "./prompts";
import { translateHandler } from "./translate";
import { useLocalStorageSetter } from "./storage";
import { BatchComponent } from "./batches";
import { Phrase } from "./srtutils";

function App() {
  const [original, setOriginal] = useState<string>(
    localStorage.getItem("uploadedFile") || ""
  );
  const [translated, setTranslated] = useState<string>("");
  const [isTranslating, setIsTranslating] = useState<boolean>(false);
  const [err, setErr] = useState<string>(localStorage.getItem("err") || "");
  const [showResult, setShowResult] = useState<boolean>(false);
  const [initPrompt, setInitPrompt] = useState<string>(
    localStorage.getItem("initPrompt") || translate
  );
  const [numBatches, setNumBatches] = useState<number>(0);
  const [phrases, setPhrases] = useState<Phrase[]>(
    JSON.parse(localStorage.getItem("phrases") || "[]")
  );
  const [batchShown, setBatchShown] = useState<number | string>("");
  const [batchInput, setBatchInput] = useState<string>(
    localStorage.getItem("batchInput") || ""
  );

  const setIsTranslatingAndStore = useLocalStorageSetter(
    setIsTranslating,
    "isTranslating"
  );
  const setOriginalAndStore = useLocalStorageSetter(
    setOriginal,
    "uploadedFile",
    false
  );
  const setNumBatchesAndStore = useLocalStorageSetter(
    setNumBatches,
    "numBatches"
  );
  const setInitPromptAndStore = useLocalStorageSetter(
    setInitPrompt,
    "initPrompt",
    false
  );
  const setBatchShownAndStore = useLocalStorageSetter(
    setBatchShown,
    "batchShown"
  );
  const setBatchInputAndStore = useLocalStorageSetter(
    setBatchInput,
    "batchInput",
    false
  );
  const setPhrasesAndStore = useLocalStorageSetter(setPhrases, "phrases");
  const setErrAndStore = useLocalStorageSetter(setErr, "err", false);

  useEffect(() => {
    const isTranslating = JSON.parse(
      localStorage.getItem("isTranslating") || "false"
    );
    if (isTranslating) {
      setIsTranslating(true);
    }

    const numBatches = JSON.parse(localStorage.getItem("numBatches") || "0");
    if (typeof numBatches === "number" && !isNaN(numBatches)) {
      setNumBatches(numBatches);
    }

    const batchShown = JSON.parse(localStorage.getItem("batchShown") || '""');
    if (typeof batchShown === "number" && !isNaN(batchShown)) {
      setBatchShown(batchShown);
    }
  }, [setIsTranslating]);

  return (
    <div className="App">
      <div className="header">
        <div>
          <img src="./logo.webp" className="logo" alt="logo"></img>
        </div>
        <div className="title">Translate Subtitles</div>
      </div>
      <div className="original">
        {batchShown === "" && (
          <Editor
            name="original"
            text={original}
            setText={setOriginalAndStore}
            readOnly={isTranslating}
          />
        )}
        {batchShown !== "" && (
          <Editor
            name="batch"
            text={batchInput}
            setText={setBatchInputAndStore}
            readOnly={true}
          />
        )}
      </div>
      <div className="translated">
        {showResult ? (
          <Editor name="translated" text={translated} setText={setTranslated} />
        ) : (
          <>
            <div className="heading">Prompt</div>
            {isTranslating ? (
              <span>{initPrompt}</span>
            ) : (
              <Editor
                name="prompt"
                text={initPrompt}
                setText={setInitPromptAndStore}
                height="150px"
              />
            )}
            {err !== "" && (
              <>
                <span className="heading">Errors</span>
                <div className="errors">{err}</div>
              </>
            )}
          </>
        )}
      </div>
      <div className="buttons_original">
        {batchShown === "" && (
          <button
            onClick={async () => {
              setOriginalAndStore("");
            }}
            disabled={isTranslating}
          >
            Clear
          </button>
        )}
        {batchShown !== "" && (
          <button
            onClick={async () => {
              setBatchShownAndStore("");
            }}
          >
            Close
          </button>
        )}
        {batchShown === "" && (
          <button
            onClick={async () => uploadAndStoreFile(setOriginal)}
            disabled={isTranslating}
          >
            Upload .srt
          </button>
        )}
      </div>
      <div className="buttons_translated">
        <button
          onClick={async () => {
            setErrAndStore("");
            setInitPromptAndStore(translate);
            setNumBatchesAndStore(0);
            setIsTranslatingAndStore(false);
            setBatchShownAndStore("");
            setPhrasesAndStore([]);
          }}
        >
          Reset
        </button>
        <button disabled={true}>Download</button>
        <button
          disabled={isTranslating}
          onClick={async () =>
            translateHandler(
              original,
              setErrAndStore,
              setNumBatchesAndStore,
              setIsTranslatingAndStore,
              setPhrasesAndStore
            )
          }
        >
          Translate
        </button>
      </div>
      <div className="batch" id="batch">
        <BatchComponent
          numBatches={numBatches}
          phrases={phrases}
          initPrompt={initPrompt}
          setBatchShown={setBatchShownAndStore}
          setBatchInput={setBatchInputAndStore}
          setErr={setErrAndStore}
        />
      </div>
      <div className="footer"></div>
      <div className="space"></div>
    </div>
  );
}

export default App;
