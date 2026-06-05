import type { ClientEvent, ServerEvent, LocationSample, MatchId, UserId } from "@oni/shared";

/**
 * 試合用 WebSocket クライアント。
 * 位置更新の送信と、サーバーからの位置/役割交代イベントの受信を担う。
 */
export class RealtimeClient {
  private ws: WebSocket | null = null;

  constructor(
    private readonly baseUrl: string,
    private readonly onEvent: (event: ServerEvent) => void,
  ) {}

  connect(): void {
    const ws = new WebSocket(`${this.baseUrl}/ws`);
    ws.onmessage = (msg) => {
      try {
        this.onEvent(JSON.parse(msg.data as string) as ServerEvent);
      } catch {
        /* 不正メッセージは無視 */
      }
    };
    this.ws = ws;
  }

  joinMatch(matchId: MatchId, userId: UserId): void {
    this.send({ type: "join_match", matchId, userId });
  }

  sendLocation(matchId: MatchId, userId: UserId, location: LocationSample): void {
    this.send({ type: "location_update", matchId, userId, location });
  }

  private send(event: ClientEvent): void {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(event));
  }

  close(): void {
    this.ws?.close();
    this.ws = null;
  }
}
