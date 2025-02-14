export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      daily_puzzles: {
        Row: {
          id: string
          date: string
          center_letter: string
          outer_letters: string[]
          valid_words: string[]
          pangrams: string[]
          created_at: string
        }
        Insert: {
          id?: string
          date: string
          center_letter: string
          outer_letters: string[]
          valid_words: string[]
          pangrams: string[]
          created_at?: string
        }
        Update: {
          id?: string
          date?: string
          center_letter?: string
          outer_letters?: string[]
          valid_words?: string[]
          pangrams?: string[]
          created_at?: string
        }
      }
      words: {
        Row: {
          id: string
          word: string
          points: number
          is_pangram: boolean
          created_at: string
        }
        Insert: {
          id?: string
          word: string
          points: number
          is_pangram?: boolean
          created_at?: string
        }
        Update: {
          id?: string
          word?: string
          points?: number
          is_pangram?: boolean
          created_at?: string
        }
      }
      game_stats: {
        Row: {
          id: string
          user_id: string
          date: string
          score: number
          words_found: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          date: string
          score?: number
          words_found?: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          date?: string
          score?: number
          words_found?: number
          created_at?: string
        }
      }
    }
  }
}