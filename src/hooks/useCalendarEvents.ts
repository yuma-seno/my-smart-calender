import { useEffect, useState } from "react";
import { CalendarConfig } from "../types/config";
import { fetchWithProxy } from "../utils/fetchWithProxy";
import { parseICal } from "../utils/ical";
import { HOLIDAY_ICAL_URL } from "../utils/config";
import type { CalendarEvent, CalendarEventMap } from "../types/events";

export const useCalendarEvents = (
  calendars: CalendarConfig[] | undefined
): CalendarEventMap => {
  const [events, setEvents] = useState<CalendarEventMap>({});

  useEffect(() => {
    const activeCalendars = (calendars || []).filter(
      (c: CalendarConfig) => c.url && c.url.trim().length
    );

    if (!activeCalendars.length) {
      setEvents({});
      return;
    }

    let active = true;

    const fetchEvents = async () => {
      const merged: CalendarEventMap = {};

      await Promise.all(
        activeCalendars.map(async (cal: CalendarConfig, index: number) => {
          const url = cal.url.trim();
          if (!url) return;
          try {
            const icalText = await fetchWithProxy(url);
            const parsed = parseICal(icalText);
            const isHolidayCalendar = url === HOLIDAY_ICAL_URL;
            Object.entries(parsed).forEach(([date, items]) => {
              if (!merged[date]) merged[date] = [];
              const enhanced = (items as CalendarEvent[]).map((ev) => ({
                ...ev,
                calendarIndex: index,
                calendarColor: cal.color,
                calendarName: cal.name,
                isHoliday: isHolidayCalendar,
              }));
              merged[date].push(...enhanced);
            });
          } catch (e) {
            console.error("iCal Fetch Error:", url, e);
          }
        })
      );

      Object.keys(merged).forEach((date) =>
        merged[date].sort((a, b) =>
          (a.timeStr || "").localeCompare(b.timeStr || "")
        )
      );

      if (active) setEvents(merged);
    };

    fetchEvents();
    const intervalId = window.setInterval(fetchEvents, 5 * 60 * 1000);

    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, [calendars]);

  return events;
};
