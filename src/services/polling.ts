// src/services/polling.ts
export function createPoller(intervalMs: number) {
  let stopped = false;
  let timer: number | null = null;

  const stop = () => {
    stopped = true;
    if (timer) {
      window.clearTimeout(timer);
      timer = null;
    }
  };

  const start = async (fn: () => Promise<boolean | void>) => {
    stopped = false;
    const tick = async () => {
      if (stopped) return;
      try {
        const done = (await fn()) === true;
        if (!done && !stopped) {
          timer = window.setTimeout(tick, intervalMs);
        }
      } catch {
        // swallow; try again unless stopped
        if (!stopped) timer = window.setTimeout(tick, intervalMs);
      }
    };
    tick();
    return stop;
  };

  return { start, stop };
}
