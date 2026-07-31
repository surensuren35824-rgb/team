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
    PostgrestVersion: "14.15"
  }
  public: {
    Tables: {
      applications: {
        Row: {
          ai_summary: string | null
          cover_note: string | null
          created_at: string
          id: string
          internship_id: string
          match_score: number | null
          matched_skills: string[]
          missing_skills: string[]
          recruiter_notes: string | null
          status: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          cover_note?: string | null
          created_at?: string
          id?: string
          internship_id: string
          match_score?: number | null
          matched_skills?: string[]
          missing_skills?: string[]
          recruiter_notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id: string
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          cover_note?: string | null
          created_at?: string
          id?: string
          internship_id?: string
          match_score?: number | null
          matched_skills?: string[]
          missing_skills?: string[]
          recruiter_notes?: string | null
          status?: Database["public"]["Enums"]["application_status"]
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      companies: {
        Row: {
          created_at: string
          description: string | null
          id: string
          industry: string | null
          location: string | null
          logo_url: string | null
          name: string
          owner_id: string
          updated_at: string
          verified: boolean
          website: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name: string
          owner_id: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          industry?: string | null
          location?: string | null
          logo_url?: string | null
          name?: string
          owner_id?: string
          updated_at?: string
          verified?: boolean
          website?: string | null
        }
        Relationships: []
      }
      internships: {
        Row: {
          company_id: string
          created_at: string
          deadline: string | null
          description: string
          duration_months: number | null
          id: string
          location: string | null
          min_cgpa: number | null
          openings: number
          posted_by: string
          preferred_skills: string[]
          required_skills: string[]
          responsibilities: string | null
          status: Database["public"]["Enums"]["internship_status"]
          stipend_max: number | null
          stipend_min: number | null
          title: string
          updated_at: string
          work_mode: Database["public"]["Enums"]["work_mode"]
        }
        Insert: {
          company_id: string
          created_at?: string
          deadline?: string | null
          description?: string
          duration_months?: number | null
          id?: string
          location?: string | null
          min_cgpa?: number | null
          openings?: number
          posted_by: string
          preferred_skills?: string[]
          required_skills?: string[]
          responsibilities?: string | null
          status?: Database["public"]["Enums"]["internship_status"]
          stipend_max?: number | null
          stipend_min?: number | null
          title: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Update: {
          company_id?: string
          created_at?: string
          deadline?: string | null
          description?: string
          duration_months?: number | null
          id?: string
          location?: string | null
          min_cgpa?: number | null
          openings?: number
          posted_by?: string
          preferred_skills?: string[]
          required_skills?: string[]
          responsibilities?: string | null
          status?: Database["public"]["Enums"]["internship_status"]
          stipend_max?: number | null
          stipend_min?: number | null
          title?: string
          updated_at?: string
          work_mode?: Database["public"]["Enums"]["work_mode"]
        }
        Relationships: [
          {
            foreignKeyName: "internships_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch: string | null
          career_goal: string | null
          certifications: string[]
          cgpa: number | null
          college: string | null
          created_at: string
          email: string | null
          full_name: string | null
          github_url: string | null
          graduation_year: number | null
          headline: string | null
          id: string
          linkedin_url: string | null
          portfolio_url: string | null
          preferred_location: string | null
          resume_text: string | null
          role: Database["public"]["Enums"]["app_role"]
          skills: string[]
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          branch?: string | null
          career_goal?: string | null
          certifications?: string[]
          cgpa?: number | null
          college?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          headline?: string | null
          id: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_location?: string | null
          resume_text?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          branch?: string | null
          career_goal?: string | null
          certifications?: string[]
          cgpa?: number | null
          college?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          github_url?: string | null
          graduation_year?: number | null
          headline?: string | null
          id?: string
          linkedin_url?: string | null
          portfolio_url?: string | null
          preferred_location?: string | null
          resume_text?: string | null
          role?: Database["public"]["Enums"]["app_role"]
          skills?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      saved_internships: {
        Row: {
          created_at: string
          id: string
          internship_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          internship_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          id?: string
          internship_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_internships_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
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
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "recruiter" | "placement" | "mentor" | "admin"
      application_status:
        | "applied"
        | "shortlisted"
        | "interview"
        | "offered"
        | "rejected"
        | "withdrawn"
      internship_status: "draft" | "published" | "closed"
      work_mode: "remote" | "onsite" | "hybrid"
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
      app_role: ["student", "recruiter", "placement", "mentor", "admin"],
      application_status: [
        "applied",
        "shortlisted",
        "interview",
        "offered",
        "rejected",
        "withdrawn",
      ],
      internship_status: ["draft", "published", "closed"],
      work_mode: ["remote", "onsite", "hybrid"],
    },
  },
} as const
