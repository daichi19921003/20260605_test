/** 環境変数からの設定読み込み。 */
export const config = {
  port: Number(process.env.PORT ?? 8080),
  databaseUrl: process.env.DATABASE_URL ?? "postgres://oni:oni@localhost:5432/oni",
} as const;
