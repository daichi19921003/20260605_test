import { useState } from "react";
import { Pressable, SafeAreaView, StyleSheet, Text, View } from "react-native";
import { MatchScreen } from "./src/screens/MatchScreen.tsx";

// 実機/エミュレータからは LAN IP に変更する
const API_BASE = "http://localhost:8080";
const WS_BASE = "ws://localhost:8080";

/**
 * Oni アプリのエントリ。
 * MVP の最小フロー: ロビー → 試合画面。認証/エリア選択は ApiClient 経由で拡張予定。
 */
export default function App() {
  const [match, setMatch] = useState<{ matchId: string; userId: string } | null>(null);

  if (match) {
    return <MatchScreen wsBaseUrl={WS_BASE} matchId={match.matchId} userId={match.userId} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Oni 🏃</Text>
        <Text style={styles.subtitle}>リアル空間 鬼ごっこ SNS</Text>
        <Text style={styles.api}>API: {API_BASE}</Text>
        <Pressable
          style={styles.button}
          onPress={() => setMatch({ matchId: "demo-match", userId: "demo-user" })}
        >
          <Text style={styles.buttonText}>デモ試合に参加</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 10 },
  title: { color: "#fff", fontSize: 48, fontWeight: "800" },
  subtitle: { color: "#9aa0b4", fontSize: 16 },
  api: { color: "#5b8cff", fontSize: 12, marginTop: 8 },
  button: { marginTop: 24, backgroundColor: "#5b8cff", paddingHorizontal: 28, paddingVertical: 14, borderRadius: 12 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
