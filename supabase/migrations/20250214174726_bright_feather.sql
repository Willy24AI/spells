/*
  # Initial Schema Setup for Spelling Bee Game

  1. New Tables
    - `daily_puzzles`
      - `id` (uuid, primary key)
      - `date` (date, unique)
      - `center_letter` (text)
      - `outer_letters` (text[])
      - `valid_words` (text[])
      - `pangrams` (text[])
    
    - `words`
      - `id` (uuid, primary key)
      - `word` (text, unique)
      - `points` (integer)
      - `is_pangram` (boolean)
    
    - `game_stats`
      - `id` (uuid, primary key)
      - `user_id` (uuid, references auth.users)
      - `date` (date)
      - `score` (integer)
      - `words_found` (integer)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Add policies for authenticated users
*/

-- Create daily_puzzles table
CREATE TABLE IF NOT EXISTS daily_puzzles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  date date UNIQUE NOT NULL,
  center_letter text NOT NULL,
  outer_letters text[] NOT NULL,
  valid_words text[] NOT NULL,
  pangrams text[] NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create words table
CREATE TABLE IF NOT EXISTS words (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  word text UNIQUE NOT NULL,
  points integer NOT NULL,
  is_pangram boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Create game_stats table
CREATE TABLE IF NOT EXISTS game_stats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users NOT NULL,
  date date NOT NULL,
  score integer DEFAULT 0,
  words_found integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, date)
);

-- Enable Row Level Security
ALTER TABLE daily_puzzles ENABLE ROW LEVEL SECURITY;
ALTER TABLE words ENABLE ROW LEVEL SECURITY;
ALTER TABLE game_stats ENABLE ROW LEVEL SECURITY;

-- Create policies for daily_puzzles
CREATE POLICY "Daily puzzles are readable by all users"
  ON daily_puzzles
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for words
CREATE POLICY "Words are readable by all users"
  ON words
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policies for game_stats
CREATE POLICY "Users can read their own game stats"
  ON game_stats
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own game stats"
  ON game_stats
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own game stats"
  ON game_stats
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);