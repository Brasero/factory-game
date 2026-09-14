import {afterEach, describe, expect, it, vi} from "vitest";
import {TickLoop} from "./TickLoop";

afterEach(() => { vi.useRealTimers(); });
describe("TickLoop", () => {
  it("starts once, pauses and resumes without orphan timers", () => {
    vi.useFakeTimers();
    const loop = new TickLoop();
    const tick = vi.fn();
    loop.start(tick, 100);
    loop.start(tick, 100);
    vi.advanceTimersByTime(500);
    expect(tick).toHaveBeenCalledTimes(5);
    loop.stop(); loop.stop();
    expect(vi.getTimerCount()).toBe(0);
    vi.advanceTimersByTime(500);
    expect(tick).toHaveBeenCalledTimes(5);
    loop.start(tick, 100);
    vi.advanceTimersByTime(100);
    expect(tick).toHaveBeenCalledTimes(6);
    loop.stop();
  });
});
