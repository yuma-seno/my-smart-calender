export interface CalendarEventBase {
  summary: string;
  start: string; // YYYY-MM-DD
  end: string; // YYYY-MM-DD
  timeStr: string;
  endTimeStr: string;
  isAllDay: boolean;
  isStart: boolean;
  isEnd: boolean;
}

export interface CalendarEvent extends CalendarEventBase {
  calendarIndex?: number;
  calendarColor?: string;
  calendarName?: string;
  isHoliday?: boolean;
}

export type CalendarEventMap = Record<string, CalendarEvent[]>;
