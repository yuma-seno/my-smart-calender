export type MinuteTickListener = (now: Date) => void;

type SubscribeOptions = {
  fireImmediately?: boolean;
};

type PeriodicSubscribeOptions = {
  fireImmediately?: boolean;
  alignToWallClock?: boolean;
};

const listeners = new Set<MinuteTickListener>();
let timerId: number | null = null;

const getDayKey = (now: Date): string => {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const msUntilNextMinute = (now: Date): number => {
  const elapsedMs = now.getSeconds() * 1000 + now.getMilliseconds();
  const remaining = 60_000 - elapsedMs;
  return remaining > 0 ? remaining : 0;
};

const stop = () => {
  if (timerId !== null) {
    window.clearTimeout(timerId);
    timerId = null;
  }
};

const scheduleNext = (from: Date) => {
  stop();
  const delay = msUntilNextMinute(from);
  timerId = window.setTimeout(() => {
    const now = new Date();
    listeners.forEach((listener) => {
      try {
        listener(now);
      } catch {
        // ignore listener errors
      }
    });

    if (listeners.size > 0) {
      scheduleNext(now);
    } else {
      stop();
    }
  }, delay);
};

const ensureRunning = () => {
  if (timerId !== null) return;
  scheduleNext(new Date());
};

export const subscribeMinuteTick = (
  listener: MinuteTickListener,
  options: SubscribeOptions = {}
) => {
  const { fireImmediately = true } = options;

  listeners.add(listener);
  ensureRunning();

  if (fireImmediately) {
    listener(new Date());
  }

  return () => {
    listeners.delete(listener);
    if (listeners.size === 0) {
      stop();
    }
  };
};

export const subscribePeriodic = (
  intervalMinutes: number,
  listener: MinuteTickListener,
  options: PeriodicSubscribeOptions = {}
) => {
  const { fireImmediately = true, alignToWallClock = true } = options;

  if (!Number.isFinite(intervalMinutes) || intervalMinutes <= 0) {
    throw new Error("intervalMinutes must be a positive number");
  }

  let lastKey: string | null = null;

  const handler: MinuteTickListener = (now) => {
    if (alignToWallClock && now.getMinutes() % intervalMinutes !== 0) {
      return;
    }

    const minutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const bucket = Math.floor(minutesSinceMidnight / intervalMinutes);
    const key = `${getDayKey(now)}:${bucket}`;

    if (key === lastKey) return;
    lastKey = key;
    listener(now);
  };

  const unsubscribe = subscribeMinuteTick(handler, { fireImmediately: false });

  if (fireImmediately) {
    listener(new Date());
  }

  return unsubscribe;
};
