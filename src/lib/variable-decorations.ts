import { CodeMapping } from "@/lib/code-mapping";
import * as monacoEditor from "monaco-editor";
import { StringToStringMap } from "@/types/common";

export function createVariableDecorations(
  codeMapping: CodeMapping,
  inputVariables: StringToStringMap,
  outputVariables: StringToStringMap,
) {
  const booleanValues: Set<string> = new Set(["true", "false"]);

  const decorations: monacoEditor.editor.IModelDeltaDecoration[] = [];

  for (const [name, pos] of Object.entries(codeMapping.inputVariables)) {
    const value = inputVariables[name];

    let inlineClassName = "variable-decoration";
    if (booleanValues.has(value.toLowerCase())) {
      if (value.toLowerCase() === "true") {
        inlineClassName += " true-boolean-variable-decoration";
      } else {
        inlineClassName += " false-boolean-variable-decoration";
      }
    } else {
      inlineClassName += " other-variable-decoration";
    }

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
            inlineClassName: inlineClassName,
          },
        },
      });
    }
  }

  for (const [name, pos] of Object.entries(codeMapping.outputVariables)) {
    const value = outputVariables[name];

    let inlineClassName = "variable-decoration";
    if (booleanValues.has(value.toLowerCase())) {
      if (value.toLowerCase() === "true") {
        inlineClassName += " true-boolean-variable-decoration";
      } else {
        inlineClassName += " false-boolean-variable-decoration";
      }
    } else {
      inlineClassName += " other-variable-decoration";
    }

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
            inlineClassName: inlineClassName,
          },
        },
      });
    }
  }

  return decorations;
}
