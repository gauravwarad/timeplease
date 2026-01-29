
export type TimerStatus = 'IDLE' | 'RUNNING' | 'PAUSED' | 'BREAK';

export type TimerMode = 'FLOW' | 'POMO';

export interface Settings {
  pomodoroDuration: number; // minutes
  breakDuration: number; // minutes
  longBreakDuration: number; // minutes
  pomodoroSessionsBeforeLongBreak: number;
  theme?: 'light' | 'dark' | 'system';
  pomoNotificationsEnabled: boolean;
  flowNotificationsEnabled: boolean;
  flowNotificationInterval: number; // minutes
}

export interface Project {
  id: string;
  name: string;
  color: string;
  notes: string;
  is_archived?: boolean;
}

export interface StorageData {
  projects: Project[];
  settings?: Settings;
  sessions: Session[];
  dailyStats: DailyStats[];
}

export interface Session {
  id: string;
  project_id: string;
  start_time: string; // ISO
  end_time: string; // ISO
  elapsed_seconds: number;
  actual_work_minutes: number;
  label: string;
  type: TimerMode;
}

export interface DailyStats {
  date: string; // YYYY-MM-DD
  breaks_taken: number;
  work_sessions_completed: number;
  total_work_minutes: number;
}
