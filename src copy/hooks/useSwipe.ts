import { useRef, useState } from "react";

type SwipeHandler = () => void;

interface SwipeHandlers {
  onTouchStart: (e: any) => void;
  onTouchMove: (e: any) => void;
  onTouchEnd: () => void;
  onMouseDown: (e: any) => void;
  onMouseMove: (e: any) => void;
  onMouseUp: () => void;
  onMouseLeave: () => void;
}

interface SwipeResult {
  handlers: SwipeHandlers;
  offsetX: number;
  isSwiping: boolean;
}

export const useSwipe = (
  onSwipeLeft: SwipeHandler,
  onSwipeRight: SwipeHandler
): SwipeResult => {
  const startXRef = useRef<number | null>(null);
  const lastXRef = useRef<number | null>(null);
  const [offsetX, setOffsetX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);
  const minSwipeDistance = 40;

  const start = (clientX: number) => {
    startXRef.current = clientX;
    lastXRef.current = clientX;
    setIsSwiping(true);
    setOffsetX(0);
  };

  const move = (clientX: number) => {
    if (startXRef.current == null) return;
    lastXRef.current = clientX;
    setOffsetX(clientX - startXRef.current);
  };

  const end = () => {
    if (startXRef.current == null || lastXRef.current == null) {
      setIsSwiping(false);
      setOffsetX(0);
      return;
    }
    const distance = lastXRef.current - startXRef.current;
    if (distance < -minSwipeDistance) onSwipeLeft();
    if (distance > minSwipeDistance) onSwipeRight();
    startXRef.current = null;
    lastXRef.current = null;
    setIsSwiping(false);
    setOffsetX(0);
  };

  const onTouchStart = (e: any) => {
    if (!e.targetTouches?.[0]) return;
    start(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: any) => {
    if (!e.targetTouches?.[0]) return;
    move(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    end();
  };

  const onMouseDown = (e: any) => {
    start(e.clientX);
  };

  const onMouseMove = (e: any) => {
    if (!isSwiping) return;
    move(e.clientX);
  };

  const onMouseUp = () => {
    end();
  };

  const onMouseLeave = () => {
    if (!isSwiping) return;
    end();
  };

  return {
    handlers: {
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onMouseDown,
      onMouseMove,
      onMouseUp,
      onMouseLeave,
    },
    offsetX,
    isSwiping,
  };
};
