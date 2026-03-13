import { StringToStringMap } from "@/types/common";

export interface DebugStateOutput {
  processName: string;
  processStates: StringToStringMap;
  inputVariables: StringToStringMap;
  outputVariables: StringToStringMap;
}
