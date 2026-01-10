import React from "react";
import Card from "./Card";
import type { CalendarEventMap, CalendarEvent } from "../types/events";
import { DEFAULT_CALENDAR_COLOR } from "../utils/config";

interface ScheduleProps {
  events: CalendarEventMap;
  selectedDate: Date | null;
  today: Date;
}

const Schedule = ({ events, selectedDate, today }: ScheduleProps) => {
  const displayDate = selectedDate || today;
  const isToday = today.toDateString() === displayDate.toDateString();
  const y = displayDate.getFullYear();
  const m = displayDate.getMonth() + 1;
  const d = displayDate.getDate();
  const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
    2,
    "0"
  )}`;
  const daysEvents = events[dateKey] || [];

  return (
    <Card className="p-4">
      <h3 className="text-[20px] font-bold mb-2 border-b border-gray-200 dark:border-white/10 pb-2 flex-none text-gray-600 dark:text-white">
        {isToday ? "今日の予定" : `${m}月${d}日の予定`}
      </h3>
      <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
        {daysEvents.length === 0 ? (
          <div className="text-center mt-4 text-[15px] text-gray-500 dark:text-gray-300">
            予定はありません
          </div>
        ) : (
          daysEvents.map((ev: CalendarEvent, i: number) => (
            <div
              key={i}
              className="bg-black/5 dark:bg-white/5 p-2 rounded-lg border-l-4 shrink-0"
              style={{
                borderLeftColor: ev.calendarColor || DEFAULT_CALENDAR_COLOR,
              }}
            >
              <div className="text-[16px] text-gray-500 dark:text-gray-200">
                {ev.isAllDay || !ev.timeStr
                  ? "終日"
                  : ev.endTimeStr
                  ? `${ev.timeStr} - ${ev.endTimeStr}`
                  : ev.timeStr}
              </div>
              <div className="font-medium text-[20px] text-gray-600 dark:text-white">
                {ev.summary}
              </div>
            </div>
          ))
        )}
      </div>
    </Card>
  );
};

export default Schedule;
