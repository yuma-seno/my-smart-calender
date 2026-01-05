import { useEffect, useRef, useState } from "react";

export const useNowWithDateChange = () => {
  const [now, setNow] = useState(new Date() as Date);
  const [dateChangeToken, setDateChangeToken] = useState(0 as number);
  const lastDateRef = useRef(now as Date);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNow(new Date() as Date);
    }, 60 * 1000);
    return () => {
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    const prev = lastDateRef.current;
    if (
      prev.getFullYear() !== now.getFullYear() ||
      prev.getMonth() !== now.getMonth() ||
      prev.getDate() !== now.getDate()
    ) {
      setDateChangeToken((prevToken: number) => prevToken + 1);
    }
    lastDateRef.current = now;
  }, [now]);

  return { now, dateChangeToken } as const;
};
