export interface CalendarConfig {
  url: string;
  color: string;
  name?: string;
}

export type ThemeMode = "light" | "dark" | "schedule";

export interface ThemeSchedule {
  /** HH:MM (24h) */
  lightStart: string;
  /** HH:MM (24h) */
  darkStart: string;
}

export interface SmartCalenderConfig {
  city: string;
  rssUrl: string;
  calendars: CalendarConfig[];
  themeMode: ThemeMode;
  themeSchedule: ThemeSchedule;
}
