import ICAL from "ical.js";
import type { CalendarEventBase, CalendarEventMap } from "../types/events";

const formatDateKey = (date: Date): string => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  return `${y}-${String(m).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
};

export const parseICal = (icalData: string): CalendarEventMap => {
  const events: CalendarEventMap = {};

  const jcalData = ICAL.parse(icalData);
  const comp = new ICAL.Component(jcalData);
  const vevents = comp.getAllSubcomponents("vevent");

  type VEventInfo = {
    event: any;
    component: any;
    uid: string;
  };

  const masterEvents: VEventInfo[] = [];
  const exceptionEventsByUid: Map<string, Map<string, VEventInfo>> = new Map();

  // 1. VEVENT を UID/RECURRENCE-ID ごとに整理
  for (const vevent of vevents) {
    const event = new ICAL.Event(vevent);
    const uidValue = event.uid || vevent.getFirstPropertyValue("uid");
    const uid =
      typeof uidValue === "string"
        ? uidValue
        : uidValue && typeof (uidValue as any).toString === "function"
        ? (uidValue as any).toString()
        : undefined;
    if (!uid) continue;

    const recurrenceId = vevent.getFirstPropertyValue("recurrence-id") as
      | any
      | null;

    if (recurrenceId) {
      const recurrenceKey = recurrenceId.toString();
      let byRecurrenceId = exceptionEventsByUid.get(uid);
      if (!byRecurrenceId) {
        byRecurrenceId = new Map<string, VEventInfo>();
        exceptionEventsByUid.set(uid, byRecurrenceId);
      }
      byRecurrenceId.set(recurrenceKey, { event, component: vevent, uid });
    } else {
      masterEvents.push({ event, component: vevent, uid });
    }
  }

  const addInstance = (
    startJs: Date,
    endJsRaw: Date,
    summary: string,
    isAllDay: boolean
  ) => {
    // ICAL.js の終日イベントの END は通常「排他的」なので 1 日引く
    const endForKey = isAllDay
      ? new Date(
          endJsRaw.getFullYear(),
          endJsRaw.getMonth(),
          endJsRaw.getDate() - 1
        )
      : endJsRaw;

    const startKey = formatDateKey(startJs);
    const endKey = formatDateKey(endForKey);

    const makeTimeStr = (d: Date) => {
      if (isAllDay) return "終日";
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const makeEndTimeStr = (d: Date) => {
      if (isAllDay) return "";
      const hh = String(d.getHours()).padStart(2, "0");
      const mm = String(d.getMinutes()).padStart(2, "0");
      return `${hh}:${mm}`;
    };

    const timeStr = makeTimeStr(startJs);
    const endTimeStr = makeEndTimeStr(endJsRaw);

    const loopDate = new Date(startJs);
    let guard = 0;
    while (loopDate <= endForKey && guard < 31) {
      const dateKey = formatDateKey(loopDate);
      if (!events[dateKey]) events[dateKey] = [];
      const baseEvent: CalendarEventBase = {
        summary,
        start: startKey,
        end: endKey,
        timeStr,
        endTimeStr,
        isAllDay,
        isStart: formatDateKey(loopDate) === startKey,
        isEnd: formatDateKey(loopDate) === endKey,
      };
      events[dateKey].push(baseEvent);
      loopDate.setDate(loopDate.getDate() + 1);
      guard++;
    }
  };

  // 無限ループ回避用の上限
  const now = new Date();
  const limitDate = new Date(
    now.getFullYear() + 2,
    now.getMonth(),
    now.getDate()
  );
  const maxOccurrences = 2000;

  // 2. マスターイベントごとに、単発と繰り返しを展開
  for (const { event, uid } of masterEvents) {
    if (!event.startDate) continue;

    const baseStartJs: Date = event.startDate.toJSDate();
    const baseEndJsRaw: Date = event.endDate
      ? event.endDate.toJSDate()
      : baseStartJs;
    const baseIsAllDay: boolean = event.startDate.isDate;
    const baseDurationMs =
      event.endDate && event.startDate
        ? event.endDate.toJSDate().getTime() -
          event.startDate.toJSDate().getTime()
        : 0;

    const exceptionByRecId = exceptionEventsByUid.get(uid);

    if (event.isRecurring && event.isRecurring()) {
      const iterator = event.iterator();
      let next: any;
      let count = 0;

      while ((next = iterator.next())) {
        const occStartJs: Date = next.toJSDate();
        if (occStartJs > limitDate) break;
        if (count++ > maxOccurrences) break;

        const recurrenceKey = next.toString();

        let occEvent = event;
        let occStart = occStartJs;
        let occEndJs = baseEndJsRaw;
        let occIsAllDay = baseIsAllDay;

        if (exceptionByRecId && exceptionByRecId.has(recurrenceKey)) {
          const { event: exEvent } = exceptionByRecId.get(recurrenceKey)!;
          // その日のインスタンスがキャンセルされている場合はスキップ
          if (exEvent.status === "CANCELLED") {
            continue;
          }
          if (!exEvent.startDate) continue;
          occEvent = exEvent;
          occStart = exEvent.startDate.toJSDate();
          occEndJs = exEvent.endDate ? exEvent.endDate.toJSDate() : occStart;
          occIsAllDay = exEvent.startDate.isDate;
        } else {
          // 基本イベントの duration を使って終了時刻を算出
          occEndJs = baseDurationMs
            ? new Date(occStartJs.getTime() + baseDurationMs)
            : occStartJs;
          occIsAllDay = baseIsAllDay;
        }

        const summary = occEvent.summary || "";
        addInstance(occStart, occEndJs, summary, occIsAllDay);
      }
    } else {
      const summary = event.summary || "";
      addInstance(baseStartJs, baseEndJsRaw, summary, baseIsAllDay);
    }
  }

  Object.keys(events).forEach((key) =>
    events[key].sort((a, b) => (a.timeStr || "").localeCompare(b.timeStr || ""))
  );

  return events;
};
