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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      assets: {
        Row: {
          code: string
          created_at: string
          description: string | null
          for_lead_type: Database["public"]["Enums"]["lead_type"][] | null
          id: string
          name: string
          notion_page_id: string | null
          tags: string[] | null
          type: string
          updated_at: string
          url: string
        }
        Insert: {
          code: string
          created_at?: string
          description?: string | null
          for_lead_type?: Database["public"]["Enums"]["lead_type"][] | null
          id?: string
          name: string
          notion_page_id?: string | null
          tags?: string[] | null
          type: string
          updated_at?: string
          url: string
        }
        Update: {
          code?: string
          created_at?: string
          description?: string | null
          for_lead_type?: Database["public"]["Enums"]["lead_type"][] | null
          id?: string
          name?: string
          notion_page_id?: string | null
          tags?: string[] | null
          type?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      client_orders: {
        Row: {
          created_at: string
          id: string
          items: string
          lead_id: string
          notes: string | null
          order_date: string
          total_value: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          items?: string
          lead_id: string
          notes?: string | null
          order_date?: string
          total_value?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          items?: string
          lead_id?: string
          notes?: string | null
          order_date?: string
          total_value?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_orders_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      interactions: {
        Row: {
          asset_sent: string | null
          content: string | null
          created_at: string
          direction: Database["public"]["Enums"]["interaction_direction"]
          id: string
          lead_id: string
          notion_page_id: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Insert: {
          asset_sent?: string | null
          content?: string | null
          created_at?: string
          direction: Database["public"]["Enums"]["interaction_direction"]
          id?: string
          lead_id: string
          notion_page_id?: string | null
          type: Database["public"]["Enums"]["interaction_type"]
          user_id: string
        }
        Update: {
          asset_sent?: string | null
          content?: string | null
          created_at?: string
          direction?: Database["public"]["Enums"]["interaction_direction"]
          id?: string
          lead_id?: string
          notion_page_id?: string | null
          type?: Database["public"]["Enums"]["interaction_type"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "interactions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
            referencedColumns: ["id"]
          },
        ]
      }
      leads: {
        Row: {
          city: string | null
          company: string | null
          created_at: string
          email: string | null
          id: string
          last_touch_at: string | null
          lead_type: Database["public"]["Enums"]["lead_type"]
          name: string
          next_action_at: string
          next_action_note: string | null
          next_action_type: Database["public"]["Enums"]["action_type"]
          notion_page_id: string | null
          nurture_step: number | null
          nurture_track_id: string | null
          observations: string | null
          origin: Database["public"]["Enums"]["lead_origin"]
          phone: string
          priority: Database["public"]["Enums"]["lead_priority"]
          score: number | null
          stage: string
          state: string | null
          status_final: Database["public"]["Enums"]["lead_status_final"]
          substatus: string | null
          synced_at: string | null
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_touch_at?: string | null
          lead_type?: Database["public"]["Enums"]["lead_type"]
          name: string
          next_action_at: string
          next_action_note?: string | null
          next_action_type: Database["public"]["Enums"]["action_type"]
          notion_page_id?: string | null
          nurture_step?: number | null
          nurture_track_id?: string | null
          observations?: string | null
          origin: Database["public"]["Enums"]["lead_origin"]
          phone: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          score?: number | null
          stage?: string
          state?: string | null
          status_final?: Database["public"]["Enums"]["lead_status_final"]
          substatus?: string | null
          synced_at?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          city?: string | null
          company?: string | null
          created_at?: string
          email?: string | null
          id?: string
          last_touch_at?: string | null
          lead_type?: Database["public"]["Enums"]["lead_type"]
          name?: string
          next_action_at?: string
          next_action_note?: string | null
          next_action_type?: Database["public"]["Enums"]["action_type"]
          notion_page_id?: string | null
          nurture_step?: number | null
          nurture_track_id?: string | null
          observations?: string | null
          origin?: Database["public"]["Enums"]["lead_origin"]
          phone?: string
          priority?: Database["public"]["Enums"]["lead_priority"]
          score?: number | null
          stage?: string
          state?: string | null
          status_final?: Database["public"]["Enums"]["lead_status_final"]
          substatus?: string | null
          synced_at?: string | null
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_nurture_track_id_fkey"
            columns: ["nurture_track_id"]
            isOneToOne: false
            referencedRelation: "nurture_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      nurture_tracks: {
        Row: {
          created_at: string
          description: string | null
          id: string
          lead_type: Database["public"]["Enums"]["lead_type"]
          name: string
          notion_page_id: string | null
          steps: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          lead_type: Database["public"]["Enums"]["lead_type"]
          name: string
          notion_page_id?: string | null
          steps?: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          lead_type?: Database["public"]["Enums"]["lead_type"]
          name?: string
          notion_page_id?: string | null
          steps?: Json
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      scripts: {
        Row: {
          content: string
          created_at: string
          id: string
          sort_order: number
          stage: string
          tags: string[] | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          sort_order?: number
          stage: string
          tags?: string[] | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          sort_order?: number
          stage?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          action_type: Database["public"]["Enums"]["action_type"]
          created_at: string
          due_at: string
          id: string
          lead_id: string
          note: string | null
          notion_page_id: string | null
          priority: Database["public"]["Enums"]["lead_priority"]
          status: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_type: Database["public"]["Enums"]["action_type"]
          created_at?: string
          due_at: string
          id?: string
          lead_id: string
          note?: string | null
          notion_page_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_type?: Database["public"]["Enums"]["action_type"]
          created_at?: string
          due_at?: string
          id?: string
          lead_id?: string
          note?: string | null
          notion_page_id?: string | null
          priority?: Database["public"]["Enums"]["lead_priority"]
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "leads"
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
          role?: Database["public"]["Enums"]["app_role"]
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      action_type:
        | "WHATSAPP"
        | "LIGACAO"
        | "EMAIL"
        | "VISITA"
        | "REUNIAO"
        | "ENVIAR_MATERIAL"
        | "ENVIAR_PROPOSTA"
        | "FOLLOW_UP"
        | "DEMONSTRACAO"
      app_role: "admin" | "user"
      interaction_direction: "IN" | "OUT"
      interaction_type:
        | "WHATSAPP_IN"
        | "WHATSAPP_OUT"
        | "LIGACAO_IN"
        | "LIGACAO_OUT"
        | "EMAIL_IN"
        | "EMAIL_OUT"
        | "VISITA"
        | "REUNIAO"
        | "MUDANCA_ETAPA"
        | "NOTA"
      lead_origin:
        | "NUVEMSHOP"
        | "INSTAGRAM"
        | "GOOGLE"
        | "WHATSAPP"
        | "TELEFONE"
        | "INDICACAO"
        | "PRESENCIAL_EMPRESA"
        | "VISITA_SALAO"
      lead_priority: "P1" | "P2" | "P3" | "P4"
      lead_status_final: "ATIVO" | "CONVERTIDO" | "PERDIDO" | "FORA_PERFIL"
      lead_type: "PROFISSIONAL" | "DISTRIBUIDOR" | "NAO_QUALIFICADO"
      task_status: "OPEN" | "DONE" | "CANCELED"
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
      action_type: [
        "WHATSAPP",
        "LIGACAO",
        "EMAIL",
        "VISITA",
        "REUNIAO",
        "ENVIAR_MATERIAL",
        "ENVIAR_PROPOSTA",
        "FOLLOW_UP",
        "DEMONSTRACAO",
      ],
      app_role: ["admin", "user"],
      interaction_direction: ["IN", "OUT"],
      interaction_type: [
        "WHATSAPP_IN",
        "WHATSAPP_OUT",
        "LIGACAO_IN",
        "LIGACAO_OUT",
        "EMAIL_IN",
        "EMAIL_OUT",
        "VISITA",
        "REUNIAO",
        "MUDANCA_ETAPA",
        "NOTA",
      ],
      lead_origin: [
        "NUVEMSHOP",
        "INSTAGRAM",
        "GOOGLE",
        "WHATSAPP",
        "TELEFONE",
        "INDICACAO",
        "PRESENCIAL_EMPRESA",
        "VISITA_SALAO",
      ],
      lead_priority: ["P1", "P2", "P3", "P4"],
      lead_status_final: ["ATIVO", "CONVERTIDO", "PERDIDO", "FORA_PERFIL"],
      lead_type: ["PROFISSIONAL", "DISTRIBUIDOR", "NAO_QUALIFICADO"],
      task_status: ["OPEN", "DONE", "CANCELED"],
    },
  },
} as const
