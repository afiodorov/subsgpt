import { useState, useEffect, ChangeEvent, useMemo } from "react";
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
import { ProviderFactory } from "./providers/factory";
import { ProviderType, ModelInfo } from "./providers/types";

function App() {
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
  const [apiKeyShown, setApiKeyShown] = useState(false);
  const [activeProvider, setActiveProvider] = useState<ProviderType>('openai');
  // Store API keys for each provider
  const [openaiKey, setOpenaiKey] = useState(localStorage.getItem("openaiKey") || localStorage.getItem("apiKey") || "");
  const [anthropicKey, setAnthropicKey] = useState(localStorage.getItem("anthropicKey") || "");
  const [googleKey, setGoogleKey] = useState(localStorage.getItem("googleKey") || "");
  
  const [model, setModel] = useState(
    localStorage.getItem("model") || "gpt-4-0125-preview"
  );
  const [availableModels, setAvailableModels] = useState<ModelInfo[]>([]);
  const [modelsLoading, setModelsLoading] = useState(true);
  
  // Determine current provider from selected model
  const currentProvider = ProviderFactory.getProviderFromModel(model);
  

  const setModelAndStore = useLocalStorageSetter(setModel, "model", false);
  const setOpenaiKeyAndStore = useLocalStorageSetter(setOpenaiKey, "openaiKey", false);
  const setAnthropicKeyAndStore = useLocalStorageSetter(setAnthropicKey, "anthropicKey", false);
  const setGoogleKeyAndStore = useLocalStorageSetter(setGoogleKey, "googleKey", false);
  
  // Update the appropriate API key based on current provider
  const setApiKeyAndStore = (value: string) => {
    switch (currentProvider) {
      case 'openai': 
        setOpenaiKeyAndStore(value);
        break;
      case 'anthropic': 
        setAnthropicKeyAndStore(value);
        break;
      case 'google': 
        setGoogleKeyAndStore(value);
        break;
    }
  };

  useEffect(() => {
    const fetchModels = async () => {
      setModelsLoading(true);
      const allModels: ModelInfo[] = [];
      
      // Get static models for all providers
      const staticModels = ProviderFactory.getAllModelInfo();
      
      // Track which providers have API keys and will get dynamic models
      const providersWithKeys = new Set<ProviderType>();
      const providerFetches = [];
      
      if (openaiKey) {
        providersWithKeys.add('openai');
        providerFetches.push(
          ProviderFactory.createProvider('openai', { apiKey: openaiKey })
            .getAvailableModels()
            .then(modelIds => ({ provider: 'openai' as ProviderType, models: modelIds }))
            .catch(error => {
              console.error('Failed to fetch OpenAI models:', error);
              return { provider: 'openai' as ProviderType, models: [] };
            })
        );
      }
      
      if (anthropicKey) {
        providersWithKeys.add('anthropic');
        providerFetches.push(
          ProviderFactory.createProvider('anthropic', { apiKey: anthropicKey })
            .getAvailableModels()
            .then(modelIds => ({ provider: 'anthropic' as ProviderType, models: modelIds }))
            .catch(error => {
              console.error('Failed to fetch Anthropic models:', error);
              return { provider: 'anthropic' as ProviderType, models: [] };
            })
        );
      }
      
      if (googleKey) {
        providersWithKeys.add('google');
        providerFetches.push(
          ProviderFactory.createProvider('google', { apiKey: googleKey })
            .getAvailableModels()
            .then(modelIds => ({ provider: 'google' as ProviderType, models: modelIds }))
            .catch(error => {
              console.error('Failed to fetch Google models:', error);
              return { provider: 'google' as ProviderType, models: [] };
            })
        );
      }
      
      // Add static models for providers WITHOUT API keys
      staticModels.forEach(model => {
        if (!providersWithKeys.has(model.provider)) {
          allModels.push(model);
        }
      });
      
      // Wait for dynamic model fetches to complete
      if (providerFetches.length > 0) {
        const providerResults = await Promise.all(providerFetches);
        
        // Add dynamic models for providers WITH API keys
        providerResults.forEach(({ provider, models }) => {
          if (models.length > 0) {
            models.forEach(modelId => {
              const staticModel = staticModels.find(m => m.id === modelId);
              allModels.push({
                id: modelId,
                provider,
                displayName: staticModel?.displayName || modelId
              });
            });
          } else {
            // If dynamic fetch failed, add static models as fallback
            staticModels
              .filter(m => m.provider === provider)
              .forEach(model => allModels.push(model));
          }
        });
      }
      
      setAvailableModels(allModels);
      setModelsLoading(false);
    };

    fetchModels();
  }, [openaiKey, anthropicKey, googleKey]);

  const toggleApiKeyVisibility = () => {
    setApiKeyShown((apiKeyShown) => !apiKeyShown);
  };

  // Memoize apiKeys to prevent unnecessary re-renders
  const apiKeys = useMemo(() => ({
    openai: openaiKey,
    anthropic: anthropicKey,
    google: googleKey
  }), [openaiKey, anthropicKey, googleKey]);

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

  useEffect(() => {
    if (translated) {
      return;
    }
    makeResultHandler(isDone, phrases, batchDataResults, setTranslatedAndStore);
  }, [batchDataResults]);

  return (
    <div className="App">
      <div className="header">
        <div>
          <img src="./logo.webp" className="logo" alt="logo"></img>
        </div>
        <div className="title">Translate Subtitles</div>
        <div className="contact">
          <a href="https://domains.squarespace.com/whois-contact-form">
            Contact
          </a>
        </div>
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
              setText={setTranslatedAndStore}
            />
          ) : (
            <>
              <div className="heading">Prompt</div>
              {isTranslating() ? (
                <span className="static-prompt-large">{initPrompt}</span>
              ) : (
                <>
                  <Editor
                    name="prompt"
                    text={initPrompt}
                    setText={setInitPromptAndStore}
                    height="400px"
                  />
                  {err === "" && (
                    <>
                      <span className="heading">Settings</span>
                      
                      {/* Provider Tabs */}
                      <div className="provider-tabs">
                        <div 
                          className={`provider-tab ${activeProvider === 'openai' ? 'active' : ''} ${openaiKey ? 'has-key' : 'no-key'}`}
                          onClick={() => {
                            setActiveProvider('openai');
                            // Auto-select first OpenAI model if current model is not OpenAI
                            if (ProviderFactory.getProviderFromModel(model) !== 'openai') {
                              const firstOpenAIModel = availableModels.find(m => m.provider === 'openai');
                              if (firstOpenAIModel) {
                                setModelAndStore(firstOpenAIModel.id);
                              }
                            }
                          }}
                        >
                          OpenAI
                          <span className="status">{openaiKey ? '✓' : '✗'}</span>
                        </div>
                        <div 
                          className={`provider-tab ${activeProvider === 'anthropic' ? 'active' : ''} ${anthropicKey ? 'has-key' : 'no-key'}`}
                          onClick={() => {
                            setActiveProvider('anthropic');
                            // Auto-select first Anthropic model if current model is not Anthropic
                            if (ProviderFactory.getProviderFromModel(model) !== 'anthropic') {
                              const firstAnthropicModel = availableModels.find(m => m.provider === 'anthropic');
                              if (firstAnthropicModel) {
                                setModelAndStore(firstAnthropicModel.id);
                              }
                            }
                          }}
                        >
                          Anthropic
                          <span className="status">{anthropicKey ? '✓' : '✗'}</span>
                        </div>
                        <div 
                          className={`provider-tab ${activeProvider === 'google' ? 'active' : ''} ${googleKey ? 'has-key' : 'no-key'}`}
                          onClick={() => {
                            setActiveProvider('google');
                            // Auto-select first Google model if current model is not Google
                            if (ProviderFactory.getProviderFromModel(model) !== 'google') {
                              const firstGoogleModel = availableModels.find(m => m.provider === 'google');
                              if (firstGoogleModel) {
                                setModelAndStore(firstGoogleModel.id);
                              }
                            }
                          }}
                        >
                          Google
                          <span className="status">{googleKey ? '✓' : '✗'}</span>
                        </div>
                      </div>

                      {/* Provider-specific settings */}
                      <div className="provider-settings">
                        <div className="setting">
                          <select
                            value={model}
                            onChange={(event: ChangeEvent<HTMLSelectElement>) => {
                              const newModel = event.target.value;
                              setModelAndStore(newModel);
                              // Auto-switch to the model's provider tab if needed
                              const modelProvider = ProviderFactory.getProviderFromModel(newModel);
                              if (modelProvider !== activeProvider) {
                                setActiveProvider(modelProvider);
                              }
                            }}
                            className="model"
                            style={{ width: '250px' }}
                          >
                            {(() => {
                              const providerModels = availableModels.filter(m => m.provider === activeProvider);
                              if (modelsLoading) {
                                return <option>Loading models...</option>;
                              }
                              if (providerModels.length === 0) {
                                return <option>Add {activeProvider === 'openai' ? 'OpenAI' : activeProvider === 'anthropic' ? 'Anthropic' : 'Google'} API key</option>;
                              }
                              const hasApiKey = (
                                (activeProvider === 'openai' && openaiKey) ||
                                (activeProvider === 'anthropic' && anthropicKey) ||
                                (activeProvider === 'google' && googleKey)
                              );
                              
                              return providerModels.map(model => (
                                <option key={model.id} value={model.id} disabled={!hasApiKey}>
                                  {model.displayName}{!hasApiKey ? ' (Add API Key)' : ''}
                                </option>
                              ));
                            })()}
                          </select>
                          
                          <input
                            type={apiKeyShown ? "text" : "password"}
                            value={
                              activeProvider === 'openai' ? openaiKey :
                              activeProvider === 'anthropic' ? anthropicKey :
                              googleKey
                            }
                            onChange={(event: ChangeEvent<HTMLInputElement>) => {
                              const value = event.target.value;
                              switch (activeProvider) {
                                case 'openai':
                                  setOpenaiKeyAndStore(value);
                                  break;
                                case 'anthropic':
                                  setAnthropicKeyAndStore(value);
                                  break;
                                case 'google':
                                  setGoogleKeyAndStore(value);
                                  break;
                              }
                            }}
                            placeholder={`${activeProvider === 'openai' ? 'OPENAI' : activeProvider === 'anthropic' ? 'ANTHROPIC' : 'GOOGLE'}_API_KEY`}
                            className="pass"
                            style={{
                              borderColor: (
                                (activeProvider === 'openai' && !openaiKey) ||
                                (activeProvider === 'anthropic' && !anthropicKey) ||
                                (activeProvider === 'google' && !googleKey)
                              ) ? '#ff6b6b' : '#ccc',
                              borderWidth: (
                                (activeProvider === 'openai' && !openaiKey) ||
                                (activeProvider === 'anthropic' && !anthropicKey) ||
                                (activeProvider === 'google' && !googleKey)
                              ) ? '2px' : '1px'
                            }}
                          />
                          <button onClick={toggleApiKeyVisibility}>
                            {apiKeyShown ? "Hide" : "Show"}
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </>
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
              onClick={() => {
                setTranslatedAndStore("");
                setErr("");
              }}
              disabled={translated === "" && err === ""}
            >
              Clear
            </button>
            <button
              onClick={async () => {
                setErrAndStore("");
                setBatchErrAndStore("");
                setNumBatchesAndStore(0);
                setBatchShownAndStore("");
                setPhrasesAndStore([]);
                setBatchDataResultsAndStore([]);
                setTranslatedAndStore("");
                setOriginalAndStore("");
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
                disabled={!isDone() || translated !== ""}
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
          model={model}
          apiKeys={apiKeys}
        />
      </div>
      <div className="footer"></div>
      <div className="space"></div>
    </div>
  );
}

export default App;
