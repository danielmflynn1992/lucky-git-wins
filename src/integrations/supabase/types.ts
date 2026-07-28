export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      client_errors: {
        Row: {
          count: number
          created_at: string
          extra: Json | null
          fingerprint: string
          id: string
          kind: string
          last_seen_at: string
          message: string
          resolved: boolean
          route: string | null
          severity: string
          stack: string | null
          user_agent: string | null
          viewport: string | null
        }
        Insert: {
          count?: number
          created_at?: string
          extra?: Json | null
          fingerprint: string
          id?: string
          kind: string
          last_seen_at?: string
          message: string
          resolved?: boolean
          route?: string | null
          severity: string
          stack?: string | null
          user_agent?: string | null
          viewport?: string | null
        }
        Update: {
          count?: number
          created_at?: string
          extra?: Json | null
          fingerprint?: string
          id?: string
          kind?: string
          last_seen_at?: string
          message?: string
          resolved?: boolean
          route?: string | null
          severity?: string
          stack?: string | null
          user_agent?: string | null
          viewport?: string | null
        }
        Relationships: []
      }
      competition_secrets: {
        Row: {
          competition_id: string
          created_at: string
          seed: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          seed: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          seed?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_secrets_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: true
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "competition_secrets_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: true
            referencedRelation: "question_performance"
            referencedColumns: ["competition_id"]
          },
        ]
      }
      competitions: {
        Row: {
          cash_alternative: number
          category: string
          created_at: string
          description: string
          ends_at: string
          hot: boolean
          id: string
          image: string
          letterbox_style: Database["public"]["Enums"]["letterbox_style"]
          max_per_person: number
          price_per_ticket: number
          question_id: string | null
          seed_hash: string
          slug: string
          status: string
          subtitle: string
          supporting_images: string[]
          thumb_url: string | null
          title: string
          total_tickets: number
        }
        Insert: {
          cash_alternative?: number
          category: string
          created_at?: string
          description?: string
          ends_at: string
          hot?: boolean
          id?: string
          image?: string
          letterbox_style?: Database["public"]["Enums"]["letterbox_style"]
          max_per_person?: number
          price_per_ticket: number
          question_id?: string | null
          seed_hash?: string
          slug: string
          status?: string
          subtitle?: string
          supporting_images?: string[]
          thumb_url?: string | null
          title: string
          total_tickets: number
        }
        Update: {
          cash_alternative?: number
          category?: string
          created_at?: string
          description?: string
          ends_at?: string
          hot?: boolean
          id?: string
          image?: string
          letterbox_style?: Database["public"]["Enums"]["letterbox_style"]
          max_per_person?: number
          price_per_ticket?: number
          question_id?: string | null
          seed_hash?: string
          slug?: string
          status?: string
          subtitle?: string
          supporting_images?: string[]
          thumb_url?: string | null
          title?: string
          total_tickets?: number
        }
        Relationships: [
          {
            foreignKeyName: "competitions_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      draws: {
        Row: {
          competition_id: string | null
          competition_title: string
          created_at: string
          draw_method: string
          draw_pool: string | null
          drawn_at: string
          drew_from: string
          id: string
          notes: string
          photo_consent: boolean
          prize: string
          qualifying_pool_size: number | null
          seed_hash: string
          seed_revealed: string
          total_sold: number | null
          total_tickets: number
          verification_hash: string
          winner_display_name: string
          winner_photo_url: string | null
          winner_quote: string | null
          winner_town: string
          winning_number: number
        }
        Insert: {
          competition_id?: string | null
          competition_title: string
          created_at?: string
          draw_method?: string
          draw_pool?: string | null
          drawn_at?: string
          drew_from?: string
          id?: string
          notes?: string
          photo_consent?: boolean
          prize: string
          qualifying_pool_size?: number | null
          seed_hash?: string
          seed_revealed?: string
          total_sold?: number | null
          total_tickets: number
          verification_hash?: string
          winner_display_name: string
          winner_photo_url?: string | null
          winner_quote?: string | null
          winner_town?: string
          winning_number: number
        }
        Update: {
          competition_id?: string | null
          competition_title?: string
          created_at?: string
          draw_method?: string
          draw_pool?: string | null
          drawn_at?: string
          drew_from?: string
          id?: string
          notes?: string
          photo_consent?: boolean
          prize?: string
          qualifying_pool_size?: number | null
          seed_hash?: string
          seed_revealed?: string
          total_sold?: number | null
          total_tickets?: number
          verification_hash?: string
          winner_display_name?: string
          winner_photo_url?: string | null
          winner_quote?: string | null
          winner_town?: string
          winning_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "draws_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "draws_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "question_performance"
            referencedColumns: ["competition_id"]
          },
        ]
      }
      drop_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          user_id?: string | null
        }
        Relationships: []
      }
      entry_answers: {
        Row: {
          answered_at: string
          competition_id: string
          id: string
          is_correct: boolean
          normalised_answer: number | null
          order_ref: string
          question_id: string | null
          raw_answer: string
          user_id: string | null
        }
        Insert: {
          answered_at?: string
          competition_id: string
          id?: string
          is_correct: boolean
          normalised_answer?: number | null
          order_ref: string
          question_id?: string | null
          raw_answer?: string
          user_id?: string | null
        }
        Update: {
          answered_at?: string
          competition_id?: string
          id?: string
          is_correct?: boolean
          normalised_answer?: number | null
          order_ref?: string
          question_id?: string | null
          raw_answer?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "entry_answers_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_answers_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "question_performance"
            referencedColumns: ["competition_id"]
          },
          {
            foreignKeyName: "entry_answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "question_bank"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          date_of_birth: string
          display_name: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          date_of_birth: string
          display_name?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          date_of_birth?: string
          display_name?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      question_bank: {
        Row: {
          answer_format: string
          category: string
          correct_answer: number
          created_at: string
          id: string
          is_active: boolean
          question_text: string
          times_correct: number
          times_served: number
          updated_at: string
        }
        Insert: {
          answer_format?: string
          category?: string
          correct_answer: number
          created_at?: string
          id?: string
          is_active?: boolean
          question_text: string
          times_correct?: number
          times_served?: number
          updated_at?: string
        }
        Update: {
          answer_format?: string
          category?: string
          correct_answer?: number
          created_at?: string
          id?: string
          is_active?: boolean
          question_text?: string
          times_correct?: number
          times_served?: number
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      tickets: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          is_qualifying: boolean
          number: number
          order_id: string | null
          order_ref: string | null
          owner_id: string | null
          reservation_token: string | null
          reserved_until: string | null
          skill_answer: number | null
          status: string
        }
        Insert: {
          competition_id: string
          created_at?: string
          id?: string
          is_qualifying?: boolean
          number: number
          order_id?: string | null
          order_ref?: string | null
          owner_id?: string | null
          reservation_token?: string | null
          reserved_until?: string | null
          skill_answer?: number | null
          status?: string
        }
        Update: {
          competition_id?: string
          created_at?: string
          id?: string
          is_qualifying?: boolean
          number?: number
          order_id?: string | null
          order_ref?: string | null
          owner_id?: string | null
          reservation_token?: string | null
          reserved_until?: string | null
          skill_answer?: number | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "question_performance"
            referencedColumns: ["competition_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      question_performance: {
        Row: {
          competition_id: string | null
          correct_count: number | null
          incorrect_count: number | null
          incorrect_pct: number | null
          slug: string | null
          status: string | null
          title: string | null
          total_answers: number | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_answer_stats: {
        Args: never
        Returns: {
          attempts: number
          day: string
          incorrect: number
        }[]
      }
      admin_export_entry_answers: {
        Args: never
        Returns: {
          answered_at: string
          competition_title: string
          is_correct: boolean
          normalised_answer: number
          order_ref: string
          question_text: string
          raw_answer: string
        }[]
      }
      admin_list_questions: {
        Args: never
        Returns: {
          answer_format: string
          category: string
          created_at: string
          id: string
          is_active: boolean
          question_text: string
          times_correct: number
          times_served: number
        }[]
      }
      admin_set_question_active: {
        Args: { p_active: boolean; p_id: string }
        Returns: undefined
      }
      admin_upsert_question: {
        Args: {
          p_answer_format: string
          p_category: string
          p_correct_answer: number
          p_id: string
          p_question_text: string
        }
        Returns: string
      }
      auto_draw_expired: {
        Args: never
        Returns: {
          competition_id: string | null
          competition_title: string
          created_at: string
          draw_method: string
          draw_pool: string | null
          drawn_at: string
          drew_from: string
          id: string
          notes: string
          photo_consent: boolean
          prize: string
          qualifying_pool_size: number | null
          seed_hash: string
          seed_revealed: string
          total_sold: number | null
          total_tickets: number
          verification_hash: string
          winner_display_name: string
          winner_photo_url: string | null
          winner_quote: string | null
          winner_town: string
          winning_number: number
        }[]
        SetofOptions: {
          from: "*"
          to: "draws"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_admin_if_empty: { Args: never; Returns: boolean }
      competition_revealed_answer: {
        Args: { p_slug: string }
        Returns: {
          answer_format: string
          correct_answer: number
          question_text: string
        }[]
      }
      competition_sold_counts: {
        Args: never
        Returns: {
          competition_id: string
          sold: number
        }[]
      }
      create_competition_with_tickets: {
        Args: {
          p_cash_alternative: number
          p_category: string
          p_description: string
          p_ends_at: string
          p_hot: boolean
          p_image: string
          p_letterbox_style?: string
          p_max_per_person: number
          p_price_per_ticket: number
          p_question_id?: string
          p_slug: string
          p_status: string
          p_subtitle: string
          p_supporting_images?: string[]
          p_thumb_url?: string
          p_title: string
          p_total_tickets: number
        }
        Returns: string
      }
      draw_competition: {
        Args: { p_comp_id: string; p_notes?: string }
        Returns: {
          competition_id: string | null
          competition_title: string
          created_at: string
          draw_method: string
          draw_pool: string | null
          drawn_at: string
          drew_from: string
          id: string
          notes: string
          photo_consent: boolean
          prize: string
          qualifying_pool_size: number | null
          seed_hash: string
          seed_revealed: string
          total_sold: number | null
          total_tickets: number
          verification_hash: string
          winner_display_name: string
          winner_photo_url: string | null
          winner_quote: string | null
          winner_town: string
          winning_number: number
        }
        SetofOptions: {
          from: "*"
          to: "draws"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      get_competition_question: {
        Args: { p_slug: string }
        Returns: {
          answer_format: string
          id: string
          question_text: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      log_client_error: {
        Args: {
          _extra: Json
          _fingerprint: string
          _kind: string
          _message: string
          _route: string
          _severity: string
          _stack: string
          _user_agent: string
          _viewport: string
        }
        Returns: undefined
      }
      normalise_numeric_answer: { Args: { p_raw: string }; Returns: number }
      pick_question_for_competition: { Args: never; Returns: string }
      release_reservation: { Args: { p_token: string }; Returns: undefined }
      reserve_lucky_dip: {
        Args: { p_qty: number; p_slug: string; p_token: string }
        Returns: number[]
      }
      reserve_specific_numbers: {
        Args: { p_numbers: number[]; p_slug: string; p_token: string }
        Returns: number[]
      }
      submit_skill_answer: {
        Args: {
          p_order_ref?: string
          p_question_id: string
          p_raw_answer: string
          p_reservation_token: string
        }
        Returns: Json
      }
      sweep_expired_reservations: { Args: never; Returns: undefined }
      unresolved_client_errors_count: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      letterbox_style: "solid" | "gradient" | "blur"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      letterbox_style: ["solid", "gradient", "blur"],
    },
  },
} as const
