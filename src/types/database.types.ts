/**
 * 数据库类型定义
 * 
 * 基于Supabase数据库架构自动生成的TypeScript类型定义
 * 确保前端代码与数据库架构保持同步
 */

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string | null
          avatar_url: string | null
          subscription_tier: 'free' | 'pro' | 'team'
          subscription_expires_at: string | null
          subscription_features: Record<string, any>
          preferences: {
            defaultLearningLevel: 'beginner' | 'expert'
            theme: 'light' | 'dark'
            language: 'zh' | 'en'
            soundEnabled: boolean
            autoSave: boolean
          }
          total_sessions: number
          total_cards: number
          last_login_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          username?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'team'
          subscription_expires_at?: string | null
          subscription_features?: Record<string, any>
          preferences?: {
            defaultLearningLevel?: 'beginner' | 'expert'
            theme?: 'light' | 'dark'
            language?: 'zh' | 'en'
            soundEnabled?: boolean
            autoSave?: boolean
          }
          total_sessions?: number
          total_cards?: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string | null
          avatar_url?: string | null
          subscription_tier?: 'free' | 'pro' | 'team'
          subscription_expires_at?: string | null
          subscription_features?: Record<string, any>
          preferences?: {
            defaultLearningLevel?: 'beginner' | 'expert'
            theme?: 'light' | 'dark'
            language?: 'zh' | 'en'
            soundEnabled?: boolean
            autoSave?: boolean
          }
          total_sessions?: number
          total_cards?: number
          last_login_at?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      learning_sessions: {
        Row: {
          id: string
          user_id: string
          title: string
          document_content: string | null
          document_type: 'url' | 'pdf' | 'word' | 'ppt' | 'markdown' | 'text'
          learning_level: 'beginner' | 'expert'
          status: 'draft' | 'active' | 'completed' | 'paused'
          outline: Array<any>
          current_chapter: string | null
          progress: Record<string, any>
          message_count: number
          card_count: number
          completion_percentage: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          document_content?: string | null
          document_type: 'url' | 'pdf' | 'word' | 'ppt' | 'markdown' | 'text'
          learning_level: 'beginner' | 'expert'
          status?: 'draft' | 'active' | 'completed' | 'paused'
          outline?: Array<any>
          current_chapter?: string | null
          progress?: Record<string, any>
          message_count?: number
          card_count?: number
          completion_percentage?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          document_content?: string | null
          document_type?: 'url' | 'pdf' | 'word' | 'ppt' | 'markdown' | 'text'
          learning_level?: 'beginner' | 'expert'
          status?: 'draft' | 'active' | 'completed' | 'paused'
          outline?: Array<any>
          current_chapter?: string | null
          progress?: Record<string, any>
          message_count?: number
          card_count?: number
          completion_percentage?: number
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          chapter_id: string | null
          is_bookmarked: boolean
          card_id: string | null
          metadata: Record<string, any>
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          chapter_id?: string | null
          is_bookmarked?: boolean
          card_id?: string | null
          metadata?: Record<string, any>
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          chapter_id?: string | null
          is_bookmarked?: boolean
          card_id?: string | null
          metadata?: Record<string, any>
          created_at?: string
        }
      }
      learning_cards: {
        Row: {
          id: string
          user_id: string
          session_id: string
          message_id: string | null
          title: string
          content: string
          user_note: string | null
          type: 'inspiration' | 'bookmark'
          tags: string[]
          chapter_id: string | null
          difficulty: number
          review_count: number
          last_reviewed_at: string | null
          next_review_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          session_id: string
          message_id?: string | null
          title: string
          content: string
          user_note?: string | null
          type: 'inspiration' | 'bookmark'
          tags?: string[]
          chapter_id?: string | null
          difficulty?: number
          review_count?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          session_id?: string
          message_id?: string | null
          title?: string
          content?: string
          user_note?: string | null
          type?: 'inspiration' | 'bookmark'
          tags?: string[]
          chapter_id?: string | null
          difficulty?: number
          review_count?: number
          last_reviewed_at?: string | null
          next_review_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_stats: {
        Args: {
          user_uuid: string
        }
        Returns: {
          total_sessions: number
          total_cards: number
          total_messages: number
          cards_due_review: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}

// 便于使用的类型别名
export type DbUser = Database['public']['Tables']['users']['Row']
export type DbUserInsert = Database['public']['Tables']['users']['Insert']
export type DbUserUpdate = Database['public']['Tables']['users']['Update']

export type DbSession = Database['public']['Tables']['learning_sessions']['Row']
export type DbSessionInsert = Database['public']['Tables']['learning_sessions']['Insert']
export type DbSessionUpdate = Database['public']['Tables']['learning_sessions']['Update']

export type DbMessage = Database['public']['Tables']['chat_messages']['Row']
export type DbMessageInsert = Database['public']['Tables']['chat_messages']['Insert']
export type DbMessageUpdate = Database['public']['Tables']['chat_messages']['Update']

export type DbCard = Database['public']['Tables']['learning_cards']['Row']
export type DbCardInsert = Database['public']['Tables']['learning_cards']['Insert']
export type DbCardUpdate = Database['public']['Tables']['learning_cards']['Update']

export type UserStats = Database['public']['Functions']['get_user_stats']['Returns'][0]