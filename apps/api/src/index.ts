import http from "node:http";
import express from "express";
import { config } from "./config.ts";
import { GameServer } from "./realtime/gameServer.ts";
import { healthRouter } from "./routes/health.ts";
import { areasRouter } from "./routes/areas.ts";
import { matchesRouter } from "./routes/matches.ts";

const app = express();
app.use(express.json());

app.use("/health", healthRouter);
app.use("/areas", areasRouter);
app.use("/matches", matchesRouter);

const server = http.createServer(app);

// WebSocket リアルタイム鬼ごっこサーバーを同じ HTTP サーバーに相乗りさせる
export const gameServer = new GameServer(server);

server.listen(config.port, () => {
  console.log(`[oni-api] listening on :${config.port}`);
});
