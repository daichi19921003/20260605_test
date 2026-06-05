import http from "node:http";
import express from "express";
import { config } from "./config.ts";
import { services } from "./context.ts";
import { GameServer } from "./realtime/gameServer.ts";
import { setGameServer } from "./realtime/instance.ts";
import { healthRouter } from "./routes/health.ts";
import { usersRouter } from "./routes/users.ts";
import { areasRouter } from "./routes/areas.ts";
import { matchesRouter } from "./routes/matches.ts";
import { reportsRouter } from "./routes/reports.ts";

const app = express();
app.use(express.json());

app.use("/health", healthRouter);
app.use("/users", usersRouter);
app.use("/areas", areasRouter);
app.use("/matches", matchesRouter);
app.use("/reports", reportsRouter);

const server = http.createServer(app);

// WebSocket リアルタイム鬼ごっこサーバーを同じ HTTP サーバーに相乗りさせる
const gameServer = new GameServer(server, services.matches);
setGameServer(gameServer);

server.listen(config.port, () => {
  console.log(`[oni-api] listening on :${config.port}`);
});
