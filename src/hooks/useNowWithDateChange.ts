import { useEffect, useRef, useState } from "react";
import { subscribeMinuteTick } from "../utils/minuteTicker";

export const useNowWithDateChange = () => {
  const [now, setNow] = useState(new Date() as Date);
  const [dateChangeToken, setDateChangeToken] = useState(0 as number);
  const lastDateRef = useRef(now as Date);

  useEffect(() => {
    const unsubscribe = subscribeMinuteTick((nextNow: Date) => {
      const prev = lastDateRef.current;
      if (
        prev.getFullYear() !== nextNow.getFullYear() ||
        prev.getMonth() !== nextNow.getMonth() ||
        prev.getDate() !== nextNow.getDate()
      ) {
        setDateChangeToken((prevToken: number) => prevToken + 1);
      }
      lastDateRef.current = nextNow;
      setNow(nextNow);
    });

    return unsubscribe;
  }, []);

  return { now, dateChangeToken } as const;
};
