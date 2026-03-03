import {
  DebuggingRequestPayload,
  DebuggingRequestResult,
} from "@/types/debugging-request";
import { BACKEND_URL } from "@/config";

export async function requestDebugging(
  payload: DebuggingRequestPayload,
): Promise<DebuggingRequestResult> {
  const response = await fetch(
    `${BACKEND_URL}/api/v1/debugging/request-debugging`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ post_code: payload.postCode }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to request debugging");
  }

  const data = await response.json();

  return {
    uuid: data.uuid,

    translatorOutput: {
      returnCode: data.translator_output.return_code,
      stdout: data.translator_output.stdout,
      stderr: data.translator_output.stderr,
    },

    codeInfo: {
      statesByProcess: data.code_info.states_by_process,
      valueByInputVariable: data.code_info.value_by_input_variable,
      valueByOutputVariable: data.code_info.value_by_output_variable,
    },
  };
}
