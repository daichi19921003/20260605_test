import { WebSocketServer, WebSocket } from "ws";
import type { Server } from "node:http";
import {
  type ClientEvent,
  type ServerEvent,
  type LocationSample,
  type UserId,
  type MatchId,
  type PlayerRole,
  type Geofence,
  type ProximityState,
  type GeofenceState,
  evaluateTag,
  initialProximityState,
  evaluateGeofence,
  initialGeofenceState,
  isInsideFence,
  isImplausibleMove,
} from "@oni/shared";
import type { MatchService } from "../services/matchService.ts";

interface PlayerSession {
  userId: UserId;
  socket: WebSocket;
  lastLocation: LocationSample | null;
  /** 鬼との近接状態。 */
  proximity: ProximityState;
  /** ジオフェンス境界の猶予状態。 */
  geofence: GeofenceState;
}

interface MatchRoom {
  matchId: MatchId;
  fence: Geofence;
  tagDistanceM: number;
  players: Map<UserId, PlayerSession>;
}

/**
 * リアルタイム鬼ごっこサーバー(権威判定)。
 *
 * クライアントの位置更新を受け、チート検知・ジオフェンス猶予判定・鬼交代判定を行い、
 * 役割交代は MatchService に委譲して鬼時間を正しく積算する。
 */
export class GameServer {
  private readonly wss: WebSocketServer;
  private readonly rooms = new Map<MatchId, MatchRoom>();

  constructor(server: Server, private readonly matchService: MatchService) {
    this.wss = new WebSocketServer({ server, path: "/ws" });
    this.wss.on("connection", (socket) => this.onConnection(socket));
  }

  /** 試合開始時に REST 側から呼ばれ、リアルタイム判定の対象にする。 */
  registerRoom(matchId: MatchId, fence: Geofence, tagDistanceM: number): void {
    this.rooms.set(matchId, { matchId, fence, tagDistanceM, players: new Map() });
  }

  private onConnection(socket: WebSocket): void {
    socket.on("message", (raw) => {
      let event: ClientEvent;
      try {
        event = JSON.parse(raw.toString()) as ClientEvent;
      } catch {
        return this.send(socket, { type: "error", message: "invalid_json" });
      }
      this.handleEvent(socket, event);
    });
  }

  private handleEvent(socket: WebSocket, event: ClientEvent): void {
    switch (event.type) {
      case "join_match":
        return this.join(socket, event.matchId, event.userId);
      case "leave_match":
        return void this.rooms.get(event.matchId)?.players.delete(event.userId);
      case "location_update":
        return this.onLocation(event.matchId, event.userId, event.location);
    }
  }

  private join(socket: WebSocket, matchId: MatchId, userId: UserId): void {
    const room = this.rooms.get(matchId);
    if (!room) return this.send(socket, { type: "error", message: "match_not_found" });
    room.players.set(userId, {
      userId,
      socket,
      lastLocation: null,
      proximity: initialProximityState(),
      geofence: initialGeofenceState(),
    });
    this.send(socket, { type: "match_state", matchId, status: "joined" });
  }

  private onLocation(matchId: MatchId, userId: UserId, location: LocationSample): void {
    const room = this.rooms.get(matchId);
    const player = room?.players.get(userId);
    if (!room || !player) return;

    // 1) チート検知: 直前サンプルからの移動速度が非現実的なら脱落
    if (player.lastLocation && isImplausibleMove(player.lastLocation, location)) {
      return this.eliminate(room, player, "cheat");
    }
    player.lastLocation = location;

    // 2) ジオフェンス: 猶予つき判定(即脱落させず警告→猶予経過で脱落)
    const inside = isInsideFence(location, room.fence);
    const fenceJudgment = evaluateGeofence(inside, location.timestamp, player.geofence);
    player.geofence = fenceJudgment.state;
    if (fenceJudgment.status === "eliminated") {
      return this.eliminate(room, player, "out_of_bounds");
    }
    if (fenceJudgment.status === "warning") {
      this.send(player.socket, {
        type: "geofence_warning",
        matchId,
        userId,
        graceSecLeft: fenceJudgment.graceSecLeft,
      });
    }

    // 3) 鬼交代判定(逃走者の更新時に、現在の鬼との距離を評価)
    if (this.roleOf(matchId, userId) === "runner") {
      const oni = this.currentOniSession(room);
      if (oni?.lastLocation) {
        const judgment = evaluateTag(
          oni.lastLocation,
          location,
          location.timestamp,
          room.tagDistanceM,
          player.proximity,
        );
        player.proximity = judgment.state;
        if (judgment.tagged) this.switchOni(room, userId, location.timestamp);
      }
    }

    this.broadcastPositions(room);
  }

  /** 役割交代を MatchService に委譲し、結果を全員へ通知する。 */
  private switchOni(room: MatchRoom, newOni: UserId, at: number): void {
    let previousOni: UserId;
    try {
      previousOni = this.matchService.applyTagSwitch(room.matchId, newOni, at);
    } catch {
      return; // 既に脱落/不整合な場合は無視
    }
    // タッチした逃走者の近接状態をリセットして連続交代を防ぐ
    room.players.get(newOni)!.proximity = initialProximityState();
    this.broadcast(room, { type: "role_changed", matchId: room.matchId, newOni, previousOni, at });
  }

  private currentOniSession(room: MatchRoom): PlayerSession | undefined {
    const match = this.matchService.get(room.matchId);
    const oniId = match?.players.find((p) => p.role === "oni")?.userId;
    return oniId ? room.players.get(oniId) : undefined;
  }

  private roleOf(matchId: MatchId, userId: UserId): PlayerRole | undefined {
    return this.matchService.get(matchId)?.players.find((p) => p.userId === userId)?.role;
  }

  private eliminate(room: MatchRoom, player: PlayerSession, reason: "out_of_bounds" | "cheat"): void {
    this.matchService.eliminate(room.matchId, player.userId);
    room.players.delete(player.userId);
    this.broadcast(room, { type: "eliminated", matchId: room.matchId, userId: player.userId, reason });
  }

  private broadcastPositions(room: MatchRoom): void {
    const match = this.matchService.get(room.matchId);
    const roleById = new Map(match?.players.map((p) => [p.userId, p.role]) ?? []);
    const players = [...room.players.values()]
      .filter((p) => p.lastLocation)
      .map((p) => ({
        userId: p.userId,
        role: roleById.get(p.userId) ?? ("runner" as PlayerRole),
        location: p.lastLocation!,
      }));
    this.broadcast(room, { type: "players_positions", matchId: room.matchId, players });
  }

  private broadcast(room: MatchRoom, event: ServerEvent): void {
    for (const p of room.players.values()) this.send(p.socket, event);
  }

  private send(socket: WebSocket, event: ServerEvent): void {
    if (socket.readyState === WebSocket.OPEN) socket.send(JSON.stringify(event));
  }
}
