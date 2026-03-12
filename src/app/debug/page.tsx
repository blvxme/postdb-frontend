"use client";

import { Editor } from "@monaco-editor/react";
import { useEffect, useRef, useState } from "react";
import * as monacoEditor from "monaco-editor";
import { editor } from "monaco-editor";
import { DebuggingRequestResult } from "@/types/debugging-request";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import { buildCodeMapping } from "@/lib/code-mapping";
import { createVariableDecorations } from "@/lib/variable-decorations";
import IEditorDecorationsCollection = editor.IEditorDecorationsCollection;
import { createStateDecorations } from "@/lib/state-decorations";
import { connect } from "@/api/debug";

// Session storage keys
const LAST_CODE_KEY = "lastCode";
const TRANSLATION_RESULT_KEY = "translationResult";

export default function DebugPage() {
  const [code] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    // Восстанавливаем код из sessionStorage при монтировании
    return sessionStorage.getItem(LAST_CODE_KEY) ?? "";
  });

  const [translationResult] = useState(() => {
    const item = sessionStorage.getItem(TRANSLATION_RESULT_KEY);
    if (!item) {
      throw new Error("Could not find translation result");
    }

    return JSON.parse(item) as DebuggingRequestResult;
  });

  const [codeMapping] = useState(() => {
    return buildCodeMapping(code, translationResult.codeInfo);
  });

  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoEditor | null>(null);
  const decorationsRef = useRef<IEditorDecorationsCollection | null>(null);
  const handleMount = (
    editor: IStandaloneCodeEditor,
    monaco: typeof monacoEditor,
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const variableDecorations = createVariableDecorations(
      codeMapping,
      translationResult.codeInfo.valueByInputVariable,
      translationResult.codeInfo.valueByOutputVariable,
    );

    const stateDecorations = createStateDecorations(
      codeMapping,
      Object.fromEntries(
        Object.entries(translationResult.codeInfo.statesByProcess).map(
          ([p, s]) => [p, s[0] ?? ""],
        ),
      ),
    );

    const decorations = [...variableDecorations, ...stateDecorations];
    decorationsRef.current = editor.createDecorationsCollection(decorations);
  };

  const socketRef = useRef<WebSocket | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  useEffect(() => {
    const socket = connect(
      translationResult.uuid,
      () => setSocketError(null),
      () => setSocketError("WebSocket connection failed"),
    );

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [translationResult.uuid]);

  return (
    <div className="min-h-screen">
      <main className="p-4 gap-6 flex items-center justify-center">
        <div className="w-full max-w-5xl">
          {socketError ? (
            <p className="mb-2 text-sm text-red-400">{socketError}</p>
          ) : null}
          <Editor
            height="50vh"
            width="100%"
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
              readOnly: true,
              domReadOnly: true,
            }}
            defaultValue={code}
            onMount={handleMount}
          />
        </div>
      </main>
    </div>
  );
}
