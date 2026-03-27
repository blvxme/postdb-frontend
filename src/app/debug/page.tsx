"use client";

import { Editor } from "@monaco-editor/react";
import { useCallback, useEffect, useRef, useState } from "react";
import * as monacoEditor from "monaco-editor";
import { editor } from "monaco-editor";
import { DebuggingRequestResult } from "@/types/debugging-request";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import { buildCodeMapping } from "@/lib/code-mapping";
import { createVariableDecorations } from "@/lib/variable-decorations";
import IEditorDecorationsCollection = editor.IEditorDecorationsCollection;
import { createStateDecorations } from "@/lib/state-decorations";
import {
  connect,
  createInitialDebugState,
  DebugSocket,
  DebugStateUpdateMeta,
} from "@/api/debug";
import { DebugStateOutput } from "@/types/debug";
import { StringToStringMap } from "@/types/common";
import { configurePostLanguage, POST_LANGUAGE_ID } from "@/lib/post-language";

// Session storage keys
const LAST_CODE_KEY = "lastCode";
const TRANSLATION_RESULT_KEY = "translationResult";
const actionButtonClassName =
  "rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-blue-900 disabled:text-blue-200";

export default function DebugPage() {
  // Восстанавливаем код из sessionStorage при монтировании
  const [code] = useState(() =>
    typeof window === "undefined"
      ? ""
      : (sessionStorage.getItem(LAST_CODE_KEY) ?? ""),
  );

  // Результаты трансляции poST-кода на backend-е
  const [translationResult] = useState(() => {
    const item = sessionStorage.getItem(TRANSLATION_RESULT_KEY);
    if (!item) {
      throw new Error("Could not find translation result");
    }

    return JSON.parse(item) as DebuggingRequestResult;
  });

  // Маппинг символов программы на номера строк poST-кода
  const [codeMapping] = useState(() => {
    return buildCodeMapping(code, translationResult.codeInfo);
  });

  // Текущее состояние программы:
  // - текущий процесс
  // - текущие состояния процессов
  // - текущие значения входных переменных
  // - текущие значения выходных переменных
  const [debugState, setDebugState] = useState<DebugStateOutput>(() =>
    createInitialDebugState(translationResult.codeInfo),
  );

  // Входные переменные
  const [inputValues, setInputValues] = useState<StringToStringMap>({});

  const editorRef = useRef<IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof monacoEditor | null>(null);

  // Декорации в Monaco Editor
  const stateDecorationsRef = useRef<IEditorDecorationsCollection | null>(null);
  const variableDecorationsRef = useRef<IEditorDecorationsCollection | null>(
    null,
  );

  // Обновление декораций переменных в Monaco Editor
  const updateVariableDecorations = useCallback(
    (state: DebugStateOutput) => {
      if (!variableDecorationsRef.current) {
        return;
      }

      const variableDecorations = createVariableDecorations(
        codeMapping,
        state.inputVariables,
        state.outputVariables,
      );

      variableDecorationsRef.current.set(variableDecorations);
    },
    [codeMapping],
  );

  const updateStateDecorations = useCallback(
    (state: DebugStateOutput) => {
      if (!stateDecorationsRef.current) {
        return;
      }

      const hasCurrentProcess = state.processName in codeMapping.states;
      if (!hasCurrentProcess) {
        return;
      }

      const currentProcessStates = codeMapping.states[state.processName];
      const currentState = state.processStates[state.processName];
      if (!currentState || !(currentState in currentProcessStates)) {
        return;
      }

      const hasUnknownProcess = Object.keys(state.processStates).some(
        (processName) => !(processName in codeMapping.processes),
      );

      if (hasUnknownProcess) {
        return;
      }

      const stateDecorations = createStateDecorations(
        codeMapping,
        state.processStates,
        state.processName,
      );

      stateDecorationsRef.current.set(stateDecorations);
    },
    [codeMapping],
  );

  const applyDecorationsByMeta = useCallback(
    (state: DebugStateOutput, meta: DebugStateUpdateMeta) => {
      if (meta.updateVariables) {
        updateVariableDecorations(state);
      }
      if (meta.updateStates) {
        updateStateDecorations(state);
      }
    },
    [updateStateDecorations, updateVariableDecorations],
  );

  const handleMount = (
    editor: IStandaloneCodeEditor,
    monaco: typeof monacoEditor,
  ) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    const variableDecorations = createVariableDecorations(
      codeMapping,
      debugState.inputVariables,
      debugState.outputVariables,
    );
    variableDecorationsRef.current =
      editor.createDecorationsCollection(variableDecorations);

    const stateDecorations = createStateDecorations(
      codeMapping,
      debugState.processStates,
      debugState.processName,
    );
    stateDecorationsRef.current =
      editor.createDecorationsCollection(stateDecorations);
  };

  const socketRef = useRef<DebugSocket | null>(null);
  const [socketError, setSocketError] = useState<string | null>(null);
  useEffect(() => {
    const socket = connect(
      translationResult.uuid,
      createInitialDebugState(translationResult.codeInfo),
      {
        onSocketOpen: () => setSocketError(null),
        onSocketError: () => setSocketError("WebSocket connection failed"),
        onStateUpdate: (state, meta) => {
          setDebugState(state);
          applyDecorationsByMeta(state, meta);
        },
      },
    );

    socketRef.current = socket;

    return () => {
      socket.close();
      socketRef.current = null;
    };
  }, [
    applyDecorationsByMeta,
    translationResult.codeInfo,
    translationResult.uuid,
  ]);

  const inputVariableNames = Object.keys(
    translationResult.codeInfo.valueByInputVariable,
  );
  const handleInputValueChange = (name: string, value: string) => {
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleContinue = () => {
    socketRef.current?.sendContinue();
  };

  const handleUpdateInputVariable = (name: string) => {
    const value = inputValues[name] ?? "";
    if (!value) {
      return;
    }

    socketRef.current?.sendSetVariable(name, value);
  };

  return (
    <div className="min-h-screen">
      <main className="p-4 gap-6 flex items-start justify-center">
        <div className="w-full max-w-7xl flex gap-6">
          <div className="flex-1">
            {socketError ? (
              <p className="mb-2 text-sm text-red-400">{socketError}</p>
            ) : null}
            <Editor
              height="50vh"
              width="100%"
              theme="vs-dark"
              beforeMount={configurePostLanguage}
              language={POST_LANGUAGE_ID}
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
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                className={actionButtonClassName}
                onClick={handleContinue}
              >
                Continue
              </button>
            </div>
          </div>

          <div className="w-full max-w-md rounded-lg bg-neutral-950 p-4 ring-1 ring-neutral-800">
            <table className="w-full border-separate border-spacing-x-4 border-spacing-y-2">
              <thead>
                <tr className="text-left text-sm text-neutral-300">
                  <th>Input Variable</th>
                  <th>Value</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {inputVariableNames.map((name) => {
                  const currentValue = debugState.inputVariables[name] ?? "";
                  const enteredValue = inputValues[name] ?? "";

                  return (
                    <tr key={name}>
                      <td className="text-sm font-medium text-white">{name}</td>
                      <td>
                        <input
                          type="text"
                          className="w-full rounded bg-neutral-800 px-3 py-2 text-sm text-white outline-none ring-1 ring-neutral-600 placeholder:text-neutral-300 focus:ring-blue-500"
                          value={enteredValue}
                          placeholder={currentValue}
                          onChange={(event) =>
                            handleInputValueChange(name, event.target.value)
                          }
                        />
                      </td>
                      <td>
                        <button
                          type="button"
                          className={actionButtonClassName}
                          onClick={() => handleUpdateInputVariable(name)}
                          disabled={!enteredValue}
                        >
                          Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
