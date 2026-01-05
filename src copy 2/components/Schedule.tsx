import React from "react";
import Card from "./Card";

interface ScheduleProps {
  events: Record<string, any[]>;
  selectedDate: Date | null;
}

const Schedule = ({ events, selectedDate }: ScheduleProps) => {
  const displayDate = selectedDate || new Date();
  const isToday = new Date().toDateString() === displayDate.toDateString();
  const y = displayDate.getFullYear();
  const m = displayDate.getMonth() + 1;
  const d = displayDate.getDate();
  const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(
    2,
    "0"
  )}`;
  const daysEvents = events[dateKey] || [];

  return (
    <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
      {daysEvents.length === 0 ? (
        <div className="text-center mt-4 text-[14px] text-gray-500 dark:text-gray-300">
          予定はありません
        </div>
      ) : (
        daysEvents.map((ev: any, i: number) => (
          <div
            key={i}
            className="bg-black/5 dark:bg-white/5 p-3 rounded-lg border-l-4 shrink-0"
            style={{ borderLeftColor: ev.calendarColor || "#60a5fa" }}
          >
            <div
              className="text-[19px] font-mono mb-0.5"
              style={{ color: ev.calendarColor || "#60a5fa" }}
            >
              {ev.isAllDay || !ev.timeStr
                ? "終日"
                : ev.endTimeStr
                ? `${ev.timeStr} - ${ev.endTimeStr}`
                : ev.timeStr}
            </div>
            <div className="font-medium text-[23px] text-gray-600 dark:text-white">
              {ev.summary}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Schedule;
