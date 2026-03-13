import { StringToStringArrayMap, StringToStringMap } from "@/types/common";

export interface DebuggingRequestPayload {
  postCode: string;
}

export interface TranslatorOutput {
  returnCode: number;
  stdout: string;
  stderr: string;
}

export interface CodeInfo {
  statesByProcess: StringToStringArrayMap;
  valueByInputVariable: StringToStringMap;
  valueByOutputVariable: StringToStringMap;
}

export interface DebuggingRequestResult {
  uuid: string;
  translatorOutput: TranslatorOutput;
  codeInfo: CodeInfo;
}
