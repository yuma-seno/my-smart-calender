import React, { useMemo, useRef, forwardRef, useImperativeHandle } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperInstance } from "swiper/types";
import "swiper/css";

interface CalendarProps {
  events: Record<string, any[]>;
  onSelectDate: (date: Date) => void;
  selectedDate: Date | null;
  forecastByDate?: Record<string, any>;
}

const getWeatherIcon = (code: number) => {
  if (code <= 1) return "☀️";
  if (code <= 3) return "⛅";
  if (code <= 48) return "🌫️";
  if (code <= 67) return "☔";
  if (code <= 77) return "❄️";
  if (code <= 99) return "⛈️";
  return "❓";
};

export interface CalendarHandle {
  nextMonth: () => void;
  prevMonth: () => void;
}

const Calendar = forwardRef<CalendarHandle, CalendarProps>(
  ({ events, onSelectDate, selectedDate, forecastByDate }, ref) => {
    const baseDate = useMemo(() => new Date(), []);
    const swiperRef = useRef<SwiperInstance | null>(null);

    useImperativeHandle(ref, () => ({
      nextMonth: () => swiperRef.current?.slideNext(),
      prevMonth: () => swiperRef.current?.slidePrev(),
    }));

    const buildMonthGrid = (monthDate: Date) => {
      const year = monthDate.getFullYear();
      const month = monthDate.getMonth();
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDay = new Date(year, month, 1).getDay();
      const totalSlots = 42;
      const days: any[] = [];

      for (let i = 0; i < startDay; i++)
        days.push(
          <div
            key={`blank-start-${i}`}
            className="flex-1 min-w-0 min-h-0 p-0.5 relative"
          />
        );

      for (let d = 1; d <= daysInMonth; d++) {
        const dateObj = new Date(year, month, d);
        const dayOfWeek = dateObj.getDay();
        const isToday = new Date().toDateString() === dateObj.toDateString();
        const isSelected =
          selectedDate &&
          selectedDate.toDateString() === dateObj.toDateString();
        const y = dateObj.getFullYear();
        const m = dateObj.getMonth() + 1;
        const dd = dateObj.getDate();
        const dateKey = `${y}-${String(m).padStart(2, "0")}-${String(
          dd
        ).padStart(2, "0")}`;
        const dayEvents = events[dateKey] || [];
        const forecast = forecastByDate?.[dateKey];
        const hasHolidayEvent = dayEvents.some((ev: any) => ev.isHoliday);
        const isHoliday = dayOfWeek === 0 || hasHolidayEvent;

        let numClass = "text-gray-700 dark:text-gray-200";
        if (isHoliday) numClass = "text-red-500 dark:text-red-400";
        else if (dayOfWeek === 6) numClass = "text-blue-500 dark:text-blue-400";

        let containerClass = "";
        if (isToday)
          numClass =
            "text-white bg-blue-600 rounded-full w-9 h-9 flex items-center justify-center -ml-1";
        if (isSelected)
          containerClass =
            "bg-blue-50 dark:bg-white/10 ring-2 ring-blue-500 inset-0 z-0";

        days.push(
          <div
            key={d}
            onClick={(e: any) => {
              e.stopPropagation();
              onSelectDate(dateObj);
            }}
            className={`
          flex-1 min-w-0 min-h-0 flex flex-col justify-start p-0.5 rounded-lg cursor-pointer transition-all relative overflow-hidden items-center
          ${containerClass}
          hover:bg-gray-50 dark:hover:bg-white/5
        `}
          >
            <div className="w-full flex items-center flex-start z-10 mb-0.5 px-0.5">
              <span className={`text-[25px] text-center ${numClass}`}>{d}</span>
              {forecast && (
                <div className="flex items-center gap-0.5 text-[14px] leading-none text-gray-700 dark:text-gray-200 ml-[9px]">
                  <span className="text-[18px] leading-none">
                    {getWeatherIcon(forecast.code as number)}
                  </span>
                  <span>
                    {forecast.maxTemp as number}°/{forecast.minTemp as number}°
                  </span>
                </div>
              )}
            </div>
            <div className="w-full flex flex-col gap-x-0.5 gap-y-0.5 z-10">
              {dayEvents
                .slice(0, dayEvents.length == 3 ? 3 : 2)
                .map((ev: any, i: number) => (
                  <div
                    key={i}
                    className={`
                h-5 text-[15px] leading-none px-1 flex items-center text-white truncate
                ${ev.isStart ? "rounded-l-sm ml-0.5" : "-ml-1"} 
                ${ev.isEnd ? "rounded-r-sm mr-0.5" : "-mr-1"}
                ${!ev.isStart && !ev.isEnd ? "-mx-1" : ""}
              `}
                    style={{ backgroundColor: ev.calendarColor || "#60a5fa" }}
                    title={ev.summary}
                  >
                    {ev.isStart && (
                      <span className="truncate">{ev.summary}</span>
                    )}
                  </div>
                ))}
              {dayEvents.length > 3 && (
                <div className="text-[16px] pl-1 text-gray-500 dark:text-gray-400">
                  +{dayEvents.length - 2}
                </div>
              )}
            </div>
          </div>
        );
      }

      const remainingSlots = totalSlots - (startDay + daysInMonth);
      for (let i = 0; i < remainingSlots; i++)
        days.push(
          <div
            key={`blank-end-${i}`}
            className="flex-1 min-w-0 min-h-0 p-0.5 relative"
          />
        );

      return { year, month, days };
    };

    return (
      <div className="select-none flex flex-col h-full">
        <Swiper
          className="flex-1 w-full min-h-0"
          slidesPerView={1}
          onSwiper={(swiper) => {
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
            const rows: any[][] = [];
            for (let r = 0; r < 6; r++) {
              rows.push(days.slice(r * 7, (r + 1) * 7));
            }
            return (
              <SwiperSlide key={offset} className="flex flex-col h-full">
                <div className="flex justify-start items-center mb-2 flex-none px-2">
                  <h2 className="flex-none text-[28px] font-bold tracking-wide text-black dark:text-white">
                    {year}年 {month + 1}月
                  </h2>
                </div>
                <div className="flex-none grid grid-cols-7 gap-0 text-center mb-1 border-b border-gray-100 dark:border-white/5 pb-1">
                  {"日月火水木金土".split("").map((day, i) => (
                    <div
                      key={day}
                      className={`font-medium text-[16px] ${
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
                <div className="flex-1 flex flex-col gap-px min-h-0 w-full overflow-hidden">
                  {rows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className="flex flex-1 gap-px min-h-0 text-center"
                    >
                      {row}
                    </div>
                  ))}
                </div>
              </SwiperSlide>
            );
          })}
        </Swiper>
      </div>
    );
  }
);

export default Calendar;
