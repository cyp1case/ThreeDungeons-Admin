-- Cloud save: one authoritative save per resident (single-slot model)
-- Access via service-role Edge Function only (same pattern as attempts)

CREATE TABLE game_saves (
  resident_id UUID PRIMARY KEY REFERENCES residents(id) ON DELETE CASCADE,
  program_id UUID NOT NULL REFERENCES programs(id) ON DELETE CASCADE,
  data TEXT NOT NULL,
  savefile_info_json JSONB NOT NULL,
  timestamp BIGINT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_game_saves_program ON game_saves(program_id);

ALTER TABLE game_saves ENABLE ROW LEVEL SECURITY;
