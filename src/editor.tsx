import React from "react";
import AceEditor from "react-ace";

import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/mode-plain_text";

export interface EditorProps {
  text: string;
  setText: (text: string) => void;
  height?: string;
  name: string;
  readOnly?: boolean;
}

export const Editor: React.FC<EditorProps> = ({
  text,
  setText,
  name,
  height = "550px",
  readOnly = false,
}) => {
  const onChange = (newValue: string) => {
    setText(newValue);
  };

  return (
    <AceEditor
      name={name}
      mode="plain_text"
      theme="github"
      value={text}
      onChange={onChange}
      fontSize={14}
      showPrintMargin={true}
      showGutter={false}
      highlightActiveLine={true}
      setOptions={{
        showLineNumbers: false,
        tabSize: 2,
        useWorker: false,
      }}
      width={"100%"}
      height={height}
      readOnly={readOnly}
    />
  );
};
