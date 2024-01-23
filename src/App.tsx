import { useState, useEffect } from "react";
import "./App.css";
import { Editor } from "./editor";
import { uploadAndStoreFile } from "./fileutils";
import { translate } from "./prompts";
import {
  downloadTranslatedFileHandler,
  translateHandler,
  editBatchHandler,
  validateHandler,
  formatHandler,
  makeResultHandler,
} from "./translate";
import { useLocalStorageSetter } from "./storage";
import { BatchComponent } from "./batches";
import { Phrase } from "./srtutils";

function App() {
  const [translateClicked, setTranslateClicked] = useState<boolean>(
    JSON.parse(localStorage.getItem("translateClicked") || "false")
  );
  const [original, setOriginal] = useState<string>(
    localStorage.getItem("uploadedFile") || ""
  );
  const [translated, setTranslated] = useState<string>(
    localStorage.getItem("translated") || ""
  );
  const [err, setErr] = useState<string>(localStorage.getItem("err") || "");
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
  const [batchErr, setBatchErr] = useState<string>(
    localStorage.getItem("batchErr") || ""
  );
  const [batchOutput, setBatchOutput] = useState<string>(
    localStorage.getItem("batchOutput") || ""
  );

  const setTranslateClickedAndStore = useLocalStorageSetter(
    setTranslateClicked,
    "translateClicked"
  );

  const setTranslatedAndStore = useLocalStorageSetter(
    setTranslated,
    "translated",
    false
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
  const setBatchErrAndStore = useLocalStorageSetter(
    setBatchErr,
    "batchErr",
    false
  );
  const setBatchOutputAndStore = useLocalStorageSetter(
    setBatchOutput,
    "batchOutput",
    false
  );

  useEffect(() => {
    const numBatches = JSON.parse(localStorage.getItem("numBatches") || "0");
    if (typeof numBatches === "number" && !isNaN(numBatches)) {
      setNumBatches(numBatches);
    }

    const batchShown = JSON.parse(localStorage.getItem("batchShown") || '""');
    if (typeof batchShown === "number" && !isNaN(batchShown)) {
      setBatchShown(batchShown);
    }
  }, [setNumBatches]);

  const [batchDataResults, setBatchDataResults] = useState<
    Array<[string, string] | undefined | null>
  >(
    (
      JSON.parse(
        localStorage.getItem("batchDataResults") ||
          JSON.stringify(new Array(numBatches))
      ) as Array<[string, string] | null>
    ).map((v: [string, string] | null) => {
      if (v === null) {
        return undefined;
      }
      return v;
    })
  );

  const setBatchDataResultsAndStore = useLocalStorageSetter(
    setBatchDataResults,
    "batchDataResults"
  );

  const isTranslating = () => {
    return batchDataResults.length !== 0;
  };

  const isDone = () => {
    if (batchDataResults.length === 0) {
      return false;
    }
    return batchDataResults.every((x) => x && x[0] === "");
  };

  return (
    <div className="App">
      <div className="header">
        <div>
          <img src="./logo.webp" className="logo" alt="logo"></img>
        </div>
        <div className="title">Translate Subtitles</div>
      </div>
      <div className="original">
        {batchShown === "" ? (
          <Editor
            name="original"
            text={original}
            setText={setOriginalAndStore}
            readOnly={isTranslating()}
          />
        ) : (
          <>
            <Editor
              name="batch"
              text={batchInput}
              setText={setBatchInputAndStore}
              readOnly={true}
              height={"400px"}
            />
            <div className="heading">Prompt</div>
            <span className="static-prompt-small">{initPrompt}</span>
          </>
        )}
      </div>
      <div className="translated">
        {batchShown === "" &&
          (isDone() ? (
            <Editor
              name="translated"
              text={translated}
              setText={setTranslated}
            />
          ) : (
            <>
              <div className="heading">Prompt</div>
              {isTranslating() ? (
                <span className="static-prompt-large">{initPrompt}</span>
              ) : (
                <Editor
                  name="prompt"
                  text={initPrompt}
                  setText={setInitPromptAndStore}
                  height="400px"
                />
              )}
              {err !== "" && (
                <>
                  <div className="expand"></div>
                  <span className="heading">Errors</span>
                  <div className="errors">{err}</div>
                </>
              )}
            </>
          ))}
        {batchShown !== "" && (
          <>
            <Editor
              name="batchOutput"
              text={batchOutput}
              setText={(batchOutput: string) => {
                if (typeof batchShown === "number") {
                  editBatchHandler(
                    batchShown,
                    batchOutput,
                    setBatchDataResultsAndStore
                  );
                }
                setBatchOutputAndStore(batchOutput);
              }}
              height="400px"
              readOnly={batchDataResults.some(
                (x) => x === undefined || x === null
              )}
            />
            {batchErr !== "" && (
              <>
                <div className="expand"></div>
                <span className="heading">Errors</span>
                <div className="errors">{batchErr}</div>
              </>
            )}
          </>
        )}
      </div>
      <div className="buttons_original">
        {batchShown !== "" && (
          <span className="side-heading">Batch {batchShown}</span>
        )}
        {batchShown === "" && (
          <button
            onClick={async () => {
              setOriginalAndStore("");
            }}
            disabled={isTranslating()}
          >
            Clear
          </button>
        )}
        {batchShown !== "" && (
          <button
            onClick={async () => {
              setBatchShownAndStore("");
              if (translated) {
                return;
              }
              makeResultHandler(
                isDone,
                phrases,
                batchDataResults,
                setTranslatedAndStore
              );
            }}
          >
            Close
          </button>
        )}
        {batchShown === "" && (
          <button
            onClick={async () => uploadAndStoreFile(setOriginal)}
            disabled={isTranslating()}
          >
            Upload .srt
          </button>
        )}
      </div>
      <div className="buttons_translated">
        {batchShown === "" ? (
          <>
            <button
              onClick={() => setTranslatedAndStore("")}
              disabled={translated === ""}
            >
              Clear
            </button>
            <button
              onClick={async () => {
                setErrAndStore("");
                setBatchErrAndStore("");
                setInitPromptAndStore(translate);
                setNumBatchesAndStore(0);
                setBatchShownAndStore("");
                setPhrasesAndStore([]);
                setBatchDataResultsAndStore([]);
                setTranslatedAndStore("");
                setOriginalAndStore("");
                setTranslateClickedAndStore(false);
              }}
            >
              Restart
            </button>
            <button
              disabled={!isDone() || translated === ""}
              onClick={() => downloadTranslatedFileHandler(translated)}
            >
              Download
            </button>
            {!isTranslating() ? (
              <button
                disabled={isTranslating()}
                onClick={async () => {
                  setTranslateClickedAndStore(true);
                  translateHandler(
                    original,
                    setErrAndStore,
                    setNumBatchesAndStore,
                    setPhrasesAndStore
                  );
                }}
              >
                Translate
              </button>
            ) : (
              <button
                disabled={!isDone() || translated != ""}
                onClick={() =>
                  makeResultHandler(
                    isDone,
                    phrases,
                    batchDataResults,
                    setTranslatedAndStore
                  )
                }
              >
                Result
              </button>
            )}
          </>
        ) : (
          <>
            <button
              onClick={async () => {
                if (typeof batchShown !== "number") {
                  return;
                }

                validateHandler(
                  batchShown,
                  phrases,
                  setBatchDataResultsAndStore,
                  setBatchErrAndStore
                );
              }}
              disabled={batchDataResults.some(
                (x) => x === undefined || x === null
              )}
            >
              Validate
            </button>
            <button
              disabled={batchDataResults.some(
                (x) => x === undefined || x === null
              )}
              onClick={async () => {
                if (typeof batchShown === "number") {
                  formatHandler(
                    batchShown,
                    setBatchDataResultsAndStore,
                    setBatchOutputAndStore
                  );
                }
              }}
            >
              Format
            </button>
          </>
        )}
      </div>
      <div className="batch" id="batch">
        <BatchComponent
          numBatches={numBatches}
          phrases={phrases}
          initPrompt={initPrompt}
          setBatchShown={setBatchShownAndStore}
          setBatchInput={setBatchInputAndStore}
          setErr={setBatchErrAndStore}
          setOutput={setBatchOutputAndStore}
          batchDataResults={batchDataResults}
          setBatchDataResults={setBatchDataResultsAndStore}
        />
      </div>
      <div className="footer"></div>
      <div className="space"></div>
    </div>
  );
}

export default App;
