import { CodeMapping } from "@/lib/code-mapping";
import * as monacoEditor from "monaco-editor";
import { StringToStringMap } from "@/types/common";

export function createVariableDecorations(
  codeMapping: CodeMapping,
  inputVariables: StringToStringMap,
  outputVariables: StringToStringMap,
) {
  const decorations: monacoEditor.editor.IModelDeltaDecoration[] = [];

  for (const [name, pos] of Object.entries(codeMapping.inputVariables)) {
    const value = inputVariables[name];

    for (const p of pos) {
      decorations.push({
        range: new monacoEditor.Range(
          p.lineFrom,
          p.columnFrom,
          p.lineTo,
          p.columnTo + 1,
        ),
        options: {
          after: {
            content: `${value}`,
            inlineClassName: "variable-decoration",
          },
        },
      });
    }
  }

  for (const [name, pos] of Object.entries(codeMapping.outputVariables)) {
    const value = outputVariables[name];

    for (const p of pos) {
      decorations.push({
        range: new monacoEditor.Range(
          p.lineFrom,
          p.columnFrom,
          p.lineTo,
          p.columnTo + 1,
        ),
        options: {
          after: {
            content: `${value}`,
            inlineClassName: "variable-decoration",
          },
        },
      });
    }
  }

  return decorations;
}
