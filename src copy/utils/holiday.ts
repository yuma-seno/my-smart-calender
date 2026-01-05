export const getHolidayName = (date: Date) => {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  const d = date.getDate();
  const week = Math.floor((d - 1) / 7) + 1;
  const day = date.getDay();

  if (m === 1 && d === 1) return "元日";
  if (m === 2 && d === 11) return "建国記念の日";
  if (m === 2 && d === 23) return "天皇誕生日";
  if (m === 4 && d === 29) return "昭和の日";
  if (m === 5 && d === 3) return "憲法記念日";
  if (m === 5 && d === 4) return "みどりの日";
  if (m === 5 && d === 5) return "こどもの日";
  if (m === 8 && d === 11) return "山の日";
  if (m === 11 && d === 3) return "文化の日";
  if (m === 11 && d === 23) return "勤労感謝の日";

  if (m === 1 && day === 1 && week === 2) return "成人の日";
  if (m === 7 && day === 1 && week === 3) return "海の日";
  if (m === 9 && day === 1 && week === 3) return "敬老の日";
  if (m === 10 && day === 1 && week === 2) return "スポーツの日";

  const equinoxSpring = Math.floor(
    20.8431 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4)
  );
  if (m === 3 && d === equinoxSpring) return "春分の日";
  const equinoxAutumn = Math.floor(
    23.2488 + 0.242194 * (y - 1980) - Math.floor((y - 1980) / 4)
  );
  if (m === 9 && d === equinoxAutumn) return "秋分の日";

  if (day === 1) {
    const yesterday = new Date(date);
    yesterday.setDate(d - 1);
    if (getHolidayName(yesterday)) return "振替休日";
  }

  return null;
};
