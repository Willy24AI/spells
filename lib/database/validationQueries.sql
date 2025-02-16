-- Validation Queries for Dictionary Database

-- 1. Basic Statistics
SELECT 
  COUNT(*) as total_words,
  AVG(length) as avg_word_length,
  MIN(length) as min_length,
  MAX(length) as max_length,
  COUNT(*) FILTER (WHERE is_pangram_7 = true) as pangram_count
FROM words;

-- 2. Distribution by Difficulty
SELECT 
  difficulty,
  COUNT(*) as word_count,
  ROUND(AVG(length), 2) as avg_length,
  ROUND(AVG(points), 2) as avg_points
FROM words
GROUP BY difficulty
ORDER BY 
  CASE difficulty 
    WHEN 'easy' THEN 1 
    WHEN 'normal' THEN 2 
    WHEN 'hard' THEN 3 
  END;

-- 3. Validate Word Properties
SELECT word, length, letters
FROM words
WHERE 
  -- Verify length matches letters array
  length != array_length(letters, 1)
  -- Or letter_count doesn't match letters
  OR jsonb_object_length(letter_count::jsonb) != array_length(unique_letters, 1);

-- 4. Check for Potential Data Issues
SELECT word
FROM words
WHERE 
  -- Words shorter than minimum
  length < 4
  -- Words with invalid characters
  OR word !~ '^[a-z]+$'
  -- Inconsistent pangram marking
  OR (is_pangram_7 = true AND array_length(unique_letters, 1) != 7)
  -- Missing required data
  OR letters IS NULL
  OR unique_letters IS NULL
  OR letter_count IS NULL;

-- 5. Letter Frequency Analysis
WITH letter_counts AS (
  SELECT 
    unnest(letters) as letter,
    COUNT(*) as frequency
  FROM words
  GROUP BY letter
)
SELECT 
  letter,
  frequency,
  ROUND(frequency * 100.0 / (SELECT SUM(frequency) FROM letter_counts), 2) as percentage
FROM letter_counts
ORDER BY frequency DESC;

-- 6. Pangram Analysis
SELECT 
  word,
  length,
  points,
  difficulty
FROM words
WHERE is_pangram_7 = true
ORDER BY length;

-- 7. Word Distribution by Length
SELECT 
  length,
  COUNT(*) as word_count,
  ROUND(AVG(points), 2) as avg_points,
  COUNT(*) FILTER (WHERE is_pangram_7 = true) as pangrams
FROM words
GROUP BY length
ORDER BY length;

-- 8. Validate Points Calculation
SELECT word, points, length
FROM words
WHERE 
  -- Check if points match length rules
  (length = 4 AND points != 1)
  OR (length > 4 AND points != length AND NOT is_pangram_7)
  OR (is_pangram_7 AND points != length + 7);

-- 9. Check Puzzle Generation Potential
WITH letter_combinations AS (
  SELECT 
    letter as center,
    array_agg(DISTINCT l) as possible_outer_letters
  FROM words,
    unnest(letters) as letter,
    unnest(letters) as l
  WHERE l != letter
  GROUP BY letter
)
SELECT 
  center,
  array_length(possible_outer_letters, 1) as unique_letters,
  CASE 
    WHEN array_length(possible_outer_letters, 1) >= 6 THEN 'Valid for puzzles'
    ELSE 'Insufficient letters'
  END as puzzle_status
FROM letter_combinations
ORDER BY array_length(possible_outer_letters, 1) DESC;

-- 10. Identify Common Word Patterns
WITH patterns AS (
  SELECT 
    word,
    array_agg(letter ORDER BY letter) as sorted_letters
  FROM words,
    unnest(letters) as letter
  GROUP BY word
)
SELECT 
  sorted_letters,
  COUNT(*) as frequency,
  array_agg(word) as words
FROM patterns
GROUP BY sorted_letters
HAVING COUNT(*) > 1
ORDER BY COUNT(*) DESC
LIMIT 20;

-- 11. Index Health Check
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'words'
ORDER BY indexname;

-- 12. Database Size Analysis
SELECT 
  pg_size_pretty(pg_total_relation_size('words')) as total_size,
  pg_size_pretty(pg_table_size('words')) as table_size,
  pg_size_pretty(pg_indexes_size('words')) as index_size;