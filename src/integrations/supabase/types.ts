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
          seed_hash?: string
          slug?: string
          status?: string
          subtitle?: string
          supporting_images?: string[]
          thumb_url?: string | null
          title?: string
          total_tickets?: number
        }
        Relationships: []
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
          order_ref: string
          selected_option: Database["public"]["Enums"]["skill_option"]
          skill_question_id: string
          user_id: string | null
        }
        Insert: {
          answered_at?: string
          competition_id: string
          id?: string
          is_correct: boolean
          order_ref: string
          selected_option: Database["public"]["Enums"]["skill_option"]
          skill_question_id: string
          user_id?: string | null
        }
        Update: {
          answered_at?: string
          competition_id?: string
          id?: string
          is_correct?: boolean
          order_ref?: string
          selected_option?: Database["public"]["Enums"]["skill_option"]
          skill_question_id?: string
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
            foreignKeyName: "entry_answers_skill_question_id_fkey"
            columns: ["skill_question_id"]
            isOneToOne: false
            referencedRelation: "skill_questions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entry_answers_skill_question_id_fkey"
            columns: ["skill_question_id"]
            isOneToOne: false
            referencedRelation: "skill_questions_public"
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
      skill_questions: {
        Row: {
          competition_id: string
          correct_option: Database["public"]["Enums"]["skill_option"]
          created_at: string
          id: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          updated_at: string
        }
        Insert: {
          competition_id: string
          correct_option: Database["public"]["Enums"]["skill_option"]
          created_at?: string
          id?: string
          option_a: string
          option_b: string
          option_c: string
          option_d: string
          question_text: string
          updated_at?: string
        }
        Update: {
          competition_id?: string
          correct_option?: Database["public"]["Enums"]["skill_option"]
          created_at?: string
          id?: string
          option_a?: string
          option_b?: string
          option_c?: string
          option_d?: string
          question_text?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skill_questions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: true
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_questions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: true
            referencedRelation: "question_performance"
            referencedColumns: ["competition_id"]
          },
        ]
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
      skill_questions_public: {
        Row: {
          competition_id: string | null
          id: string | null
          option_a: string | null
          option_b: string | null
          option_c: string | null
          option_d: string | null
          question_text: string | null
        }
        Insert: {
          competition_id?: string | null
          id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_text?: string | null
        }
        Update: {
          competition_id?: string | null
          id?: string | null
          option_a?: string | null
          option_b?: string | null
          option_c?: string | null
          option_d?: string | null
          question_text?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "skill_questions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: true
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "skill_questions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: true
            referencedRelation: "question_performance"
            referencedColumns: ["competition_id"]
          },
        ]
      }
    }
    Functions: {
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
      competition_sold_counts: {
        Args: never
        Returns: {
          competition_id: string
          sold: number
        }[]
      }
      create_competition_with_tickets:
        | {
            Args: {
              p_cash_alternative: number
              p_category: string
              p_correct_option: Database["public"]["Enums"]["skill_option"]
              p_description: string
              p_ends_at: string
              p_hot: boolean
              p_image: string
              p_letterbox_style?: string
              p_max_per_person: number
              p_option_a: string
              p_option_b: string
              p_option_c: string
              p_option_d: string
              p_price_per_ticket: number
              p_question: string
              p_slug: string
              p_status: string
              p_subtitle: string
              p_title: string
              p_total_tickets: number
            }
            Returns: string
          }
        | {
            Args: {
              p_cash_alternative: number
              p_category: string
              p_correct_option: Database["public"]["Enums"]["skill_option"]
              p_description: string
              p_ends_at: string
              p_hot: boolean
              p_image: string
              p_letterbox_style?: string
              p_max_per_person: number
              p_option_a: string
              p_option_b: string
              p_option_c: string
              p_option_d: string
              p_price_per_ticket: number
              p_question: string
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
          p_reservation_token: string
          p_selected: Database["public"]["Enums"]["skill_option"]
        }
        Returns: Json
      }
      sweep_expired_reservations: { Args: never; Returns: undefined }
      unresolved_client_errors_count: { Args: never; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      letterbox_style: "solid" | "gradient" | "blur"
      skill_option: "a" | "b" | "c" | "d"
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
      skill_option: ["a", "b", "c", "d"],
    },
  },
} as const
