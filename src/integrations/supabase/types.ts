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
          instant_win: boolean
          max_per_person: number
          price_per_ticket: number
          skill_question: Json
          slug: string
          status: string
          subtitle: string
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
          instant_win?: boolean
          max_per_person?: number
          price_per_ticket: number
          skill_question?: Json
          slug: string
          status?: string
          subtitle?: string
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
          instant_win?: boolean
          max_per_person?: number
          price_per_ticket?: number
          skill_question?: Json
          slug?: string
          status?: string
          subtitle?: string
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
          drawn_at: string
          id: string
          notes: string
          prize: string
          total_tickets: number
          verification_hash: string
          winner_display_name: string
          winner_town: string
          winning_number: number
        }
        Insert: {
          competition_id?: string | null
          competition_title: string
          created_at?: string
          draw_method?: string
          drawn_at?: string
          id?: string
          notes?: string
          prize: string
          total_tickets: number
          verification_hash?: string
          winner_display_name: string
          winner_town?: string
          winning_number: number
        }
        Update: {
          competition_id?: string | null
          competition_title?: string
          created_at?: string
          draw_method?: string
          drawn_at?: string
          id?: string
          notes?: string
          prize?: string
          total_tickets?: number
          verification_hash?: string
          winner_display_name?: string
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
        ]
      }
      tickets: {
        Row: {
          competition_id: string
          created_at: string
          id: string
          instant_win_prize: number | null
          is_instant_win: boolean
          number: number
          order_id: string | null
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
          instant_win_prize?: number | null
          is_instant_win?: boolean
          number: number
          order_id?: string | null
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
          instant_win_prize?: number | null
          is_instant_win?: boolean
          number?: number
          order_id?: string | null
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
      [_ in never]: never
    }
    Functions: {
      auto_draw_expired: {
        Args: never
        Returns: {
          competition_id: string | null
          competition_title: string
          created_at: string
          draw_method: string
          drawn_at: string
          id: string
          notes: string
          prize: string
          total_tickets: number
          verification_hash: string
          winner_display_name: string
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
      create_competition_with_tickets: {
        Args: {
          p_cash_alternative: number
          p_category: string
          p_description: string
          p_ends_at: string
          p_hot: boolean
          p_image: string
          p_instant_win: boolean
          p_instant_win_count: number
          p_instant_win_prize: number
          p_max_per_person: number
          p_price_per_ticket: number
          p_skill_question: Json
          p_slug: string
          p_status: string
          p_subtitle: string
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
          drawn_at: string
          id: string
          notes: string
          prize: string
          total_tickets: number
          verification_hash: string
          winner_display_name: string
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
      release_reservation: { Args: { p_token: string }; Returns: undefined }
      reserve_lucky_dip: {
        Args: {
          p_qty: number
          p_skill_answer: number
          p_slug: string
          p_token: string
        }
        Returns: number[]
      }
      reserve_specific_numbers: {
        Args: {
          p_numbers: number[]
          p_skill_answer: number
          p_slug: string
          p_token: string
        }
        Returns: number[]
      }
      sweep_expired_reservations: { Args: never; Returns: undefined }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    },
  },
} as const
