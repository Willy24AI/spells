/*
  # Complete schema for the Spelling Bee (Daily Bee) game

  This supersedes the original incomplete migration. It creates every table,
  column, and policy the application code actually uses. It is idempotent
  (safe to run on a fresh database or to top up an existing one).

  Design notes:
    - `words` and `daily_puzzles` are PUBLICLY readable (anon + authenticated)
      so logged-out visitors can play the daily puzzle and validate words.
    - There are intentionally NO insert/update policies for `words` and
      `daily_puzzles`. Those writes (seeding, puzzle generation) are performed
      server-side with the SERVICE ROLE key, which bypasses RLS.
    - `game_stats` is private per user.
*/

-- =========================================================================
--  words (the dictionary)
-- =========================================================================
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text UNIQUE NOT NULL,
  points integer NOT NULL DEFAULT 0,
  is_pangram boolean NOT NULL DEFAULT false,
  length integer,
  letters text[],
  unique_letters text[],
  letter_count jsonb,
  vowel_count integer,
  consonant_count integer,
  difficulty text,
  created_at timestamptz DEFAULT now()
);

-- Top-up columns if the table already existed from the old migration
ALTER TABLE words ADD COLUMN IF NOT EXISTS length integer;
ALTER TABLE words ADD COLUMN IF NOT EXISTS letters text[];
ALTER TABLE words ADD COLUMN IF NOT EXISTS unique_letters text[];
ALTER TABLE words ADD COLUMN IF NOT EXISTS letter_count jsonb;
ALTER TABLE words ADD COLUMN IF NOT EXISTS vowel_count integer;
ALTER TABLE words ADD COLUMN IF NOT EXISTS consonant_count integer;
ALTER TABLE words ADD COLUMN IF NOT EXISTS difficulty text;

CREATE INDEX IF NOT EXISTS words_word_idx ON words (word);
CREATE INDEX IF NOT EXISTS words_length_idx ON words (length);

-- =========================================================================
--  daily_puzzles
-- =========================================================================
CREATE TABLE IF NOT EXISTS daily_puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  center_letter text NOT NULL,
  outer_letters text[] NOT NULL,
  valid_words text[] NOT NULL,
  pangrams text[] NOT NULL,
  max_score integer DEFAULT 0,
  quality_score integer DEFAULT 0,
  word_count integer DEFAULT 0,
  average_word_length numeric DEFAULT 0,
  word_length_distribution jsonb,
  generator_version text,
  stage integer DEFAULT 0,
  is_approved boolean DEFAULT false,
  approved_by uuid REFERENCES auth.users,
  approved_at timestamptz,
  created_by uuid REFERENCES auth.users,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS max_score integer DEFAULT 0;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS quality_score integer DEFAULT 0;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS word_count integer DEFAULT 0;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS average_word_length numeric DEFAULT 0;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS word_length_distribution jsonb;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS generator_version text;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS stage integer DEFAULT 0;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS is_approved boolean DEFAULT false;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE daily_puzzles ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES auth.users;

CREATE INDEX IF NOT EXISTS daily_puzzles_date_idx ON daily_puzzles (date);

-- =========================================================================
--  game_stats (per-user, per-day)
-- =========================================================================
CREATE TABLE IF NOT EXISTS game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  score integer DEFAULT 0,
  words_found integer DEFAULT 0,
  completed_ranks jsonb,
  created_at timestamptz DEFAULT now(),
  UNIQUE (user_id, date)
);

ALTER TABLE game_stats ADD COLUMN IF NOT EXISTS completed_ranks jsonb;

CREATE INDEX IF NOT EXISTS game_stats_date_idx ON game_stats (date);
CREATE INDEX IF NOT EXISTS game_stats_user_idx ON game_stats (user_id);

-- =========================================================================
--  puzzle_schedule (admin scheduling view)
-- =========================================================================
CREATE TABLE IF NOT EXISTS puzzle_schedule (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  scheduled_date date UNIQUE NOT NULL,
  status text DEFAULT 'pending',
  puzzle_id uuid REFERENCES daily_puzzles,
  created_at timestamptz DEFAULT now()
);

-- =========================================================================
--  Row Level Security
-- =========================================================================
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_schedule ENABLE ROW LEVEL SECURITY;

-- words: public read (so logged-out players can validate words)
DROP POLICY IF EXISTS "Words are readable by everyone" ON words;
CREATE POLICY "Words are readable by everyone"
  ON words FOR SELECT
  TO anon, authenticated
  USING (true);

-- daily_puzzles: public read
DROP POLICY IF EXISTS "Daily puzzles are readable by everyone" ON daily_puzzles;
CREATE POLICY "Daily puzzles are readable by everyone"
  ON daily_puzzles FOR SELECT
  TO anon, authenticated
  USING (true);

-- game_stats: leaderboard reads are public; writes are restricted to the owner
DROP POLICY IF EXISTS "Game stats are readable by everyone" ON game_stats;
CREATE POLICY "Game stats are readable by everyone"
  ON game_stats FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Users can insert their own game stats" ON game_stats;
CREATE POLICY "Users can insert their own game stats"
  ON game_stats FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own game stats" ON game_stats;
CREATE POLICY "Users can update their own game stats"
  ON game_stats FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- puzzle_schedule: readable by authenticated users (writes via service role)
DROP POLICY IF EXISTS "Schedule readable by authenticated" ON puzzle_schedule;
CREATE POLICY "Schedule readable by authenticated"
  ON puzzle_schedule FOR SELECT
  TO authenticated
  USING (true);
