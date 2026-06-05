import { useEffect, useState } from "react";
import { SafeAreaView, Text, StyleSheet, View } from "react-native";

/**
 * Oni アプリのエントリポイント(Phase 0 雛形)。
 * Phase 1 以降で 認証 → エリア地図 → 試合画面 を実装する。
 */
export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // TODO(Phase 1): 認証・権限リクエストの初期化
    setReady(true);
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.center}>
        <Text style={styles.title}>Oni 🏃</Text>
        <Text style={styles.subtitle}>リアル空間 鬼ごっこ SNS</Text>
        <Text style={styles.status}>{ready ? "準備完了 (Phase 0 雛形)" : "起動中..."}</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0d0d12" },
  center: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  title: { color: "#fff", fontSize: 48, fontWeight: "800" },
  subtitle: { color: "#9aa0b4", fontSize: 16 },
  status: { color: "#5b8cff", fontSize: 14, marginTop: 16 },
});
