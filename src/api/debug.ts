import { BACKEND_URL } from "@/config";

export function connect(
  uuid: string,
  onSocketOpen: () => void,
  onSocketError: () => void,
): WebSocket {
  const backendUrl = new URL(BACKEND_URL);
  backendUrl.protocol = backendUrl.protocol === "https:" ? "wss:" : "ws:";
  backendUrl.pathname = `/api/v1/debugging/debug/${uuid}`;
  backendUrl.search = "";
  backendUrl.hash = "";

  const socket = new WebSocket(backendUrl.toString());
  socket.onopen = onSocketOpen;
  socket.onerror = onSocketError;

  return socket;
}
