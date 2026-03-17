import { BACKEND_URL } from "@/config";
import { CodeInfo } from "@/types/debugging-request";
import { DebugStateOutput } from "@/types/debug";
import { StringToStringMap } from "@/types/common";

interface BackendDebugStateOutput {
  process_name?: unknown;
  process_states?: unknown;
  input_variables?: unknown;
  output_variables?: unknown;
}

interface DebugStatePatch {
  processName?: string;
  processStates?: StringToStringMap;
  inputVariables?: StringToStringMap;
  outputVariables?: StringToStringMap;
}

export interface DebugStateUpdateMeta {
  updateStates: boolean;
  updateVariables: boolean;
}

export interface DebugSocket {
  sendContinue: () => void;
  sendSetVariable: (name: string, value: string) => void;
  close: () => void;
}

interface ConnectHandlers {
  onSocketOpen: () => void;
  onSocketError: () => void;
  onStateUpdate: (state: DebugStateOutput, meta: DebugStateUpdateMeta) => void;
}

function toStringMap(value: unknown): StringToStringMap | undefined {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return undefined;
  }

  const entries = Object.entries(value);
  if (entries.length === 0) {
    return undefined;
  }

  const result: StringToStringMap = {};
  for (const [k, v] of entries) {
    result[k] = String(v);
  }

  return result;
}

function toDebugStatePatch(payload: unknown): DebugStatePatch {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return {};
  }

  const output = payload as BackendDebugStateOutput;
  const patch: DebugStatePatch = {};

  if ("process_name" in output && typeof output.process_name === "string") {
    patch.processName = output.process_name;
  }
  if ("process_states" in output) {
    patch.processStates = toStringMap(output.process_states);
  }
  if ("input_variables" in output) {
    patch.inputVariables = toStringMap(output.input_variables);
  }
  if ("output_variables" in output) {
    patch.outputVariables = toStringMap(output.output_variables);
  }

  return patch;
}

function applyPatch(
  current: DebugStateOutput,
  patch: DebugStatePatch,
): DebugStateOutput {
  return {
    processName: patch.processName ?? current.processName,
    processStates: patch.processStates ?? current.processStates,
    inputVariables: patch.inputVariables ?? current.inputVariables,
    outputVariables: patch.outputVariables ?? current.outputVariables,
  };
}

export function createInitialDebugState(codeInfo: CodeInfo): DebugStateOutput {
  return {
    processName: Object.keys(codeInfo.statesByProcess)[0] ?? "",
    processStates: Object.fromEntries(
      Object.entries(codeInfo.statesByProcess).map(([process, states]) => [
        process,
        states[0] ?? "",
      ]),
    ),
    inputVariables: { ...codeInfo.valueByInputVariable },
    outputVariables: { ...codeInfo.valueByOutputVariable },
  };
}

export function connect(
  uuid: string,
  initialState: DebugStateOutput,
  { onSocketOpen, onSocketError, onStateUpdate }: ConnectHandlers,
): DebugSocket {
  const backendUrl = new URL(BACKEND_URL);
  backendUrl.protocol = backendUrl.protocol === "https:" ? "wss:" : "ws:";
  backendUrl.pathname = `/api/v1/debugging/debug/${uuid}`;
  backendUrl.search = "";
  backendUrl.hash = "";

  const socket = new WebSocket(backendUrl.toString());
  const pendingMessages: string[] = [];

  const sendMessage = (message: string) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(message);
      return;
    }

    if (socket.readyState === WebSocket.CONNECTING) {
      pendingMessages.push(message);
    }
  };

  socket.onopen = () => {
    onSocketOpen();

    while (pendingMessages.length > 0) {
      const message = pendingMessages.shift();
      if (message) {
        socket.send(message);
      }
    }
  };
  socket.onerror = onSocketError;
  let currentState = initialState;

  socket.onmessage = (event) => {
    try {
      const parsed = JSON.parse(event.data);
      const patch = toDebugStatePatch(parsed);
      const updateStates =
        patch.processName !== undefined || patch.processStates !== undefined;
      const updateVariables =
        patch.inputVariables !== undefined ||
        patch.outputVariables !== undefined;

      if (!updateStates && !updateVariables) {
        return;
      }

      currentState = applyPatch(currentState, patch);
      onStateUpdate(currentState, { updateStates, updateVariables });
    } catch {
      // Ignore malformed backend events
    }
  };

  return {
    sendContinue: () => {
      sendMessage("CONTINUE");
    },
    sendSetVariable: (name: string, value: string) => {
      sendMessage(`SET_VARIABLE ${name} ${value}`);
    },
    close: () => {
      socket.close();
    },
  };
}
