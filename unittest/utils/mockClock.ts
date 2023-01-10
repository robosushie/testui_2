/**
 * Mocked Clock for unit tests.  Uses jest fake timers to 'move the clock forward' and keeps track
 * of what the current time is.
 */
export interface MockClock {
  /**
   * Get the current time.  This will be whatever the time the mocked clock was created with
   * plus all of the cumulative waits called on it.
   */
  getCurrentTime(): number;

  /**
   * Ticks the mock clocks internal time, as well as running all mocked timers scheduled during the specified duration.
   * User must await or promise chain the result of this function.
   */
  tick(ms?: number): Promise<void>;

  /**
   * Wait for a condition to be true.
   *
   * @param tickClock
   *  true iff you want to tick the clock as part of the waiting process.  Ticking the clock is necessary if you
   *  need timers/intervals to run as part of your waiting.  defaults to false.
   *
   * @param maxWait
   *  Maximum number of event loops/clock ticks to wait.  defaults to 5000.
   */
  waitFor(condition: () => boolean, tickClock?: boolean, maxWait?: number): Promise<void>;
}

/**
 * Mock the system clock using jest.
 *
 * This sets up using fake timers in jest, and provides an interface to tick them.  It's
 * preferable to using 'runTimersToTime' directly, because jest timers don't actually
 * flush promises: https://stackoverflow.com/a/51132058
 *
 * Additionally, this keeps track of the 'current time', so that it can be used in conjunction
 * with mocking Date.now (or whatever mechanism code is using to get current times)
 */
export default function mockClock(startTime?: number): MockClock {
  let currentTime = startTime !== undefined ? startTime : Date.now();
  jest.useFakeTimers();
  const tick = async (ms: number = 1): Promise<void> => {
    for (let i = 0; i < ms; i++) {
      currentTime++, jest.runTimersToTime(1);
      await Promise.resolve();
    }
  };

  return {
    tick,
    getCurrentTime: () => currentTime,
    waitFor: async (condition: () => boolean, tickClock = false, maxWait = 5000): Promise<void> => {
      for (let i = 0; i < maxWait; i++) {
        if (condition()) {
          return;
        }

        if (tickClock) {
          await tick();
        } else {
          await Promise.resolve();
        }
      }

      throw Error("Timed out waiting for condition");
    },
  };
}
