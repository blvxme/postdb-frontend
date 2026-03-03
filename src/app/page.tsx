"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { editor } from "monaco-editor";
import { toast } from "sonner";
import { requestDebugging } from "@/api/debugging-request";
import { DebuggingRequestResult } from "@/types/debugging-request";
import clsx from "clsx";
import Image from "next/image";
import TranslatorOutput, { OutputType } from "@/components/TranslatorOutput";
import IStandaloneCodeEditor = editor.IStandaloneCodeEditor;
import { Editor } from "@monaco-editor/react";
import { OTHER_APPS_URL } from "@/config";

// Session storage keys
const LAST_CODE_KEY = "lastCode";
const TRANSLATION_RESULT_KEY = "translationResult";

export default function MainPage() {
  const router = useRouter();
  const editorRef = useRef<IStandaloneCodeEditor | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DebuggingRequestResult | null>(null);
  const [code, setCode] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    // Восстанавливаем код из sessionStorage при монтировании
    return sessionStorage.getItem(LAST_CODE_KEY) ?? "";
  });

  const handleMount = (editor: IStandaloneCodeEditor) => {
    editorRef.current = editor;
  };

  const handleChange = (value: string | undefined) => {
    if (value !== undefined) {
      setCode(value);
      sessionStorage.setItem(LAST_CODE_KEY, value);
    }
  };

  const handleOtherApps = () => {
    window.open(OTHER_APPS_URL, "_blank", "noopener,noreferrer");
  };

  const handleTranslate = async () => {
    if (!code.trim()) {
      toast.error("Code editor is empty");
      return;
    }

    setIsLoading(true);

    try {
      const requestResult = await requestDebugging({ postCode: code });
      sessionStorage.setItem(
        TRANSLATION_RESULT_KEY,
        JSON.stringify(requestResult),
      );
      setResult(requestResult);

      const returnCode = requestResult.translatorOutput.returnCode;
      if (returnCode === 0) {
        toast.success("Translator returned 0");
      } else {
        toast.error(`Translator returned ${returnCode}`);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to translate");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebug = () => {
    router.push("/debug");
  };

  const hasStdout = () => {
    const stdout = result?.translatorOutput?.stdout;
    return stdout !== undefined && stdout.trim().length > 0;
  };

  const hasStderr = () => {
    const stderr = result?.translatorOutput?.stderr;
    return stderr !== undefined && stderr.trim().length > 0;
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="p-4 flex items-center">
        <button
          onClick={handleOtherApps}
          className={clsx(
            "group flex items-center gap-2 px-4 py-2 rounded-md",
            "font-medium text-white transition-all duration-200",
            "bg-gray-700 hover:bg-gray-600",
          )}
        >
          <Image
            src="/white-other-apps-icon.svg"
            alt=""
            width={20}
            height={20}
            className="group-hover:-translate-x-0.5 transition-transform duration-200"
          />

          <span className="group-hover:-translate-x-0.5 transition-transform duration-200">
            Other apps
          </span>
        </button>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center p-4 gap-6">
        <div className="w-full max-w-5xl">
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
            }}
            value={code}
            onMount={handleMount}
            onChange={handleChange}
          />
        </div>

        {!result ? (
          <button
            onClick={handleTranslate}
            disabled={isLoading || !code.trim()}
            className={clsx(
              "group flex items-center gap-3 px-8 py-4 rounded-lg font-medium text-lg",
              "bg-green-600 hover:bg-green-500 active:bg-green-700",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              "transition-all duration-200 shadow-md hover:shadow-lg",
              "text-white",
            )}
          >
            <Image
              src="/white-translate-icon.svg"
              alt=""
              width={20}
              height={20}
              className="group-hover:-translate-x-0.75 transition-transform duration-200"
            />

            <span className="group-hover:translate-x-0.75 transition-transform duration-200">
              {isLoading ? "Translating..." : "Translate"}
            </span>
          </button>
        ) : (
          <button
            onClick={handleDebug}
            className={clsx(
              "group flex items-center gap-3 px-8 py-4 rounded-lg font-medium text-lg",
              "bg-amber-600 hover:bg-amber-500 active:bg-amber-700",
              "transition-all duration-200 shadow-md hover:shadow-lg",
              "text-white",
            )}
          >
            <Image
              src="/white-debug-icon.svg"
              alt=""
              width={20}
              height={20}
              className="group-hover:-translate-x-0.75 transition-transform duration-200"
            />

            <span className="group-hover:translate-x-0.75 transition-transform duration-200">
              Debug
            </span>
          </button>
        )}
      </main>

      {hasStdout() && (
        <TranslatorOutput type={OutputType.STDOUT} position="bottom-left">
          {result?.translatorOutput.stdout}
        </TranslatorOutput>
      )}

      {hasStderr() && (
        <TranslatorOutput type={OutputType.STDERR} position="bottom-right">
          {result?.translatorOutput.stderr}
        </TranslatorOutput>
      )}
    </div>
  );
}
