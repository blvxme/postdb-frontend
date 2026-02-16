import { Editor } from "@monaco-editor/react";

export default function CodeEditor() {
  return (
    <Editor
      height="50vh"
      width="100vh"
      theme="vs-dark"
      options={{
        fontSize: 15,
        minimap: { enabled: false },
        scrollBeyondLastLine: false,
        roundedSelection: true,
        padding: { top: 10 },
        folding: true,
        lineNumbers: "on",
        tabSize: 4,
      }}
    />
  );
}
