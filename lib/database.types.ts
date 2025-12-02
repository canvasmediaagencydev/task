export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          assignee_id: string | null
          completed_at: string | null
          created_at: string | null
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          parent_task_id: string | null
          priority: string | null
          project_id: string | null
          reviewer_id: string | null
          status: string | null
          title: string
          type: string | null
          updated_at: string | null
          weekly_cycle_id: string | null
        }
        Insert: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          reviewer_id?: string | null
          status?: string | null
          title: string
          type?: string | null
          updated_at?: string | null
          weekly_cycle_id?: string | null
        }
        Update: {
          assignee_id?: string | null
          completed_at?: string | null
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          parent_task_id?: string | null
          priority?: string | null
          project_id?: string | null
          reviewer_id?: string | null
          status?: string | null
          title?: string
          type?: string | null
          updated_at?: string | null
          weekly_cycle_id?: string | null
        }
      }
      projects: {
        Row: {
          ae_id: string | null
          brief_link: string | null
          client_id: string | null
          confirmed_at: string | null
          created_at: string | null
          created_by: string | null
          end_date: string | null
          id: string
          internal_notes: string | null
          name: string
          pipeline_stage_id: string | null
          qt_link: string | null
          sales_person_id: string | null
          start_date: string | null
          status: string | null
          updated_at: string | null
        }
      }
      clients: {
        Row: {
          company_name: string | null
          contact_person: string | null
          created_at: string | null
          created_by: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          updated_at: string | null
        }
      }
      users: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          email: string
          full_name: string
          id: string
          is_active: boolean | null
          updated_at: string | null
        }
      }
      activity_logs: {
        Row: {
          action: string
          changes: Json | null
          created_at: string | null
          created_by: string | null
          description: string | null
          entity_id: string
          entity_type: string
          id: string
        }
      }
    }
    Views: {}
    Functions: {}
    Enums: {}
  }
}
