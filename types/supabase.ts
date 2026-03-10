export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      analyses: {
        Row: {
          id: string;
          resume_file_name: string;
          resume_text: string;
          resume_sections: Json;
          resume_skills: Json;
          job_description: string;
          jd_skills: Json;
          overall_score: number;
          section_scores: Json;
          missing_skills: Json;
          keyword_analysis: Json;
          ats_score: number;
          strength_score: number;
          improvements: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          resume_file_name: string;
          resume_text: string;
          resume_sections?: Json;
          resume_skills?: Json;
          job_description: string;
          jd_skills?: Json;
          overall_score: number;
          section_scores?: Json;
          missing_skills?: Json;
          keyword_analysis?: Json;
          ats_score: number;
          strength_score: number;
          improvements?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          resume_file_name?: string;
          resume_text?: string;
          resume_sections?: Json;
          resume_skills?: Json;
          job_description?: string;
          jd_skills?: Json;
          overall_score?: number;
          section_scores?: Json;
          missing_skills?: Json;
          keyword_analysis?: Json;
          ats_score?: number;
          strength_score?: number;
          improvements?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      generated_resumes: {
        Row: {
          id: string;
          name: string;
          content: string;
          job_description: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          content: string;
          job_description: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          content?: string;
          job_description?: string;
          created_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
