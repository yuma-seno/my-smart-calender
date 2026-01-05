export interface CalendarConfig {
  url: string;
  color: string;
  name?: string;
}

export interface SmartDashConfig {
  city: string;
  rssUrl: string;
  calendars: CalendarConfig[];
}
