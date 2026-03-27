import { CodeMapping } from "@/lib/code-mapping";
import * as monacoEditor from "monaco-editor";
import { StringToStringMap } from "@/types/common";

export function createStateDecorations(
  codeMapping: CodeMapping,
  states: StringToStringMap,
  currentProcessName: string,
) {
  const decorations: monacoEditor.editor.IModelDeltaDecoration[] = [];

  for (const [process, state] of Object.entries(states)) {
    const processMapping = codeMapping.processes[process];
    decorations.push({
      range: new monacoEditor.Range(
        processMapping.lineFrom,
        processMapping.columnFrom,
        processMapping.lineTo,
        processMapping.columnTo + 1,
      ),
      options: {
        after: {
          content: `${state}`,
          inlineClassName: "process-decoration",
        },
      },
    });
  }

  const currentStateName = states[currentProcessName];
  const stateMapping = codeMapping.states[currentProcessName][currentStateName];

  decorations.push({
    range: new monacoEditor.Range(
      stateMapping.lineFrom,
      stateMapping.columnFrom,
      stateMapping.lineTo,
      stateMapping.columnTo + 1,
    ),
    options: {
      inlineClassName: "state-decoration",
    },
  });

  return decorations;
}
