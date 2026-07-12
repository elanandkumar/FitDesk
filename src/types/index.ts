export type SourceType = 'manager' | 'personal';
export type RecurrenceType = 'daily' | 'weekly' | 'custom';
export type SessionStatus = 'upcoming' | 'completed' | 'cancelled' | 'skipped';
export type PaymentStatus = 'pending' | 'paid';
export type LocationType = 'offline' | 'online';

export interface ClassType {
  id: number;
  name: string;
  color: string;
  is_active: number;
  created_at: string;
}

export interface Center {
  id: number;
  name: string;
  address?: string;
  is_active: number;
  created_at: string;
}

export interface Manager {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  per_class_rate: number;
  currency: string;
  notes?: string;
  is_active: number;
  created_at: string;
}

export interface Trainee {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  notes?: string;
  is_active: number;
  created_at: string;
}

export interface SeriesTrainee {
  id: number;
  series_id: number;
  trainee_id: number;
}

export interface ClassSeries {
  id: number;
  title: string;
  class_type_id: number;
  source_type: SourceType;
  manager_id?: number;
  recurrence_type: RecurrenceType;
  recurrence_days?: string; // JSON array
  start_date: string;
  end_date?: string;
  class_time: string;
  duration_minutes: number;
  location_type: LocationType;
  location?: string;
  notes?: string;
  is_active: number;
  center_id?: number;
  created_at: string;
}

export interface ClassSession {
  id: number;
  series_id: number;
  session_date: string;
  class_time: string;
  status: SessionStatus;
  student_count: number;
  notes?: string;
  guest_name?: string;
  center_id?: number;
  created_at: string;
}

export interface SessionTrainee {
  id: number;
  session_id: number;
  trainee_id: number;
}

export interface ManagerPayment {
  id: number;
  session_id: number;
  manager_id: number;
  amount: number;
  status: PaymentStatus;
  paid_date?: string;
  notes?: string;
  created_at: string;
}

export interface TraineePackage {
  id: number;
  trainee_id: number;
  series_id?: number;
  month: string;
  total_sessions: number;
  used_sessions: number;
  amount: number;
  status: PaymentStatus;
  paid_date?: string;
  notes?: string;
  created_at: string;
}

export interface Setting {
  key: string;
  value: string;
}

export type AppNotificationType = 'backup_overdue' | 'payment_pending' | 'payment_reminder' | 'payment_overdue' | 'payment_urgent';

export interface AppNotification {
  id: number;
  type: AppNotificationType;
  title: string;
  body: string;
  created_at: string;
  read_at: string | null;
}

export interface EnrichedManagerPayment {
  id: number;
  session_id: number;
  manager_id: number;
  manager_name: string;
  amount: number;
  currency: string;
  status: PaymentStatus;
  paid_date?: string;
  notes?: string;
  session_date: string;
  class_time: string;
  series_title: string;
  class_type_name: string;
  class_type_color: string;
  created_at: string;
}

export interface EnrichedTraineePackage {
  id: number;
  trainee_id: number;
  series_id?: number;
  trainee_name: string;
  month: string;
  total_sessions: number;
  used_sessions: number;
  amount: number;
  status: PaymentStatus;
  paid_date?: string;
  notes?: string;
  created_at: string;
}

export interface MonthlyIncomeSummary {
  month: string;
  manager_paid: number;
  manager_pending: number;
  trainee_paid: number;
  trainee_pending: number;
  total_paid: number;
  total_pending: number;
}

export interface ManagerMonthIncome {
  manager_id: number;
  manager_name: string;
  paid: number;
  pending: number;
}

export interface CenterMonthIncome {
  center_id: number;
  center_name: string;
  paid: number;
  pending: number;
}

export interface TraineeMonthPackage {
  package_id: number;
  trainee_id: number;
  trainee_name: string;
  amount: number;
  status: string;
  total_sessions: number;
  used_sessions: number;
}

export interface EnrichedSession {
  id: number;
  series_id: number;
  session_date: string;
  class_time: string;
  status: SessionStatus;
  student_count: number;
  notes?: string;
  guest_name?: string;
  center_id?: number;
  trainee_names?: string; // comma-joined names from series_trainees, populated by specific queries
  created_at: string;
  series_title: string;
  class_type_name: string;
  class_type_color: string;
  source_type: SourceType;
  manager_id: number | null;
  manager_name: string | null;
  per_class_rate: number;
  currency: string;
  duration_minutes: number;
  location_type: LocationType;
  location: string | null;
}
