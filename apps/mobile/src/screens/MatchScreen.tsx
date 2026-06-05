import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, StyleSheet, Text, View } from "react-native";
import type { MatchId, PlayerRole, ServerEvent, UserId } from "@oni/shared";
import { RealtimeClient } from "../lib/realtime.ts";
import { useLocationTracking } from "../lib/useLocationTracking.ts";

interface Props {
  wsBaseUrl: string;
  matchId: MatchId;
  userId: UserId;
}

/** 試合中の画面: 自分の役割・人数・ジオフェンス警告をリアルタイム表示する。 */
export function MatchScreen({ wsBaseUrl, matchId, userId }: Props) {
  const [role, setRole] = useState<PlayerRole>("runner");
  const [playerCount, setPlayerCount] = useState(0);
  const [warning, setWarning] = useState<number | null>(null);
  const [eliminated, setEliminated] = useState(false);

  const client = useMemo(() => {
    const c = new RealtimeClient(wsBaseUrl, (event: ServerEvent) => handleEvent(event));
    return c;

    function handleEvent(event: ServerEvent) {
      switch (event.type) {
        case "players_positions":
          setPlayerCount(event.players.length);
          setRole(event.players.find((p) => p.userId === userId)?.role ?? "runner");
          break;
        case "role_changed":
          setRole(event.newOni === userId ? "oni" : "runner");
          break;
        case "geofence_warning":
          if (event.userId === userId) setWarning(event.graceSecLeft);
          break;
        case "eliminated":
          if (event.userId === userId) setEliminated(true);
          break;
      }
    }
  }, [wsBaseUrl, userId]);

  useEffect(() => {
    client.connect();
    client.joinMatch(matchId, userId);
    return () => client.close();
  }, [client, matchId, userId]);

  const { permission } = useLocationTracking(client, matchId, userId, !eliminated);

  return (
    <SafeAreaView style={[styles.container, role === "oni" && styles.oni]}>
      <View style={styles.center}>
        <Text style={styles.role}>{eliminated ? "脱落" : role === "oni" ? "鬼 👹" : "逃げろ 🏃"}</Text>
        <Text style={styles.info}>参加 {playerCount} 人</Text>
        {permission === "denied" && <Text style={styles.warn}>位置情報の許可が必要です</Text>}
        {warning !== null && !eliminated && (
          <Text style={styles.warn}>エリア外! 残り {warning} 秒で脱落</Text>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  oni: { backgroundColor: "#3a0d12" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  role: { color: "#fff", fontSize: 40, fontWeight: "800" },
  info: { color: "#9aa0b4", fontSize: 16 },
  warn: { color: "#ff5b5b", fontSize: 16, fontWeight: "700" },
});
