export interface DebuggingRequestPayload {
  postCode: string;
}

export interface TranslatorOutput {
  returnCode: number;
  stdout: string;
  stderr: string;
}

export type StringToStringMap = Record<string, string>;
export type StringToStringArrayMap = Record<string, string[]>;

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
