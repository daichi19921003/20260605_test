import pg from "pg";
import { config } from "./config.ts";

/** アプリ全体で共有する PostgreSQL コネクションプール。 */
export const pool = new pg.Pool({ connectionString: config.databaseUrl });
