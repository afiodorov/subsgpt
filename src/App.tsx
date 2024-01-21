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
  const [err, setErr] = useState<string>("");
  const [showResult, setShowResult] = useState<boolean>(false);
  const [initPrompt, setInitPrompt] = useState<string>(
    localStorage.getItem("initPrompt") || translate
  );
  const [numBatches, setNumBatches] = useState<number>(0);
  const [phrases, setPhrases] = useState<Phrase[]>([]);

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
  });

  return (
    <div className="App">
      <div className="header">
        <div>
          <img src="./logo.webp" className="logo"></img>
        </div>
        <div className="title">Translate Subtitles</div>
      </div>
      <div className="original">
        <Editor name="original" text={original} setText={setOriginalAndStore} />
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
        <button
          onClick={async () => {
            setOriginalAndStore("");
          }}
        >
          Clear
        </button>
        <button onClick={async () => uploadAndStoreFile(setOriginal)}>
          Upload .srt
        </button>
      </div>
      <div className="buttons_translated">
        <button
          onClick={async () => {
            setErr("");
            setInitPromptAndStore(translate);
            setNumBatchesAndStore(0);
            setIsTranslatingAndStore(false);
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
              setErr,
              setNumBatchesAndStore,
              setIsTranslatingAndStore,
              setPhrases
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
        />
      </div>
      <div className="footer"></div>
      <div className="space"></div>
    </div>
  );
}

export default App;
