import { CodeInfo } from "@/types/debugging-request";

export interface CodePosition {
  lineFrom: number;
  lineTo: number;

  columnFrom: number;
  columnTo: number;
}

export interface CodeMapping {
  // Mapping of process names to the line numbers where they are declared
  processes: Record<string, CodePosition>;

  // Mapping of state names to the line numbers where they are declared
  states: Record<string, Record<string, CodePosition>>;

  // Mapping of input variable names to the list of line numbers where the variable occurs
  inputVariables: Record<string, CodePosition[]>;

  // Mapping of output variable names to the list of line numbers where the variable occurs
  outputVariables: Record<string, CodePosition[]>;
}

export function buildCodeMapping(
  code: string,
  codeInfo: CodeInfo,
): CodeMapping {
  const processes: Record<string, CodePosition> = {};
  const states: Record<string, Record<string, CodePosition>> = {};
  const inputVariables: Record<string, CodePosition[]> = {};
  const outputVariables: Record<string, CodePosition[]> = {};

  const codeLines = code.split("\n");

  const processRegex = /^\s*PROCESS\s+(\w+)/;
  const stateRegex = /^\s*STATE\s+(\w+)/;

  let currentProcess: string | null = null;

  const inputVariableNames = Object.keys(codeInfo.valueByInputVariable);
  const outputVariableNames = Object.keys(codeInfo.valueByOutputVariable);

  for (const [i, currentLine] of codeLines.entries()) {
    // Mapping of process names to the line numbers where they are declared
    const processMatch = currentLine.match(processRegex);
    if (processMatch) {
      const processName = processMatch[1];

      const start = currentLine.indexOf(processName);
      if (start !== -1) {
        processes[processName] = {
          lineFrom: i + 1,
          lineTo: i + 1,
          columnFrom: start + 1,
          columnTo: start + processName.length,
        };
      }

      currentProcess = processName;
      if (!states[currentProcess]) {
        states[currentProcess] = {};
      }

      continue;
    }

    // Mapping of state names to the line numbers where they are declared
    const stateMatch = currentLine.match(stateRegex);
    if (stateMatch && currentProcess) {
      const stateName = stateMatch[1];

      const start = currentLine.indexOf(stateName);
      if (start !== -1) {
        states[currentProcess][stateName] = {
          lineFrom: i + 1,
          lineTo: i + 1,
          columnFrom: start + 1,
          columnTo: start + stateName.length,
        };
      }
    }

    // Mapping of input variable names to the list of line numbers where the variable occurs
    for (const inputVariable of inputVariableNames) {
      let start = 0;

      while (true) {
        const found = currentLine.indexOf(inputVariable, start);
        if (found === -1) {
          break;
        }

        if (!inputVariables[inputVariable]) {
          inputVariables[inputVariable] = [];
        }

        inputVariables[inputVariable].push({
          lineFrom: i + 1,
          lineTo: i + 1,
          columnFrom: found + 1,
          columnTo: found + inputVariable.length,
        });

        start = found + 1;
      }
    }

    // Mapping of output variable names to the list of line numbers where the variable occurs
    for (const outputVariable of outputVariableNames) {
      let start = 0;

      while (true) {
        const found = currentLine.indexOf(outputVariable, start);
        if (found === -1) {
          break;
        }

        if (!outputVariables[outputVariable]) {
          outputVariables[outputVariable] = [];
        }

        outputVariables[outputVariable].push({
          lineFrom: i + 1,
          lineTo: i + 1,
          columnFrom: found + 1,
          columnTo: found + outputVariable.length,
        });

        start = found + 1;
      }
    }
  }

  return {
    processes,
    states,
    inputVariables,
    outputVariables,
  };
}
