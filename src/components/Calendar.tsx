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
    const days: any[] = [];
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
            className={`text-[18px] font-bold z-10 mb-0.5 text-center ${numClass}`}
          >
            {d}
          </span>
          <div className="w-full h-full flex flex-col gap-x-0.5 gap-y-0.5 z-10">
            {dayEvents
              .slice(0, dayEvents.length == 3 ? 3 : 2)
              .map((ev: any, i: number) => (
                <div
                  key={i}
                  className={`
                h-[30%] text-[15px] leading-none px-1 flex items-center text-white truncate relative
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

  return (
    <Card className="select-none flex p-0 flex-col h-full !p-4">
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
            <SwiperSlide key={offset} className="flex flex-col h-full p-4">
              <div className="flex justify-between items-center mb-2 flex-none px-2 gap-2">
                <div className="flex items-baseline gap-1 text-black dark:text-white">
                  <select
                    value={year}
                    onChange={(e: any) =>
                      handleChangeMonthYear(
                        parseInt(e.target.value, 10),
                        month + 1
                      )
                    }
                    className="bg-transparent text-[25px] font-bold focus:outline-none cursor-pointer hidden-appearance"
                  >
                    {[
                      baseDate.getFullYear() - 1,
                      baseDate.getFullYear(),
                      baseDate.getFullYear() + 1,
                    ].map((y) => (
                      <option key={y} value={y} className="text-black">
                        {y}年
                      </option>
                    ))}
                  </select>
                  <select
                    value={month + 1}
                    onChange={(e: any) =>
                      handleChangeMonthYear(year, parseInt(e.target.value, 10))
                    }
                    className="bg-transparent text-[25px] font-bold focus:outline-none cursor-pointer hidden-appearance"
                  >
                    {Array.from({ length: 12 }, (_, i) => i + 1).map((m) => (
                      <option key={m} value={m} className="text-black">
                        {m}月
                      </option>
                    ))}
                  </select>
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
    </Card>
  );
};

export default Calendar;
