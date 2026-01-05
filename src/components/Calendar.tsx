import React, { useMemo, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import Card from "./Card";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";

interface CalendarProps {
  events: Record<string, any[]>;
  onSelectDate: (date: Date | null) => void;
  selectedDate: Date | null;
}

const Calendar = ({ events, onSelectDate, selectedDate }: CalendarProps) => {
  const baseDate = useMemo(() => new Date(), []);
  const swiperRef = useRef(null as any);

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
          onClick={(e: any) => {
            e.stopPropagation();
            onSelectDate(null);
          }}
          className="flex-1 min-w-0 min-h-0 p-0.5 relative"
        />
      );

    for (let d = 1; d <= daysInMonth; d++) {
      const dateObj = new Date(year, month, d);
      const dayOfWeek = dateObj.getDay();
      const isToday = new Date().toDateString() === dateObj.toDateString();
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
      const hasHolidayEvent = dayEvents.some((ev: any) => ev.isHoliday);
      const isHoliday = dayOfWeek === 0 || hasHolidayEvent;

      let numClass = "text-gray-700 dark:text-gray-200";
      if (isHoliday) numClass = "text-red-500 dark:text-red-400";
      else if (dayOfWeek === 6) numClass = "text-blue-500 dark:text-blue-400";

      let containerClass = "";
      if (isToday)
        numClass =
          "text-white bg-blue-600 rounded-full w-7 h-7 flex items-center justify-center -ml-1";
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
          <span
            className={`text-[18px] font-bold z-10 mb-0.5 text-center ${numClass}`}
          >
            {d}
          </span>
          <div className="w-full flex flex-col gap-x-0.5 gap-y-0.5 z-10">
            {dayEvents
              .slice(0, dayEvents.length == 3 ? 3 : 2)
              .map((ev: any, i: number) => (
                <div
                  key={i}
                  className={`
                h-6 text-[15px] leading-none px-1 flex items-center text-white truncate
                ${ev.isStart ? "rounded-l-sm ml-0.5" : "-ml-1"} 
                ${ev.isEnd ? "rounded-r-sm mr-0.5" : "-mr-1"}
                ${!ev.isStart && !ev.isEnd ? "-mx-1" : ""}
              `}
                  style={{ backgroundColor: ev.calendarColor || "#60a5fa" }}
                  title={ev.summary}
                >
                  {ev.isStart && <span className="truncate">{ev.summary}</span>}
                </div>
              ))}
            {dayEvents.length > 3 && (
              <div className="text-[12px] pl-1 text-gray-500 dark:text-gray-400">
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
          onClick={(e: any) => {
            e.stopPropagation();
            onSelectDate(null);
          }}
          className="flex-1 min-w-0 min-h-0 p-0.5 relative"
        />
      );

    return { year, month, days };
  };

  return (
    <Card className="select-none flex p-4 flex-col h-full !p-4">
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
          const rows: any[][] = [];
          for (let r = 0; r < 6; r++) {
            rows.push(days.slice(r * 7, (r + 1) * 7));
          }
          return (
            <SwiperSlide key={offset} className="flex flex-col h-full">
              <div className="flex justify-between items-center mb-2 flex-none px-2">
                <h2 className="flex-none text-[24px] font-bold tracking-wide text-black dark:text-white">
                  {year}年 {month + 1}月
                </h2>
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
              <div className="flex-none grid grid-cols-7 gap-0 text-center mb-1 border-b border-gray-100 dark:border-white/5 pb-1">
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
    </Card>
  );
};

export default Calendar;
