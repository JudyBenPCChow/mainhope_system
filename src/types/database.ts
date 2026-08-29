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
      academic_calendar_closures: {
        Row: {
          academic_year_id: string
          closure_date: string
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          closure_date: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          closure_date?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_calendar_closures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_year_periods: {
        Row: {
          academic_year_id: string
          created_at: string
          end_date: string
          id: string
          label: string
          period_code: number
          start_date: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          created_at?: string
          end_date: string
          id?: string
          label: string
          period_code: number
          start_date: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          created_at?: string
          end_date?: string
          id?: string
          label?: string
          period_code?: number
          start_date?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "academic_year_periods_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      academic_years: {
        Row: {
          created_at: string
          end_date: string
          id: string
          is_current: boolean
          label: string
          start_date: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date: string
          id?: string
          is_current?: boolean
          label: string
          start_date: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string
          id?: string
          is_current?: boolean
          label?: string
          start_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      admin_todos: {
        Row: {
          completed_at: string | null
          created_at: string
          due_date: string
          id: string
          notes: string | null
          sort_order: number
          title: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          sort_order?: number
          title: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          due_date?: string
          id?: string
          notes?: string | null
          sort_order?: number
          title?: string
        }
        Relationships: []
      }
      apo_chat_feedback: {
        Row: {
          assistant_message: string | null
          created_at: string
          escalated: boolean
          helpful: boolean
          id: string
          satisfaction: string | null
          user_message: string | null
          user_role: string | null
        }
        Insert: {
          assistant_message?: string | null
          created_at?: string
          escalated?: boolean
          helpful: boolean
          id?: string
          satisfaction?: string | null
          user_message?: string | null
          user_role?: string | null
        }
        Update: {
          assistant_message?: string | null
          created_at?: string
          escalated?: boolean
          helpful?: boolean
          id?: string
          satisfaction?: string | null
          user_message?: string | null
          user_role?: string | null
        }
        Relationships: []
      }
      app_user_roles: {
        Row: {
          app_user_id: string
          created_at: string
          role: string
          teacher_id: string | null
        }
        Insert: {
          app_user_id: string
          created_at?: string
          role: string
          teacher_id?: string | null
        }
        Update: {
          app_user_id?: string
          created_at?: string
          role?: string
          teacher_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "app_user_roles_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_user_roles_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      app_users: {
        Row: {
          auth_user_id: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          role: string
          student_id: string | null
          teacher_id: string | null
          updated_at: string
        }
        Insert: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Update: {
          auth_user_id?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          role?: string
          student_id?: string | null
          teacher_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "app_users_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "app_users_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_declaration_exceptions: {
        Row: {
          academic_year_id: string | null
          class_id: string
          created_at: string
          created_by: string | null
          id: string
          reason: string | null
          resolution_note: string | null
          resolved_by: string | null
          schedule_id: string
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          class_id: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          resolution_note?: string | null
          resolved_by?: string | null
          schedule_id: string
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          class_id?: string
          created_at?: string
          created_by?: string | null
          id?: string
          reason?: string | null
          resolution_note?: string | null
          resolved_by?: string | null
          schedule_id?: string
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_declaration_exceptions_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_declaration_exceptions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_declaration_exceptions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_declaration_exceptions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_declarations: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          manual_reason: string | null
          pool_id: string
          schedule_id: string
          source_event_id: string | null
          source_event_type: string | null
          status: string
          student_id: string
          superseded_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          manual_reason?: string | null
          pool_id: string
          schedule_id: string
          source_event_id?: string | null
          source_event_type?: string | null
          status?: string
          student_id: string
          superseded_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          manual_reason?: string | null
          pool_id?: string
          schedule_id?: string
          source_event_id?: string | null
          source_event_type?: string | null
          status?: string
          student_id?: string
          superseded_by?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_declarations_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "student_entitlement_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_declarations_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_declarations_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_declarations_superseded_by_fkey"
            columns: ["superseded_by"]
            isOneToOne: false
            referencedRelation: "attendance_declarations"
            referencedColumns: ["id"]
          },
        ]
      }
      attendance_details: {
        Row: {
          attendance_date: string
          class_id: string
          created_at: string
          id: string
          remarks: string | null
          schedule_id: string | null
          status: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          attendance_date: string
          class_id: string
          created_at?: string
          id?: string
          remarks?: string | null
          schedule_id?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          attendance_date?: string
          class_id?: string
          created_at?: string
          id?: string
          remarks?: string | null
          schedule_id?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "attendance_details_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_details_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "attendance_details_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_students: {
        Row: {
          created_at: string
          event_id: string
          student_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          student_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_students_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_students_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_tags: {
        Row: {
          created_at: string
          event_id: string
          tag: string
        }
        Insert: {
          created_at?: string
          event_id: string
          tag: string
        }
        Update: {
          created_at?: string
          event_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_tags_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_teachers: {
        Row: {
          created_at: string
          event_id: string
          teacher_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          teacher_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          teacher_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_teachers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_teachers_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_updates: {
        Row: {
          body: string
          created_at: string
          created_by_label: string | null
          event_id: string
          id: string
        }
        Insert: {
          body: string
          created_at?: string
          created_by_label?: string | null
          event_id: string
          id?: string
        }
        Update: {
          body?: string
          created_at?: string
          created_by_label?: string | null
          event_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_updates_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_event_users: {
        Row: {
          created_at: string
          event_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_event_users_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "calendar_events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "calendar_event_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      calendar_events: {
        Row: {
          all_day: boolean
          category: string
          created_at: string
          created_by: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          start_time: string | null
          status: string
          title: string
          updated_at: string
          visibility: string
        }
        Insert: {
          all_day?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          start_time?: string | null
          status?: string
          title: string
          updated_at?: string
          visibility?: string
        }
        Update: {
          all_day?: boolean
          category?: string
          created_at?: string
          created_by?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          start_time?: string | null
          status?: string
          title?: string
          updated_at?: string
          visibility?: string
        }
        Relationships: [
          {
            foreignKeyName: "calendar_events_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      class_restructure_audit_logs: {
        Row: {
          class_id: string | null
          created_at: string
          detail: string
          id: string
          issue_type: string
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          detail: string
          id?: string
          issue_type: string
        }
        Update: {
          class_id?: string | null
          created_at?: string
          detail?: string
          id?: string
          issue_type?: string
        }
        Relationships: []
      }
      classes: {
        Row: {
          academic_year_id: string | null
          academic_year_label: string | null
          capacity: number | null
          class_kind: string
          classroom_id: string | null
          course_code_full: string | null
          course_id: string | null
          created_at: string
          day_of_week: string | null
          end_date: string | null
          enrollment_notice: string | null
          grade: string[] | null
          id: string
          lesson_slots_per_session: number
          price_per_lesson: number | null
          section_code: string | null
          start_date: string | null
          status: string | null
          subject: string
          teacher_id: string | null
          time_slot: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id?: string | null
          academic_year_label?: string | null
          capacity?: number | null
          class_kind?: string
          classroom_id?: string | null
          course_code_full?: string | null
          course_id?: string | null
          created_at?: string
          day_of_week?: string | null
          end_date?: string | null
          enrollment_notice?: string | null
          grade?: string[] | null
          id?: string
          lesson_slots_per_session?: number
          price_per_lesson?: number | null
          section_code?: string | null
          start_date?: string | null
          status?: string | null
          subject: string
          teacher_id?: string | null
          time_slot?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string | null
          academic_year_label?: string | null
          capacity?: number | null
          class_kind?: string
          classroom_id?: string | null
          course_code_full?: string | null
          course_id?: string | null
          created_at?: string
          day_of_week?: string | null
          end_date?: string | null
          enrollment_notice?: string | null
          grade?: string[] | null
          id?: string
          lesson_slots_per_session?: number
          price_per_lesson?: number | null
          section_code?: string | null
          start_date?: string | null
          status?: string | null
          subject?: string
          teacher_id?: string | null
          time_slot?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classes_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      classroom_booking_requests: {
        Row: {
          classroom_id: string
          created_at: string
          created_schedule_id: string | null
          end_time: string
          id: string
          is_other: boolean
          reason: string | null
          requesting_teacher_id: string
          reviewed_at: string | null
          scheduled_date: string
          start_time: string
          status: string
          target_class_id: string | null
          updated_at: string
        }
        Insert: {
          classroom_id: string
          created_at?: string
          created_schedule_id?: string | null
          end_time: string
          id?: string
          is_other?: boolean
          reason?: string | null
          requesting_teacher_id: string
          reviewed_at?: string | null
          scheduled_date: string
          start_time: string
          status?: string
          target_class_id?: string | null
          updated_at?: string
        }
        Update: {
          classroom_id?: string
          created_at?: string
          created_schedule_id?: string | null
          end_time?: string
          id?: string
          is_other?: boolean
          reason?: string | null
          requesting_teacher_id?: string
          reviewed_at?: string | null
          scheduled_date?: string
          start_time?: string
          status?: string
          target_class_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "classroom_booking_requests_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_booking_requests_created_schedule_id_fkey"
            columns: ["created_schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_booking_requests_requesting_teacher_id_fkey"
            columns: ["requesting_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "classroom_booking_requests_target_class_id_fkey"
            columns: ["target_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classrooms: {
        Row: {
          capacity: number | null
          created_at: string
          id: string
          is_online: boolean
          name: string
          remarks: string | null
          updated_at: string
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_online?: boolean
          name: string
          remarks?: string | null
          updated_at?: string
        }
        Update: {
          capacity?: number | null
          created_at?: string
          id?: string
          is_online?: boolean
          name?: string
          remarks?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contact_update_tokens: {
        Row: {
          approved_at: string | null
          baseline: Json
          created_at: string
          expires_at: string
          id: string
          payload: Json
          status: string
          student_id: string
          submitted_at: string | null
          token: string
        }
        Insert: {
          approved_at?: string | null
          baseline?: Json
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json
          status?: string
          student_id: string
          submitted_at?: string | null
          token: string
        }
        Update: {
          approved_at?: string | null
          baseline?: Json
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json
          status?: string
          student_id?: string
          submitted_at?: string | null
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_update_tokens_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          course_code_base: string
          course_mode: string
          course_name: string | null
          course_seq: number
          created_at: string
          eligible_grade_codes: string[]
          grade_code: string
          id: string
          price_per_lesson: number | null
          price_per_lesson_both_periods: number | null
          price_per_lesson_period_2: number | null
          subject_id: string
          updated_at: string
        }
        Insert: {
          course_code_base: string
          course_mode?: string
          course_name?: string | null
          course_seq: number
          created_at?: string
          eligible_grade_codes?: string[]
          grade_code: string
          id?: string
          price_per_lesson?: number | null
          price_per_lesson_both_periods?: number | null
          price_per_lesson_period_2?: number | null
          subject_id: string
          updated_at?: string
        }
        Update: {
          course_code_base?: string
          course_mode?: string
          course_name?: string | null
          course_seq?: number
          created_at?: string
          eligible_grade_codes?: string[]
          grade_code?: string
          id?: string
          price_per_lesson?: number | null
          price_per_lesson_both_periods?: number | null
          price_per_lesson_period_2?: number | null
          subject_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "courses_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollment_change_events: {
        Row: {
          action: string
          class_id: string
          created_at: string
          effective_date: string
          enrollment_id: string | null
          enrollment_period: string | null
          id: string
          reason: string | null
          student_id: string
        }
        Insert: {
          action: string
          class_id: string
          created_at?: string
          effective_date: string
          enrollment_id?: string | null
          enrollment_period?: string | null
          id?: string
          reason?: string | null
          student_id: string
        }
        Update: {
          action?: string
          class_id?: string
          created_at?: string
          effective_date?: string
          enrollment_id?: string | null
          enrollment_period?: string | null
          id?: string
          reason?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollment_change_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "enrollment_change_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlement_consumption_events: {
        Row: {
          attendance_detail_id: string | null
          created_at: string
          created_by: string | null
          declaration_id: string | null
          delta_lessons: number
          id: string
          payment_detail_id: string | null
          pool_id: string
          reason: string
          schedule_id: string | null
          student_id: string
        }
        Insert: {
          attendance_detail_id?: string | null
          created_at?: string
          created_by?: string | null
          declaration_id?: string | null
          delta_lessons: number
          id?: string
          payment_detail_id?: string | null
          pool_id: string
          reason: string
          schedule_id?: string | null
          student_id: string
        }
        Update: {
          attendance_detail_id?: string | null
          created_at?: string
          created_by?: string | null
          declaration_id?: string | null
          delta_lessons?: number
          id?: string
          payment_detail_id?: string | null
          pool_id?: string
          reason?: string
          schedule_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_consumption_events_attendance_detail_id_fkey"
            columns: ["attendance_detail_id"]
            isOneToOne: false
            referencedRelation: "attendance_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_consumption_events_declaration_id_fkey"
            columns: ["declaration_id"]
            isOneToOne: false
            referencedRelation: "attendance_declarations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_consumption_events_payment_detail_id_fkey"
            columns: ["payment_detail_id"]
            isOneToOne: false
            referencedRelation: "payment_details"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_consumption_events_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "student_entitlement_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_consumption_events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_consumption_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      entitlement_pool_adjustments: {
        Row: {
          adjustment_batch_id: string
          after_remaining: number
          before_remaining: number
          class_id: string
          created_at: string
          created_by_email: string | null
          created_by_name: string | null
          delta_lessons: number
          id: string
          notes: string
          pool_id: string
          reason_code: string
          related_payment_id: string | null
          related_pool_id: string | null
          student_id: string
        }
        Insert: {
          adjustment_batch_id?: string
          after_remaining: number
          before_remaining: number
          class_id: string
          created_at?: string
          created_by_email?: string | null
          created_by_name?: string | null
          delta_lessons: number
          id?: string
          notes: string
          pool_id: string
          reason_code: string
          related_payment_id?: string | null
          related_pool_id?: string | null
          student_id: string
        }
        Update: {
          adjustment_batch_id?: string
          after_remaining?: number
          before_remaining?: number
          class_id?: string
          created_at?: string
          created_by_email?: string | null
          created_by_name?: string | null
          delta_lessons?: number
          id?: string
          notes?: string
          pool_id?: string
          reason_code?: string
          related_payment_id?: string | null
          related_pool_id?: string | null
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "entitlement_pool_adjustments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_pool_adjustments_pool_id_fkey"
            columns: ["pool_id"]
            isOneToOne: false
            referencedRelation: "student_entitlement_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_pool_adjustments_related_payment_id_fkey"
            columns: ["related_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_pool_adjustments_related_pool_id_fkey"
            columns: ["related_pool_id"]
            isOneToOne: false
            referencedRelation: "student_entitlement_pools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entitlement_pool_adjustments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_category_rules: {
        Row: {
          active: boolean
          created_at: string
          force_pending: boolean
          hint: string | null
          id: string
          ledger_account_id: string | null
          pattern: string
          priority: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          force_pending?: boolean
          hint?: string | null
          id?: string
          ledger_account_id?: string | null
          pattern: string
          priority?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          force_pending?: boolean
          hint?: string | null
          id?: string
          ledger_account_id?: string | null
          pattern?: string
          priority?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "expense_category_rules_ledger_account_id_fkey"
            columns: ["ledger_account_id"]
            isOneToOne: false
            referencedRelation: "expense_ledger_accounts"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_entries: {
        Row: {
          amount_hkd: number
          attachment_name: string | null
          attachment_path: string | null
          class_id: string | null
          created_at: string
          created_by_label: string | null
          id: string
          ledger_account_id: string | null
          ledger_status: string
          notes: string | null
          origin: string
          origin_key: string | null
          owner_label: string | null
          pay_method: string
          spent_on: string
          subject_code: string | null
          suggested_account_id: string | null
          suggestion_hint: string | null
          teacher_id: string | null
          title: string
          updated_at: string
          void_reason: string | null
          voided_at: string | null
          voided_by_label: string | null
        }
        Insert: {
          amount_hkd: number
          attachment_name?: string | null
          attachment_path?: string | null
          class_id?: string | null
          created_at?: string
          created_by_label?: string | null
          id?: string
          ledger_account_id?: string | null
          ledger_status?: string
          notes?: string | null
          origin?: string
          origin_key?: string | null
          owner_label?: string | null
          pay_method: string
          spent_on: string
          subject_code?: string | null
          suggested_account_id?: string | null
          suggestion_hint?: string | null
          teacher_id?: string | null
          title: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by_label?: string | null
        }
        Update: {
          amount_hkd?: number
          attachment_name?: string | null
          attachment_path?: string | null
          class_id?: string | null
          created_at?: string
          created_by_label?: string | null
          id?: string
          ledger_account_id?: string | null
          ledger_status?: string
          notes?: string | null
          origin?: string
          origin_key?: string | null
          owner_label?: string | null
          pay_method?: string
          spent_on?: string
          subject_code?: string | null
          suggested_account_id?: string | null
          suggestion_hint?: string | null
          teacher_id?: string | null
          title?: string
          updated_at?: string
          void_reason?: string | null
          voided_at?: string | null
          voided_by_label?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "expense_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_ledger_account_id_fkey"
            columns: ["ledger_account_id"]
            isOneToOne: false
            referencedRelation: "expense_ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_suggested_account_id_fkey"
            columns: ["suggested_account_id"]
            isOneToOne: false
            referencedRelation: "expense_ledger_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "expense_entries_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      expense_ledger_accounts: {
        Row: {
          account_group: string
          active: boolean
          code: string
          created_at: string
          id: string
          label: string
          sort_order: number
          subject: string | null
          updated_at: string
          visibility: string
        }
        Insert: {
          account_group: string
          active?: boolean
          code: string
          created_at?: string
          id?: string
          label: string
          sort_order?: number
          subject?: string | null
          updated_at?: string
          visibility?: string
        }
        Update: {
          account_group?: string
          active?: boolean
          code?: string
          created_at?: string
          id?: string
          label?: string
          sort_order?: number
          subject?: string | null
          updated_at?: string
          visibility?: string
        }
        Relationships: []
      }
      front_desk_intake_sessions: {
        Row: {
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          payload: Json
          status: string
          submitted_at: string | null
          token: string
        }
        Insert: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json
          status?: string
          submitted_at?: string | null
          token: string
        }
        Update: {
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          payload?: Json
          status?: string
          submitted_at?: string | null
          token?: string
        }
        Relationships: []
      }
      homework_tutoring_availability: {
        Row: {
          created_at: string
          entries: Json
          id: string
          status: string
          submitted_at: string | null
          target_month: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          entries?: Json
          id?: string
          status?: string
          submitted_at?: string | null
          target_month: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          entries?: Json
          id?: string
          status?: string
          submitted_at?: string | null
          target_month?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_tutoring_availability_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_tutoring_calendar_closures: {
        Row: {
          academic_year_id: string
          closure_date: string
          created_at: string
          id: string
          name: string
          notes: string | null
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          closure_date: string
          created_at?: string
          id?: string
          name: string
          notes?: string | null
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          closure_date?: string
          created_at?: string
          id?: string
          name?: string
          notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_tutoring_calendar_closures_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_tutoring_duty_days: {
        Row: {
          created_at: string
          duty_date: string
          holiday_label: string | null
          id: string
          primary_room: string | null
          primary_teacher_id: string | null
          roster_month_id: string
          secondary_room: string | null
          secondary_teacher_id: string | null
          session_end: string
          session_start: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duty_date: string
          holiday_label?: string | null
          id?: string
          primary_room?: string | null
          primary_teacher_id?: string | null
          roster_month_id: string
          secondary_room?: string | null
          secondary_teacher_id?: string | null
          session_end?: string
          session_start?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duty_date?: string
          holiday_label?: string | null
          id?: string
          primary_room?: string | null
          primary_teacher_id?: string | null
          roster_month_id?: string
          secondary_room?: string | null
          secondary_teacher_id?: string | null
          session_end?: string
          session_start?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_tutoring_duty_days_primary_teacher_id_fkey"
            columns: ["primary_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutoring_duty_days_roster_month_id_fkey"
            columns: ["roster_month_id"]
            isOneToOne: false
            referencedRelation: "homework_tutoring_roster_months"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutoring_duty_days_secondary_teacher_id_fkey"
            columns: ["secondary_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_tutoring_monthly_charges: {
        Row: {
          academic_year_id: string
          amount_hkd: number
          billing_month: string
          class_id: string
          created_at: string
          day_plan: string
          enrollment_id: string
          grade_label: string
          id: string
          is_quarter_rate: boolean
          notes: string | null
          payment_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          amount_hkd: number
          billing_month: string
          class_id: string
          created_at?: string
          day_plan: string
          enrollment_id: string
          grade_label: string
          id?: string
          is_quarter_rate?: boolean
          notes?: string | null
          payment_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          amount_hkd?: number
          billing_month?: string
          class_id?: string
          created_at?: string
          day_plan?: string
          enrollment_id?: string
          grade_label?: string
          id?: string
          is_quarter_rate?: boolean
          notes?: string | null
          payment_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_tutoring_monthly_charges_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutoring_monthly_charges_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutoring_monthly_charges_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_class_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutoring_monthly_charges_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutoring_monthly_charges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      homework_tutoring_roster_months: {
        Row: {
          academic_year_id: string
          class_id: string
          created_at: string
          id: string
          published_at: string | null
          roster_month: string
          status: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          class_id: string
          created_at?: string
          id?: string
          published_at?: string | null
          roster_month: string
          status?: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          class_id?: string
          created_at?: string
          id?: string
          published_at?: string | null
          roster_month?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "homework_tutoring_roster_months_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "homework_tutoring_roster_months_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_events: {
        Row: {
          action_path: string | null
          audience_roles: string[]
          audience_teacher_ids: string[]
          body: string | null
          category: string
          class_id: string | null
          created_at: string
          event_type: string
          id: string
          payload: Json
          schedule_id: string | null
          student_id: string | null
          title: string
        }
        Insert: {
          action_path?: string | null
          audience_roles?: string[]
          audience_teacher_ids?: string[]
          body?: string | null
          category?: string
          class_id?: string | null
          created_at?: string
          event_type: string
          id?: string
          payload?: Json
          schedule_id?: string | null
          student_id?: string | null
          title: string
        }
        Update: {
          action_path?: string | null
          audience_roles?: string[]
          audience_teacher_ids?: string[]
          body?: string | null
          category?: string
          class_id?: string | null
          created_at?: string
          event_type?: string
          id?: string
          payload?: Json
          schedule_id?: string | null
          student_id?: string | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_events_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_events_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inbox_events_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      inbox_reads: {
        Row: {
          actor_key: string
          event_id: string | null
          id: string
          read_at: string
          source_key: string
        }
        Insert: {
          actor_key: string
          event_id?: string | null
          id?: string
          read_at?: string
          source_key: string
        }
        Update: {
          actor_key?: string
          event_id?: string | null
          id?: string
          read_at?: string
          source_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "inbox_reads_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "inbox_events"
            referencedColumns: ["id"]
          },
        ]
      }
      leave_makeup_records: {
        Row: {
          class_id: string
          created_at: string
          id: string
          leave_date: string
          leave_reason: string | null
          makeup_date: string | null
          makeup_schedule_id: string | null
          makeup_type: string | null
          remarks: string | null
          schedule_id: string | null
          status: string | null
          student_id: string
          tuition_disposition: string | null
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          id?: string
          leave_date: string
          leave_reason?: string | null
          makeup_date?: string | null
          makeup_schedule_id?: string | null
          makeup_type?: string | null
          remarks?: string | null
          schedule_id?: string | null
          status?: string | null
          student_id: string
          tuition_disposition?: string | null
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          id?: string
          leave_date?: string
          leave_reason?: string | null
          makeup_date?: string | null
          makeup_schedule_id?: string | null
          makeup_type?: string | null
          remarks?: string | null
          schedule_id?: string | null
          status?: string | null
          student_id?: string
          tuition_disposition?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "leave_makeup_records_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_makeup_records_makeup_schedule_id_fkey"
            columns: ["makeup_schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_makeup_records_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "leave_makeup_records_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      legacy_import_batches: {
        Row: {
          created_at: string
          duplicate_count: number
          id: string
          imported_rows: number
          period_end: string
          period_start: string
          source_filename: string
          source_system: string
          total_source_rows: number
          unmatched_count: number
        }
        Insert: {
          created_at?: string
          duplicate_count?: number
          id?: string
          imported_rows?: number
          period_end: string
          period_start: string
          source_filename: string
          source_system?: string
          total_source_rows?: number
          unmatched_count?: number
        }
        Update: {
          created_at?: string
          duplicate_count?: number
          id?: string
          imported_rows?: number
          period_end?: string
          period_start?: string
          source_filename?: string
          source_system?: string
          total_source_rows?: number
          unmatched_count?: number
        }
        Relationships: []
      }
      legacy_student_subject_enrollments: {
        Row: {
          id: string
          import_batch_id: string
          imported_at: string
          period_end: string
          period_start: string
          source_student_name: string
          source_student_ref: string | null
          source_subject_label: string
          source_system: string
          student_id: string
          subject_id: string
        }
        Insert: {
          id?: string
          import_batch_id: string
          imported_at?: string
          period_end: string
          period_start: string
          source_student_name: string
          source_student_ref?: string | null
          source_subject_label: string
          source_system?: string
          student_id: string
          subject_id: string
        }
        Update: {
          id?: string
          import_batch_id?: string
          imported_at?: string
          period_end?: string
          period_start?: string
          source_student_name?: string
          source_student_ref?: string | null
          source_subject_label?: string
          source_system?: string
          student_id?: string
          subject_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legacy_student_subject_enrollments_import_batch_id_fkey"
            columns: ["import_batch_id"]
            isOneToOne: false
            referencedRelation: "legacy_import_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_student_subject_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "legacy_student_subject_enrollments_subject_id_fkey"
            columns: ["subject_id"]
            isOneToOne: false
            referencedRelation: "subjects"
            referencedColumns: ["id"]
          },
        ]
      }
      lesson_reminder_logs: {
        Row: {
          channel: string
          detail: string | null
          id: string
          reminded_at: string
          reminded_by: string | null
          reminder_date: string
          student_id: string
        }
        Insert: {
          channel?: string
          detail?: string | null
          id?: string
          reminded_at?: string
          reminded_by?: string | null
          reminder_date: string
          student_id: string
        }
        Update: {
          channel?: string
          detail?: string | null
          id?: string
          reminded_at?: string
          reminded_by?: string | null
          reminder_date?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_reminder_logs_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      mgmt_active_roles: {
        Row: {
          active_role: string
          app_user_id: string
          switched_at: string
        }
        Insert: {
          active_role: string
          app_user_id: string
          switched_at?: string
        }
        Update: {
          active_role?: string
          app_user_id?: string
          switched_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "mgmt_active_roles_app_user_id_fkey"
            columns: ["app_user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      mgmt_audit_log: {
        Row: {
          action: string
          actor_label: string
          created_at: string
          detail: string | null
          id: string
          path: string | null
          role: string
        }
        Insert: {
          action: string
          actor_label: string
          created_at?: string
          detail?: string | null
          id?: string
          path?: string | null
          role: string
        }
        Update: {
          action?: string
          actor_label?: string
          created_at?: string
          detail?: string | null
          id?: string
          path?: string | null
          role?: string
        }
        Relationships: []
      }
      mgmt_system_errors: {
        Row: {
          actor_label: string | null
          created_at: string
          detail: string | null
          id: string
          message: string
          path: string | null
          resolved_at: string | null
          role: string | null
          severity: string
          source: string
        }
        Insert: {
          actor_label?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          message: string
          path?: string | null
          resolved_at?: string | null
          role?: string | null
          severity?: string
          source: string
        }
        Update: {
          actor_label?: string | null
          created_at?: string
          detail?: string | null
          id?: string
          message?: string
          path?: string | null
          resolved_at?: string | null
          role?: string | null
          severity?: string
          source?: string
        }
        Relationships: []
      }
      monthly_tuition_charges: {
        Row: {
          billing_month: string
          calendar_lesson_count: number
          chargeable_lesson_count: number
          class_id: string
          created_at: string
          credit_applied: number
          enrollment_id: string | null
          gross_amount: number
          id: string
          leave_deduction_count: number
          net_amount: number
          notes: string | null
          status: string
          student_id: string
          unit_price: number
          updated_at: string
        }
        Insert: {
          billing_month: string
          calendar_lesson_count?: number
          chargeable_lesson_count?: number
          class_id: string
          created_at?: string
          credit_applied?: number
          enrollment_id?: string | null
          gross_amount?: number
          id?: string
          leave_deduction_count?: number
          net_amount?: number
          notes?: string | null
          status?: string
          student_id: string
          unit_price?: number
          updated_at?: string
        }
        Update: {
          billing_month?: string
          calendar_lesson_count?: number
          chargeable_lesson_count?: number
          class_id?: string
          created_at?: string
          credit_applied?: number
          enrollment_id?: string | null
          gross_amount?: number
          id?: string
          leave_deduction_count?: number
          net_amount?: number
          notes?: string | null
          status?: string
          student_id?: string
          unit_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "monthly_tuition_charges_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_tuition_charges_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_class_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "monthly_tuition_charges_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_batches: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          payment_date: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_date: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          payment_date?: string
        }
        Relationships: []
      }
      payment_details: {
        Row: {
          amount: number | null
          class_id: string | null
          created_at: string
          description: string | null
          id: string
          lesson_count: number | null
          monthly_tuition_charge_id: string | null
          payment_id: string
          updated_at: string
        }
        Insert: {
          amount?: number | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_count?: number | null
          monthly_tuition_charge_id?: string | null
          payment_id: string
          updated_at?: string
        }
        Update: {
          amount?: number | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          id?: string
          lesson_count?: number | null
          monthly_tuition_charge_id?: string | null
          payment_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_details_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_details_monthly_tuition_charge_id_fkey"
            columns: ["monthly_tuition_charge_id"]
            isOneToOne: false
            referencedRelation: "monthly_tuition_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_details_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_discount_applications: {
        Row: {
          amount_deducted: number | null
          created_at: string
          id: string
          payment_discount_id: string | null
          payment_id: string
          sort_order: number
        }
        Insert: {
          amount_deducted?: number | null
          created_at?: string
          id?: string
          payment_discount_id?: string | null
          payment_id: string
          sort_order?: number
        }
        Update: {
          amount_deducted?: number | null
          created_at?: string
          id?: string
          payment_discount_id?: string | null
          payment_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_discount_applications_payment_discount_id_fkey"
            columns: ["payment_discount_id"]
            isOneToOne: false
            referencedRelation: "payment_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_discount_applications_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_discounts: {
        Row: {
          academic_year: string | null
          amount_off: number | null
          created_at: string
          description: string | null
          discount_kind: string
          eligibility_rules: Json | null
          group_enrollment_rules: Json | null
          id: string
          is_active: boolean
          is_label_only: boolean
          lesson_tiers: Json | null
          max_stack_count: number | null
          name: string
          percent_off: number | null
          sort_order: number
          stack_group: string | null
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          academic_year?: string | null
          amount_off?: number | null
          created_at?: string
          description?: string | null
          discount_kind?: string
          eligibility_rules?: Json | null
          group_enrollment_rules?: Json | null
          id?: string
          is_active?: boolean
          is_label_only?: boolean
          lesson_tiers?: Json | null
          max_stack_count?: number | null
          name: string
          percent_off?: number | null
          sort_order?: number
          stack_group?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          academic_year?: string | null
          amount_off?: number | null
          created_at?: string
          description?: string | null
          discount_kind?: string
          eligibility_rules?: Json | null
          group_enrollment_rules?: Json | null
          id?: string
          is_active?: boolean
          is_label_only?: boolean
          lesson_tiers?: Json | null
          max_stack_count?: number | null
          name?: string
          percent_off?: number | null
          sort_order?: number
          stack_group?: string | null
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: []
      }
      payment_late_fee_items: {
        Row: {
          amount: number
          billing_month: string
          class_id: string
          created_at: string
          id: string
          payment_id: string
          waived: boolean
          waiver_reason: string | null
        }
        Insert: {
          amount?: number
          billing_month: string
          class_id: string
          created_at?: string
          id?: string
          payment_id: string
          waived?: boolean
          waiver_reason?: string | null
        }
        Update: {
          amount?: number
          billing_month?: string
          class_id?: string
          created_at?: string
          id?: string
          payment_id?: string
          waived?: boolean
          waiver_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payment_late_fee_items_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payment_late_fee_items_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          created_at: string
          id: string
          payment_batch_id: string | null
          payment_date: string
          payment_discount_id: string | null
          payment_method: string | null
          receipt_number: string | null
          remarks: string | null
          status: string | null
          student_id: string
          subtotal_amount: number | null
          total_amount: number
          updated_at: string
          void_reason: string | null
          void_second_confirmer_email: string | null
          void_second_confirmer_name: string | null
          voided_at: string | null
          voided_by_email: string | null
          voided_by_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          payment_batch_id?: string | null
          payment_date: string
          payment_discount_id?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          remarks?: string | null
          status?: string | null
          student_id: string
          subtotal_amount?: number | null
          total_amount: number
          updated_at?: string
          void_reason?: string | null
          void_second_confirmer_email?: string | null
          void_second_confirmer_name?: string | null
          voided_at?: string | null
          voided_by_email?: string | null
          voided_by_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          payment_batch_id?: string | null
          payment_date?: string
          payment_discount_id?: string | null
          payment_method?: string | null
          receipt_number?: string | null
          remarks?: string | null
          status?: string | null
          student_id?: string
          subtotal_amount?: number | null
          total_amount?: number
          updated_at?: string
          void_reason?: string | null
          void_second_confirmer_email?: string | null
          void_second_confirmer_name?: string | null
          voided_at?: string | null
          voided_by_email?: string | null
          voided_by_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_payment_batch_id_fkey"
            columns: ["payment_batch_id"]
            isOneToOne: false
            referencedRelation: "payment_batches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_payment_discount_id_fkey"
            columns: ["payment_discount_id"]
            isOneToOne: false
            referencedRelation: "payment_discounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_adjustments: {
        Row: {
          created_at: string
          created_by: string
          from_amount: number
          id: string
          reason: string
          reviewed_at: string | null
          reviewed_by: string | null
          run_id: string
          status: string
          teacher_id: string
          to_amount: number
        }
        Insert: {
          created_at?: string
          created_by: string
          from_amount: number
          id?: string
          reason: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          run_id: string
          status?: string
          teacher_id: string
          to_amount: number
        }
        Update: {
          created_at?: string
          created_by?: string
          from_amount?: number
          id?: string
          reason?: string
          reviewed_at?: string | null
          reviewed_by?: string | null
          run_id?: string
          status?: string
          teacher_id?: string
          to_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "payroll_adjustments_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_adjustments_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_manual_hours: {
        Row: {
          created_at: string
          hours: number
          id: string
          month_key: string
          note: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          hours?: number
          id?: string
          month_key: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          hours?: number
          id?: string
          month_key?: string
          note?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_manual_hours_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_rates: {
        Row: {
          config: Json
          created_at: string
          effective_from: string
          effective_to: string | null
          id: string
          mode: string
          notes: string | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          effective_from: string
          effective_to?: string | null
          id?: string
          mode: string
          notes?: string | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          effective_from?: string
          effective_to?: string | null
          id?: string
          mode?: string
          notes?: string | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_rates_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      payroll_runs: {
        Row: {
          calc_at: string | null
          calc_version: number
          created_at: string
          id: string
          month_key: string
          return_reason: string | null
          settled_at: string | null
          settled_by: string | null
          snapshot: Json | null
          status: string
          submitted_at: string | null
          submitted_by: string | null
          updated_at: string
        }
        Insert: {
          calc_at?: string | null
          calc_version?: number
          created_at?: string
          id?: string
          month_key: string
          return_reason?: string | null
          settled_at?: string | null
          settled_by?: string | null
          snapshot?: Json | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Update: {
          calc_at?: string | null
          calc_version?: number
          created_at?: string
          id?: string
          month_key?: string
          return_reason?: string | null
          settled_at?: string | null
          settled_by?: string | null
          snapshot?: Json | null
          status?: string
          submitted_at?: string | null
          submitted_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      payroll_teacher_states: {
        Row: {
          exclude_reason: string | null
          excluded: boolean
          finance_reviewed: boolean
          id: string
          manager_spot_checked: boolean
          roll_call_waiting: boolean
          run_id: string
          submit_note: string | null
          submit_status: string
          teacher_id: string
          updated_at: string
        }
        Insert: {
          exclude_reason?: string | null
          excluded?: boolean
          finance_reviewed?: boolean
          id?: string
          manager_spot_checked?: boolean
          roll_call_waiting?: boolean
          run_id: string
          submit_note?: string | null
          submit_status?: string
          teacher_id: string
          updated_at?: string
        }
        Update: {
          exclude_reason?: string | null
          excluded?: boolean
          finance_reviewed?: boolean
          id?: string
          manager_spot_checked?: boolean
          roll_call_waiting?: boolean
          run_id?: string
          submit_note?: string | null
          submit_status?: string
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payroll_teacher_states_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "payroll_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payroll_teacher_states_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_enrollment_request_lines: {
        Row: {
          class_id: string
          class_label: string | null
          created_at: string
          enrollment_period: string | null
          id: string
          lesson_count: number
          line_subtotal: number
          request_id: string
          schedule_ids: string[]
          unit_price: number | null
        }
        Insert: {
          class_id: string
          class_label?: string | null
          created_at?: string
          enrollment_period?: string | null
          id?: string
          lesson_count?: number
          line_subtotal?: number
          request_id: string
          schedule_ids?: string[]
          unit_price?: number | null
        }
        Update: {
          class_id?: string
          class_label?: string | null
          created_at?: string
          enrollment_period?: string | null
          id?: string
          lesson_count?: number
          line_subtotal?: number
          request_id?: string
          schedule_ids?: string[]
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "portal_enrollment_request_lines_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_enrollment_request_lines_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "portal_enrollment_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_enrollment_requests: {
        Row: {
          created_at: string
          estimate_breakdown: Json
          estimated_subtotal: number
          estimated_total: number
          id: string
          parent_note: string | null
          payment_id: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          staff_note: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          estimate_breakdown?: Json
          estimated_subtotal?: number
          estimated_total?: number
          id?: string
          parent_note?: string | null
          payment_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_note?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          estimate_breakdown?: Json
          estimated_subtotal?: number
          estimated_total?: number
          id?: string
          parent_note?: string | null
          payment_id?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          staff_note?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_enrollment_requests_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_enrollment_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_enrollment_requests_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      portal_staff_view_as: {
        Row: {
          staff_app_user_id: string
          started_at: string
          student_id: string
        }
        Insert: {
          staff_app_user_id: string
          started_at?: string
          student_id: string
        }
        Update: {
          staff_app_user_id?: string
          started_at?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "portal_staff_view_as_staff_app_user_id_fkey"
            columns: ["staff_app_user_id"]
            isOneToOne: true
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "portal_staff_view_as_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_records: {
        Row: {
          created_at: string
          id: string
          payment_id: string
          rebate_paid_at: string | null
          rebate_status: string
          referee_discount_amount: number
          referee_student_id: string
          referrer_rebate_amount: number
          referrer_student_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          payment_id: string
          rebate_paid_at?: string | null
          rebate_status?: string
          referee_discount_amount?: number
          referee_student_id: string
          referrer_rebate_amount?: number
          referrer_student_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          payment_id?: string
          rebate_paid_at?: string | null
          rebate_status?: string
          referee_discount_amount?: number
          referee_student_id?: string
          referrer_rebate_amount?: number
          referrer_student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_records_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_records_referee_student_id_fkey"
            columns: ["referee_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_records_referrer_student_id_fkey"
            columns: ["referrer_student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      schedules: {
        Row: {
          cancel_reason: string | null
          class_id: string | null
          classroom_id: string | null
          consecutive_group_id: string | null
          consecutive_slot_index: number | null
          created_at: string
          end_time: string | null
          id: string
          is_extra_lesson: boolean
          original_teacher_id: string | null
          remarks: string | null
          scheduled_date: string
          session_number: number | null
          start_time: string | null
          status: string | null
          teacher_id: string | null
          teaching_notes: string | null
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          class_id?: string | null
          classroom_id?: string | null
          consecutive_group_id?: string | null
          consecutive_slot_index?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_extra_lesson?: boolean
          original_teacher_id?: string | null
          remarks?: string | null
          scheduled_date: string
          session_number?: number | null
          start_time?: string | null
          status?: string | null
          teacher_id?: string | null
          teaching_notes?: string | null
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          class_id?: string | null
          classroom_id?: string | null
          consecutive_group_id?: string | null
          consecutive_slot_index?: number | null
          created_at?: string
          end_time?: string | null
          id?: string
          is_extra_lesson?: boolean
          original_teacher_id?: string | null
          remarks?: string | null
          scheduled_date?: string
          session_number?: number | null
          start_time?: string | null
          status?: string | null
          teacher_id?: string | null
          teaching_notes?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "schedules_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_classroom_id_fkey"
            columns: ["classroom_id"]
            isOneToOne: false
            referencedRelation: "classrooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_original_teacher_id_fkey"
            columns: ["original_teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "schedules_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      script_library_entries: {
        Row: {
          answer: string
          created_at: string
          created_by_label: string | null
          id: string
          question: string
          sort_order: number
          tags: string[]
          updated_at: string
        }
        Insert: {
          answer: string
          created_at?: string
          created_by_label?: string | null
          id?: string
          question: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Update: {
          answer?: string
          created_at?: string
          created_by_label?: string | null
          id?: string
          question?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
        }
        Relationships: []
      }
      student_class_enrollments: {
        Row: {
          class_id: string
          created_at: string
          enroll_date: string | null
          enrollment_period: string | null
          homework_day_plan: string | null
          homework_weekdays: string[] | null
          id: string
          remarks: string | null
          status: string | null
          student_id: string
          updated_at: string
          withdraw_effective_date: string | null
          withdraw_reason: string | null
        }
        Insert: {
          class_id: string
          created_at?: string
          enroll_date?: string | null
          enrollment_period?: string | null
          homework_day_plan?: string | null
          homework_weekdays?: string[] | null
          id?: string
          remarks?: string | null
          status?: string | null
          student_id: string
          updated_at?: string
          withdraw_effective_date?: string | null
          withdraw_reason?: string | null
        }
        Update: {
          class_id?: string
          created_at?: string
          enroll_date?: string | null
          enrollment_period?: string | null
          homework_day_plan?: string | null
          homework_weekdays?: string[] | null
          id?: string
          remarks?: string | null
          status?: string | null
          student_id?: string
          updated_at?: string
          withdraw_effective_date?: string | null
          withdraw_reason?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_code_counters: {
        Row: {
          last_seq: number
          updated_at: string
          year: number
        }
        Insert: {
          last_seq: number
          updated_at?: string
          year: number
        }
        Update: {
          last_seq?: number
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      student_enrollment_sessions: {
        Row: {
          created_at: string
          enrollment_id: string
          id: string
          schedule_id: string
        }
        Insert: {
          created_at?: string
          enrollment_id: string
          id?: string
          schedule_id: string
        }
        Update: {
          created_at?: string
          enrollment_id?: string
          id?: string
          schedule_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_enrollment_sessions_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_class_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_enrollment_sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
        ]
      }
      student_entitlement_pools: {
        Row: {
          academic_year_id: string
          class_id: string | null
          course_group: string
          created_at: string
          id: string
          initial_lessons: number
          namespace_key: string
          package_type: string
          remaining_lessons: number
          source_enrollment_id: string | null
          student_id: string
          updated_at: string
          valid_from: string | null
          valid_to: string | null
        }
        Insert: {
          academic_year_id: string
          class_id?: string | null
          course_group: string
          created_at?: string
          id?: string
          initial_lessons?: number
          namespace_key: string
          package_type: string
          remaining_lessons?: number
          source_enrollment_id?: string | null
          student_id: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Update: {
          academic_year_id?: string
          class_id?: string | null
          course_group?: string
          created_at?: string
          id?: string
          initial_lessons?: number
          namespace_key?: string
          package_type?: string
          remaining_lessons?: number
          source_enrollment_id?: string | null
          student_id?: string
          updated_at?: string
          valid_from?: string | null
          valid_to?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_entitlement_pools_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_entitlement_pools_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_entitlement_pools_source_enrollment_id_fkey"
            columns: ["source_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_class_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_entitlement_pools_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_pending_lessons: {
        Row: {
          class_id: string
          created_at: string
          enrollment_id: string | null
          id: string
          owed_count: number
          reason: string
          remarks: string | null
          resolved_schedule_id: string | null
          status: string
          student_id: string
          updated_at: string
        }
        Insert: {
          class_id: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          owed_count?: number
          reason?: string
          remarks?: string | null
          resolved_schedule_id?: string | null
          status?: string
          student_id: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          created_at?: string
          enrollment_id?: string | null
          id?: string
          owed_count?: number
          reason?: string
          remarks?: string | null
          resolved_schedule_id?: string | null
          status?: string
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_pending_lessons_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pending_lessons_enrollment_id_fkey"
            columns: ["enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_class_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pending_lessons_resolved_schedule_id_fkey"
            columns: ["resolved_schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_pending_lessons_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_portal_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string
          id: string
          student_id: string
          token: string
          used_at: string | null
          used_by_email: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          student_id: string
          token: string
          used_at?: string | null
          used_by_email?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string
          id?: string
          student_id?: string
          token?: string
          used_at?: string | null
          used_by_email?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_portal_invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_portal_invites_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_relationships: {
        Row: {
          created_at: string
          id: string
          relationship: string
          student_a_id: string
          student_b_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          relationship: string
          student_a_id: string
          student_b_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          relationship?: string
          student_a_id?: string
          student_b_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_relationships_student_a_id_fkey"
            columns: ["student_a_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_relationships_student_b_id_fkey"
            columns: ["student_b_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      student_status_history: {
        Row: {
          changed_date: string | null
          created_at: string
          id: string
          new_status: string
          old_status: string | null
          reason: string | null
          student_id: string
          updated_at: string
        }
        Insert: {
          changed_date?: string | null
          created_at?: string
          id?: string
          new_status: string
          old_status?: string | null
          reason?: string | null
          student_id: string
          updated_at?: string
        }
        Update: {
          changed_date?: string | null
          created_at?: string
          id?: string
          new_status?: string
          old_status?: string | null
          reason?: string | null
          student_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_status_history_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          academic_stage: string
          activity_status: string
          address: string | null
          assigned_agent_user_id: string | null
          created_at: string
          date_of_birth: string | null
          english_name: string | null
          enrollment_status: string
          full_name: string
          gender: string | null
          grade: string | null
          id: string
          old_student_id: string | null
          parent_name: string | null
          parent_phone: string | null
          parent_phone_country_code: string | null
          parent_preferred_contact_method: string | null
          parent_relationship: string | null
          parent_wechat_id: string | null
          preferred_contact_method: string | null
          primary_contact_person: string | null
          registration_status: string
          remarks: string | null
          school: string | null
          status: string | null
          student_code: string | null
          student_phone: string | null
          student_phone_country_code: string | null
          student_preferred_contact_method: string | null
          student_wechat_id: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          academic_stage?: string
          activity_status?: string
          address?: string | null
          assigned_agent_user_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          english_name?: string | null
          enrollment_status?: string
          full_name: string
          gender?: string | null
          grade?: string | null
          id?: string
          old_student_id?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_phone_country_code?: string | null
          parent_preferred_contact_method?: string | null
          parent_relationship?: string | null
          parent_wechat_id?: string | null
          preferred_contact_method?: string | null
          primary_contact_person?: string | null
          registration_status?: string
          remarks?: string | null
          school?: string | null
          status?: string | null
          student_code?: string | null
          student_phone?: string | null
          student_phone_country_code?: string | null
          student_preferred_contact_method?: string | null
          student_wechat_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          academic_stage?: string
          activity_status?: string
          address?: string | null
          assigned_agent_user_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          english_name?: string | null
          enrollment_status?: string
          full_name?: string
          gender?: string | null
          grade?: string | null
          id?: string
          old_student_id?: string | null
          parent_name?: string | null
          parent_phone?: string | null
          parent_phone_country_code?: string | null
          parent_preferred_contact_method?: string | null
          parent_relationship?: string | null
          parent_wechat_id?: string | null
          preferred_contact_method?: string | null
          primary_contact_person?: string | null
          registration_status?: string
          remarks?: string | null
          school?: string | null
          status?: string | null
          student_code?: string | null
          student_phone?: string | null
          student_phone_country_code?: string | null
          student_preferred_contact_method?: string | null
          student_wechat_id?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "students_assigned_agent_user_id_fkey"
            columns: ["assigned_agent_user_id"]
            isOneToOne: false
            referencedRelation: "app_users"
            referencedColumns: ["id"]
          },
        ]
      }
      subjects: {
        Row: {
          category: string | null
          code: string
          created_at: string
          id: string
          is_active: boolean
          name_zh: string
          short_name: string | null
          updated_at: string
        }
        Insert: {
          category?: string | null
          code: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_zh: string
          short_name?: string | null
          updated_at?: string
        }
        Update: {
          category?: string | null
          code?: string
          created_at?: string
          id?: string
          is_active?: boolean
          name_zh?: string
          short_name?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      teacher_availability_slots: {
        Row: {
          academic_year_id: string
          assigned_class_id: string | null
          available_date: string
          created_at: string
          id: string
          notes: string | null
          status: string
          teacher_id: string
          time_slot: string
          updated_at: string
        }
        Insert: {
          academic_year_id: string
          assigned_class_id?: string | null
          available_date: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          teacher_id: string
          time_slot: string
          updated_at?: string
        }
        Update: {
          academic_year_id?: string
          assigned_class_id?: string | null
          available_date?: string
          created_at?: string
          id?: string
          notes?: string | null
          status?: string
          teacher_id?: string
          time_slot?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teacher_availability_slots_academic_year_id_fkey"
            columns: ["academic_year_id"]
            isOneToOne: false
            referencedRelation: "academic_years"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_slots_assigned_class_id_fkey"
            columns: ["assigned_class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "teacher_availability_slots_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: false
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      teachers: {
        Row: {
          abbr: string | null
          created_at: string
          english_name: string | null
          full_name: string
          homework_tutor_only: boolean
          homework_tutoring_nav: boolean
          id: string
          status: string | null
          subject_speciality: string[] | null
          updated_at: string
        }
        Insert: {
          abbr?: string | null
          created_at?: string
          english_name?: string | null
          full_name: string
          homework_tutor_only?: boolean
          homework_tutoring_nav?: boolean
          id?: string
          status?: string | null
          subject_speciality?: string[] | null
          updated_at?: string
        }
        Update: {
          abbr?: string | null
          created_at?: string
          english_name?: string | null
          full_name?: string
          homework_tutor_only?: boolean
          homework_tutoring_nav?: boolean
          id?: string
          status?: string | null
          subject_speciality?: string[] | null
          updated_at?: string
        }
        Relationships: []
      }
      teachers_private: {
        Row: {
          email: string | null
          phone: string | null
          remarks: string | null
          salary_per_lesson: number | null
          teacher_id: string
          updated_at: string
        }
        Insert: {
          email?: string | null
          phone?: string | null
          remarks?: string | null
          salary_per_lesson?: number | null
          teacher_id: string
          updated_at?: string
        }
        Update: {
          email?: string | null
          phone?: string | null
          remarks?: string | null
          salary_per_lesson?: number | null
          teacher_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "teachers_private_teacher_id_fkey"
            columns: ["teacher_id"]
            isOneToOne: true
            referencedRelation: "teachers"
            referencedColumns: ["id"]
          },
        ]
      }
      tmp_students_import: {
        Row: {
          created_at: string
          full_name: string | null
          grade: string | null
          id: number
          parent_name: string | null
          parent_phone: string | null
          parent_phone_country_code: string | null
          parent_relationship: string | null
          preferred_contact_method: string | null
          primary_contact_person: string | null
          remarks: string | null
          school: string | null
          status: string | null
          student_code: string | null
          student_phone: string | null
          student_phone_country_code: string | null
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          grade?: string | null
          id?: number
          parent_name?: string | null
          parent_phone?: string | null
          parent_phone_country_code?: string | null
          parent_relationship?: string | null
          preferred_contact_method?: string | null
          primary_contact_person?: string | null
          remarks?: string | null
          school?: string | null
          status?: string | null
          student_code?: string | null
          student_phone?: string | null
          student_phone_country_code?: string | null
        }
        Update: {
          created_at?: string
          full_name?: string | null
          grade?: string | null
          id?: number
          parent_name?: string | null
          parent_phone?: string | null
          parent_phone_country_code?: string | null
          parent_relationship?: string | null
          preferred_contact_method?: string | null
          primary_contact_person?: string | null
          remarks?: string | null
          school?: string | null
          status?: string | null
          student_code?: string | null
          student_phone?: string | null
          student_phone_country_code?: string | null
        }
        Relationships: []
      }
      trial_sessions: {
        Row: {
          class_id: string
          converted_enrollment_id: string | null
          converted_payment_id: string | null
          counts_toward_headcount: boolean | null
          created_at: string
          id: string
          outcome: string
          outcome_at: string | null
          outcome_note: string | null
          outcome_reason: string | null
          payment_id: string | null
          remarks: string | null
          schedule_id: string
          status: string | null
          student_id: string
          trial_date: string
          trial_type: string
          updated_at: string
        }
        Insert: {
          class_id: string
          converted_enrollment_id?: string | null
          converted_payment_id?: string | null
          counts_toward_headcount?: boolean | null
          created_at?: string
          id?: string
          outcome?: string
          outcome_at?: string | null
          outcome_note?: string | null
          outcome_reason?: string | null
          payment_id?: string | null
          remarks?: string | null
          schedule_id: string
          status?: string | null
          student_id: string
          trial_date: string
          trial_type: string
          updated_at?: string
        }
        Update: {
          class_id?: string
          converted_enrollment_id?: string | null
          converted_payment_id?: string | null
          counts_toward_headcount?: boolean | null
          created_at?: string
          id?: string
          outcome?: string
          outcome_at?: string | null
          outcome_note?: string | null
          outcome_reason?: string | null
          payment_id?: string | null
          remarks?: string | null
          schedule_id?: string
          status?: string | null
          student_id?: string
          trial_date?: string
          trial_type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trial_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_sessions_converted_enrollment_id_fkey"
            columns: ["converted_enrollment_id"]
            isOneToOne: false
            referencedRelation: "student_class_enrollments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_sessions_converted_payment_id_fkey"
            columns: ["converted_payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_sessions_payment_id_fkey"
            columns: ["payment_id"]
            isOneToOne: false
            referencedRelation: "payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_sessions_schedule_id_fkey"
            columns: ["schedule_id"]
            isOneToOne: false
            referencedRelation: "schedules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trial_sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      tuition_credit_entries: {
        Row: {
          amount: number
          applied_at: string | null
          applied_charge_id: string | null
          class_id: string | null
          created_at: string
          id: string
          lesson_count: number
          notes: string | null
          source_charge_id: string | null
          source_leave_id: string | null
          status: string
          student_id: string
        }
        Insert: {
          amount: number
          applied_at?: string | null
          applied_charge_id?: string | null
          class_id?: string | null
          created_at?: string
          id?: string
          lesson_count?: number
          notes?: string | null
          source_charge_id?: string | null
          source_leave_id?: string | null
          status?: string
          student_id: string
        }
        Update: {
          amount?: number
          applied_at?: string | null
          applied_charge_id?: string | null
          class_id?: string | null
          created_at?: string
          id?: string
          lesson_count?: number
          notes?: string | null
          source_charge_id?: string | null
          source_leave_id?: string | null
          status?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "tuition_credit_entries_applied_charge_id_fkey"
            columns: ["applied_charge_id"]
            isOneToOne: false
            referencedRelation: "monthly_tuition_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_credit_entries_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_credit_entries_source_charge_id_fkey"
            columns: ["source_charge_id"]
            isOneToOne: false
            referencedRelation: "monthly_tuition_charges"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_credit_entries_source_leave_id_fkey"
            columns: ["source_leave_id"]
            isOneToOne: false
            referencedRelation: "leave_makeup_records"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tuition_credit_entries_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      weekday_aliases: {
        Row: {
          alias: string
          created_at: string
          is_active: boolean
          iso_dow: number
          updated_at: string
        }
        Insert: {
          alias: string
          created_at?: string
          is_active?: boolean
          iso_dow: number
          updated_at?: string
        }
        Update: {
          alias?: string
          created_at?: string
          is_active?: boolean
          iso_dow?: number
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      academic_year_label_from_date: {
        Args: { p_date?: string }
        Returns: string
      }
      apo_assistant_can_access_class: {
        Args: { p_class_id: string; p_teacher_id?: string; p_user_role: string }
        Returns: boolean
      }
      apo_assistant_can_access_student: {
        Args: {
          p_student_id: string
          p_teacher_id?: string
          p_user_role: string
        }
        Returns: boolean
      }
      apo_assistant_class_roster: {
        Args: {
          p_class_query: string
          p_date?: string
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_hk_today: { Args: never; Returns: string }
      apo_assistant_is_pending_makeup: {
        Args: { p_status: string }
        Returns: boolean
      }
      apo_assistant_overdue_tuition_list: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_pending_makeups: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_search_students: {
        Args: {
          p_limit?: number
          p_query: string
          p_teacher_id?: string
          p_user_role: string
        }
        Returns: Json
      }
      apo_assistant_search_teachers: {
        Args: {
          p_limit?: number
          p_query: string
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_student_attendance: {
        Args: {
          p_limit?: number
          p_student_id: string
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_student_profile: {
        Args: {
          p_student_id: string
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_student_today_lessons: {
        Args: {
          p_date?: string
          p_student_id: string
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_student_tuition: {
        Args: {
          p_student_id: string
          p_teacher_id?: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_teacher_classes: {
        Args: {
          p_scope_teacher_id?: string
          p_teacher_id: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_teacher_day_attendance: {
        Args: {
          p_date?: string
          p_scope_teacher_id?: string
          p_teacher_id: string
          p_user_role?: string
        }
        Returns: Json
      }
      apo_assistant_teacher_schedule: {
        Args: { p_date?: string; p_teacher_id?: string; p_user_role?: string }
        Returns: Json
      }
      apo_assistant_today_leaves: {
        Args: { p_date?: string; p_teacher_id?: string; p_user_role?: string }
        Returns: Json
      }
      apo_assistant_upcoming_trials: {
        Args: { p_days?: number; p_teacher_id?: string; p_user_role?: string }
        Returns: Json
      }
      cancel_portal_enrollment_request: {
        Args: { p_request_id: string }
        Returns: undefined
      }
      clear_my_mgmt_session_role: { Args: never; Returns: undefined }
      contact_update_approve: { Args: { p_token: string }; Returns: Json }
      contact_update_create: {
        Args: { p_student_ids: string[] }
        Returns: Json
      }
      contact_update_get: { Args: { p_token: string }; Returns: Json }
      contact_update_require_admin_or_alien: { Args: never; Returns: undefined }
      contact_update_snapshot_from_student: {
        Args: { s: Database["public"]["Tables"]["students"]["Row"] }
        Returns: Json
      }
      contact_update_submit: {
        Args: { p_payload: Json; p_token: string }
        Returns: Json
      }
      contact_update_void: { Args: { p_token: string }; Returns: Json }
      courses_build_code_base: {
        Args: {
          p_course_seq: number
          p_grade_code: string
          p_subject_id: string
        }
        Returns: string
      }
      courses_normalize_grade_code: { Args: { grade: string }; Returns: string }
      current_app_role: { Args: never; Returns: string }
      current_app_user_email: { Args: never; Returns: string }
      current_app_user_id: { Args: never; Returns: string }
      current_inbox_actor_key: { Args: never; Returns: string }
      current_portal_student_id: { Args: never; Returns: string }
      current_portal_view_as_student_id: { Args: never; Returns: string }
      current_teacher_id: { Args: never; Returns: string }
      front_desk_intake_consume: {
        Args: { p_token: string }
        Returns: undefined
      }
      front_desk_intake_create: { Args: never; Returns: Json }
      front_desk_intake_get: { Args: { p_token: string }; Returns: Json }
      front_desk_intake_submit: {
        Args: { p_payload: Json; p_token: string }
        Returns: Json
      }
      get_attendance_records_in_range: {
        Args: { p_from_date: string; p_to_date: string }
        Returns: {
          attendance_date: string
          class_id: string
          class_teacher_id: string
          course_code_full: string
          course_name: string
          english_name: string
          full_name: string
          grade: string
          id: string
          original_teacher_id: string
          original_teacher_name: string
          remarks: string
          schedule_id: string
          status: string
          student_id: string
          subject: string
          teacher_id: string
          teacher_name: string
          updated_at: string
        }[]
      }
      get_enrollment_effective_dates: {
        Args: { p_enrollment_ids: string[] }
        Returns: {
          enroll_date: string
          enrollment_id: string
          withdraw_effective_date: string
        }[]
      }
      get_my_mgmt_profile: {
        Args: never
        Returns: {
          active_role: string
          available_roles: string[]
          display_name: string
          email: string
          teacher_id: string
        }[]
      }
      get_my_mgmt_profile_v2: { Args: never; Returns: Json }
      get_portal_view_as: {
        Args: never
        Returns: {
          student_id: string
          student_name: string
        }[]
      }
      get_teacher_schedule_roster_context: {
        Args: { p_schedule_ids: string[] }
        Returns: Json
      }
      grade_code_to_label: { Args: { p_code: string }; Returns: string }
      grade_codes_to_class_labels: {
        Args: { p_codes: string[] }
        Returns: string[]
      }
      is_admin: { Args: never; Returns: boolean }
      is_alien: { Args: never; Returns: boolean }
      is_mgmt_staff: { Args: never; Returns: boolean }
      is_portal: { Args: never; Returns: boolean }
      is_teacher_role: { Args: never; Returns: boolean }
      list_pending_room_booking_occupancy: {
        Args: { p_from: string; p_to: string }
        Returns: {
          classroom_id: string
          end_time: string
          id: string
          is_other: boolean
          scheduled_date: string
          start_time: string
          target_course_code_full: string
          target_course_name: string
          target_subject: string
          teacher_name: string
        }[]
      }
      list_portal_class_schedules: {
        Args: { p_class_id: string }
        Returns: {
          class_id: string
          end_time: string
          id: string
          scheduled_date: string
          session_number: number
          start_time: string
          status: string
        }[]
      }
      list_portal_enrollable_class_ids: {
        Args: { p_student_id: string }
        Returns: string[]
      }
      list_portal_my_trial_schedules: {
        Args: { p_from?: string; p_limit?: number; p_to?: string }
        Returns: {
          class_id: string
          classroom_id: string
          classroom_name: string
          course_code_full: string
          end_time: string
          payment_id: string
          schedule_id: string
          schedule_status: string
          scheduled_date: string
          session_number: number
          start_time: string
          subject: string
          teacher_id: string
          teacher_name: string
          trial_date: string
          trial_id: string
          trial_status: string
          trial_type: string
        }[]
      }
      list_room_schedule_occupancy: {
        Args: { p_from: string; p_to: string }
        Returns: {
          classroom_id: string
          course_code_full: string
          course_name: string
          end_time: string
          id: string
          scheduled_date: string
          start_time: string
          status: string
          subject: string
          teacher_name: string
        }[]
      }
      map_grade_code: { Args: { grades: string[] }; Returns: string }
      map_subject_code: { Args: { name_zh: string }; Returns: string }
      next_student_code_current_year: { Args: never; Returns: string }
      normalize_class_grade_array: {
        Args: { grades: string[] }
        Returns: string[]
      }
      normalize_class_grade_label: { Args: { raw: string }; Returns: string }
      normalize_student_grade: { Args: { raw: string }; Returns: string }
      peek_portal_invite: { Args: { p_token: string }; Returns: Json }
      portal_allocate_invoice_number: { Args: never; Returns: string }
      portal_build_quote_from_lines: { Args: { p_lines: Json }; Returns: Json }
      portal_can_access_class: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      portal_class_matches_current_student_grade: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      portal_class_matches_student_grade: {
        Args: { p_class_id: string; p_student_id: string }
        Returns: boolean
      }
      portal_count_lessons_for_period: {
        Args: {
          p_class_id: string
          p_enrollment_period: string
          p_schedule_ids: string[]
        }
        Returns: number
      }
      portal_resolve_unit_price: {
        Args: {
          p_class_price: number
          p_course_price: number
          p_course_price_both: number
          p_course_price_p2: number
          p_enrollment_period: string
        }
        Returns: number
      }
      portal_student_grade_label: {
        Args: { p_student_id: string }
        Returns: string
      }
      preview_portal_enrollment_quote: {
        Args: { p_lines: Json }
        Returns: Json
      }
      recompute_student_enrollment_state: {
        Args: { p_student_id: string }
        Returns: undefined
      }
      redeem_portal_invite: { Args: { p_token: string }; Returns: string }
      refresh_academic_year_is_current: { Args: never; Returns: undefined }
      review_portal_enrollment_request: {
        Args: {
          p_approve: boolean
          p_request_id: string
          p_staff_note?: string
        }
        Returns: string
      }
      section_code_from_ord: { Args: { n: number }; Returns: string }
      start_portal_view_as: { Args: { p_student_id: string }; Returns: string }
      stop_portal_view_as: { Args: never; Returns: undefined }
      student_class_late_fee_pools: {
        Args: {
          p_billing_month?: string
          p_cutoff?: string
          p_student_id: string
        }
        Returns: {
          already_handled_month: boolean
          billable_after: number
          billable_before: number
          class_id: string
          class_kind: string
          course_mode: string
          covered_for_new: number
          paid_lessons: number
          trigger_late_fee: boolean
        }[]
      }
      student_tuition_arrears: {
        Args: { p_student_ids: string[] }
        Returns: {
          attended_lessons: number
          paid_lessons: number
          student_id: string
        }[]
      }
      submit_portal_enrollment_request: {
        Args: { p_lines: Json; p_parent_note?: string }
        Returns: string
      }
      switch_my_mgmt_role: { Args: { p_role: string }; Returns: undefined }
      switch_my_mgmt_role_v2: { Args: { p_role: string }; Returns: Json }
      teacher_can_access_calendar_event: {
        Args: { p_event_id: string }
        Returns: boolean
      }
      teacher_can_access_class: {
        Args: { p_class_id: string }
        Returns: boolean
      }
      teacher_can_access_schedule: {
        Args: { p_schedule_id: string }
        Returns: boolean
      }
      teacher_can_access_student: {
        Args: { p_student_id: string }
        Returns: boolean
      }
      teacher_can_read_attendance: {
        Args: { p_class_id: string; p_schedule_id: string }
        Returns: boolean
      }
      teacher_can_write_attendance: {
        Args: { p_class_id: string; p_schedule_id: string }
        Returns: boolean
      }
      teacher_has_homework_tutoring_nav: { Args: never; Returns: boolean }
      teacher_owns_schedule_row: {
        Args: {
          p_class_id: string
          p_original_teacher_id: string
          p_schedule_teacher_id: string
          p_teacher_id: string
        }
        Returns: boolean
      }
      void_payment_command: {
        Args: { p_payment_id: string; p_reason: string }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
