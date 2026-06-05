-- Oni API データベーススキーマ (PostgreSQL + PostGIS)
-- 適用: psql "$DATABASE_URL" -f db/schema.sql

CREATE EXTENSION IF NOT EXISTS postgis;

-- ユーザー
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  display_name  TEXT NOT NULL,
  age_verified  BOOLEAN NOT NULL DEFAULT FALSE,
  -- プライバシー設定(試合外の位置共有など)
  share_location_outside_match BOOLEAN NOT NULL DEFAULT FALSE,
  allow_trail_sharing          BOOLEAN NOT NULL DEFAULT FALSE,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- エリア(ジオフェンス)。MVP は円形(中心点 + 半径)。
CREATE TABLE IF NOT EXISTS areas (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  host_id     UUID NOT NULL REFERENCES users(id),
  center      GEOGRAPHY(POINT, 4326) NOT NULL,
  radius_m    DOUBLE PRECISION NOT NULL CHECK (radius_m > 0),
  min_players INT NOT NULL DEFAULT 2 CHECK (min_players >= 2),
  max_players INT NOT NULL DEFAULT 30,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS areas_center_gix ON areas USING GIST (center);

-- 試合
CREATE TABLE IF NOT EXISTS matches (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  area_id       UUID NOT NULL REFERENCES areas(id),
  status        TEXT NOT NULL DEFAULT 'recruiting'
                CHECK (status IN ('recruiting','starting','in_progress','finished','cancelled')),
  duration_sec  INT NOT NULL DEFAULT 600,
  tag_distance_m DOUBLE PRECISION NOT NULL DEFAULT 10,
  started_at    TIMESTAMPTZ,
  finished_at   TIMESTAMPTZ,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS matches_area_idx ON matches (area_id);

-- 試合参加者
CREATE TABLE IF NOT EXISTS match_players (
  match_id        UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL REFERENCES users(id),
  role            TEXT NOT NULL DEFAULT 'runner' CHECK (role IN ('oni','runner')),
  oni_duration_sec INT NOT NULL DEFAULT 0,
  eliminated      BOOLEAN NOT NULL DEFAULT FALSE,
  PRIMARY KEY (match_id, user_id)
);

-- 位置ログ(プライバシー保護のため短期保持で削除する運用)。
-- 試合終了後は粗い軌跡のみ別途保存し、本テーブルは定期削除する。
CREATE TABLE IF NOT EXISTS location_samples (
  id         BIGSERIAL PRIMARY KEY,
  match_id   UUID NOT NULL REFERENCES matches(id) ON DELETE CASCADE,
  user_id    UUID NOT NULL REFERENCES users(id),
  point      GEOGRAPHY(POINT, 4326) NOT NULL,
  accuracy_m DOUBLE PRECISION,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS location_samples_match_time_idx
  ON location_samples (match_id, recorded_at);
