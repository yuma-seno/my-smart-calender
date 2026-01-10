import React, {
  useMemo,
  useRef,
  useEffect,
  useState,
  ReactElement,
} from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "./Card";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

import type { CalendarEventMap, CalendarEvent } from "../types/events";
import { DEFAULT_CALENDAR_COLOR } from "../utils/config";

interface CalendarProps {
  events: CalendarEventMap;
  onSelectDate: (date: Date | null) => void;
  selectedDate: Date | null;
  today: Date;
  resetToken: number;
}

const Calendar = ({
  events,
  onSelectDate,
  selectedDate,
  today,
  resetToken,
}: CalendarProps) => {
  const baseDate = useMemo(
    () => new Date(today.getFullYear(), today.getMonth(), 1),
    [today]
  );
  const swiperRef = useRef<any | null>(null);
  const yearSwiperRef = useRef<any | null>(null);
  const [monthModalOpen, setMonthModalOpen] = useState(false as boolean);
  const [currentYear, setCurrentYear] = useState(baseDate.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(baseDate.getMonth() + 1);
  const [pickerYear, setPickerYear] = useState(baseDate.getFullYear());

  const minYear = baseDate.getFullYear() - 1;
  const maxYear = baseDate.getFullYear() + 1;

  const handleChangeMonthYear = (year: number, month1to12: number) => {
    const target = new Date(year, month1to12 - 1, 1);
    const base = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const diffMonths =
      (target.getFullYear() - base.getFullYear()) * 12 +
      (target.getMonth() - base.getMonth());

    // 現在のスライド構成は baseDate を中心に -12〜+12 ヶ月（25枚）
    const clampedDiff = Math.max(-12, Math.min(12, diffMonths));
    const slideIndex = clampedDiff + 12;
    if (swiperRef.current) {
      swiperRef.current.slideTo(slideIndex);
    }
  };

  const buildMonthGrid = (monthDate: Date) => {
    const year = monthDate.getFullYear();
    const month = monthDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    const totalSlots = 42;
    const days: ReactElement[] = [];
    let cellIndex = 0;

    for (let i = 0; i < startDay; i++) {
      const isFirstRow = cellIndex < 7;
      const isFirstCol = cellIndex % 7 === 0;
      days.push(
        <div
          key={`blank-start-${i}`}
          onClick={(e: any) => {
            e.stopPropagation();
            onSelectDate(null);
          }}
          className={`flex-1 min-w-0 min-h-0 p-0.5 relative box-border border-gray-200 dark:border-white/10 ${
            !isFirstRow ? "border-t" : ""
          } ${!isFirstCol ? "border-l" : ""}`}
        />
      );
      cellIndex++;
    }

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay();
      const isToday = today.toDateString() === dateObj.toDateString();
      const isSelected =
        selectedDate && selectedDate.toDateString() === dateObj.toDateString();
      const y = dateObj.getFullYear();
      const m = dateObj.getMonth() + 1;
      const dd = dateObj.getDate();
      const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(dd).padStart(
        2,
        "0"
      )}`;
      const dayEvents = events[dateKey] || [];
      const hasHolidayEvent = dayEvents.some(
        (ev: CalendarEvent) => ev.isHoliday
      );
      const isHoliday = dayOfWeek === 0 || hasHolidayEvent;

      let numClass = "text-gray-700 dark:text-gray-200";
      if (isHoliday) numClass = "text-red-500 dark:text-red-400";
      else if (dayOfWeek === 6) numClass = "text-blue-500 dark:text-blue-400";

      let containerClass = "border-gray-200 dark:border-white/10";
      if (isToday)
        numClass =
          "text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center -ml-1";
      if (isSelected)
        containerClass +=
          " bg-blue-50 dark:bg-white/10 ring-2 ring-blue-500 z-10";

      const isFirstRow = cellIndex < 7;
      const isFirstCol = cellIndex % 7 === 0;
      days.push(
        <div
          key={d}
          onClick={(e: any) => {
            e.stopPropagation();
            onSelectDate(dateObj);
          }}
          className={`
          flex-1 min-w-0 min-h-0 flex flex-col justify-start p-0.5 cursor-pointer transition-all relative overflow-hidden items-center box-border
          ${!isFirstRow ? "border-t" : ""} ${!isFirstCol ? "border-l" : ""}
          ${containerClass}
          hover:bg-gray-50 dark:hover:bg-white/5
        `}
        >
          <span
            className={`text-[20px] font-bold z-10 mb-0.5 text-center ${numClass}`}
          >
            {d}
          </span>
          <div className="w-full h-full flex flex-col gap-x-0.5 gap-y-0.5 z-10">
            {dayEvents
              .slice(0, dayEvents.length === 3 ? 3 : 2)
              .map((ev: CalendarEvent, i: number) => (
                <div
                  key={i}
                  className={`
                h-[30%] text-[15px] leading-none px-1 flex items-center text-white truncate relative
                ${ev.isStart ? "rounded-l-sm ml-0.5" : "-ml-1"} 
                ${ev.isEnd ? "rounded-r-sm mr-0.5" : "-mr-1"}
                ${!ev.isStart && !ev.isEnd ? "-mx-1" : ""}
              `}
                  style={{
                    backgroundColor: ev.calendarColor || DEFAULT_CALENDAR_COLOR,
                  }}
                  title={ev.summary}
                >
                  {ev.isStart && <span className="truncate">{ev.summary}</span>}
                </div>
              ))}
            {dayEvents.length > 3 && (
              <div className="text-[13px] pl-1 text-gray-500 dark:text-gray-400">
                +{dayEvents.length - 2}
              </div>
            )}
          </div>
        </div>
      );
      cellIndex++;
    }

    const remainingSlots = totalSlots - (startDay + daysInMonth);
    for (let i = 0; i < remainingSlots; i++) {
      const isFirstRow = cellIndex < 7;
      const isFirstCol = cellIndex % 7 === 0;
      days.push(
        <div
          key={`blank-end-${i}`}
          onClick={(e: any) => {
            e.stopPropagation();
            onSelectDate(null);
          }}
          className={`flex-1 min-w-0 min-h-0 p-0.5 relative box-border border-gray-200 dark:border-white/10 ${
            !isFirstRow ? "border-t" : ""
          } ${!isFirstCol ? "border-l" : ""}`}
        />
      );
      cellIndex++;
    }

    return { year, month, days };
  };

  useEffect(() => {
    if (swiperRef.current) {
      swiperRef.current.slideTo(12);
    }
  }, [resetToken, baseDate]);

  useEffect(() => {
    const by = baseDate.getFullYear();
    const bm = baseDate.getMonth() + 1;
    setCurrentYear(by);
    setCurrentMonth(bm);
    // reset pickerYear but clamp into allowed range
    setPickerYear((prev: number) => {
      if (prev < minYear || prev > maxYear) return by;
      return prev;
    });
  }, [baseDate, minYear, maxYear]);

  return (
    <Card className="select-none flex p-0 flex-col h-full">
      <Swiper
        className="flex-1 w-full min-h-0"
        slidesPerView={1}
        onSwiper={(swiper: any) => {
          swiperRef.current = swiper;
        }}
        speed={400}
        initialSlide={12}
      >
        {Array.from({ length: 25 }, (_, i) => i - 12).map((offset) => {
          const monthDate = new Date(
            baseDate.getFullYear(),
            baseDate.getMonth() + offset,
            1
          );
          const { year, month, days } = buildMonthGrid(monthDate);
          const rows: ReactElement[][] = [];
          for (let r = 0; r < 6; r++) {
            rows.push(days.slice(r * 7, (r + 1) * 7));
          }
          return (
            <SwiperSlide key={offset} className="flex flex-col h-full p-4">
              <div className="flex justify-between items-center mb-2 flex-none px-2 gap-2">
                <div className="flex items-baseline gap-1 text-black dark:text-white">
                  <button
                    type="button"
                    onClick={() => {
                      setCurrentYear(year);
                      setCurrentMonth(month + 1);
                      setPickerYear(year);
                      setMonthModalOpen(true);
                    }}
                    className="bg-transparent text-[30px] font-bold focus:outline-none cursor-pointer hidden-appearance my-1.5"
                  >
                    {year}年 {month + 1}月
                  </button>
                </div>
                <div className="flex-none flex gap-1">
                  <button
                    onClick={() => swiperRef.current?.slidePrev()}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-white/50"
                  >
                    <ChevronLeft size={18} />
                  </button>
                  <button
                    onClick={() => swiperRef.current?.slideNext()}
                    className="p-1.5 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full text-gray-500 dark:text-white/50"
                  >
                    <ChevronRight size={18} />
                  </button>
                </div>
              </div>
              <div className="flex-none grid grid-cols-7 gap-0 text-center mb-1 bg-black/3 dark:bg-white/5 pb-1 pt-1 rounded-md">
                {["日", "月", "火", "水", "木", "金", "土"].map((day, i) => (
                  <div
                    key={day}
                    className={`font-medium text-[15px] ${
                      i === 0
                        ? "text-red-500"
                        : i === 6
                        ? "text-blue-500"
                        : "text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {day}
                  </div>
                ))}
              </div>
              <div className="flex-1 flex flex-col min-h-0 w-full">
                {rows.map((row, rowIndex) => (
                  <div
                    key={rowIndex}
                    className="flex flex-1 min-h-0 text-center"
                  >
                    {row}
                  </div>
                ))}
              </div>
            </SwiperSlide>
          );
        })}
      </Swiper>
      {monthModalOpen && (
        <div
          className="fixed inset-0 z-40 flex items-center justify-center bg-black/40"
          onClick={() => setMonthModalOpen(false)}
        >
          <div
            className="relative bg-white dark:bg-neutral-900 rounded-2xl shadow-2xl w-[420px] max-w-[92%] p-7"
            onClick={(e: any) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute right-10 top-8 text-[28px] text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              onClick={() => setMonthModalOpen(false)}
            >
              ✕
            </button>
            <div className="flex items-center justify_between mb-2">
              <button
                type="button"
                className="px-2 py-1 text-sm rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40"
                onClick={() => yearSwiperRef.current?.slidePrev()}
                disabled={pickerYear <= minYear}
              >
                <ChevronLeft size={28} />
              </button>
              <span className="text-[32px] font-bold text-gray-800 dark:text-white">
                {pickerYear}年
              </span>
              <button
                type="button"
                className="px-2 py-1 text-sm rounded-full text-gray-600 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10 disabled:opacity-40"
                onClick={() => yearSwiperRef.current?.slideNext()}
                disabled={pickerYear >= maxYear}
              >
                <ChevronRight size={28} />
              </button>
            </div>
            <Swiper
              className="w-full mt-2"
              slidesPerView={1}
              onSwiper={(sw: any) => {
                yearSwiperRef.current = sw;
              }}
              initialSlide={pickerYear - minYear}
              speed={300}
              onSlideChange={(sw: any) => {
                const idx = sw.realIndex ?? sw.activeIndex ?? 0;
                const y = minYear + idx;
                setPickerYear(y);
              }}
            >
              {Array.from(
                { length: maxYear - minYear + 1 },
                (_, i) => minYear + i
              ).map((year) => (
                <SwiperSlide key={year} className="p-3">
                  <div className="grid grid-cols-3 gap-2 mt-1">
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => {
                      const isCurrent =
                        year === currentYear && m === currentMonth;
                      const diffMonths =
                        (year - baseDate.getFullYear()) * 12 +
                        (m - (baseDate.getMonth() + 1));
                      const isDisabled = diffMonths < -12 || diffMonths > 12;
                      return (
                        <button
                          key={m}
                          type="button"
                          className={`py-3 rounded-full text-[21px] font-medium transition-colors border border-transparent ${
                            isCurrent
                              ? "bg-blue-500 text-white"
                              : isDisabled
                              ? "bg-black/5 text-gray-400 dark:bg-white/5 dark:text-gray-500 cursor-default"
                              : "bg-black/5 text-gray-700 hover:bg-black/10 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10"
                          }`}
                          onClick={() => {
                            if (isDisabled) return;
                            handleChangeMonthYear(year, m);
                            setCurrentYear(year);
                            setCurrentMonth(m);
                            setMonthModalOpen(false);
                          }}
                        >
                          {m}月
                        </button>
                      );
                    })}
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Calendar;
