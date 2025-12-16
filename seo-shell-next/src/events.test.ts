import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEvent, watchEvent, createEventBridge } from "./events";

describe("sendEvent", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    global.window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("dispatches custom event with payload", () => {
    sendEvent("test", { data: "value" });

    expect(window.dispatchEvent).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "seo-shell:test",
        detail: { data: "value" },
      })
    );
  });

  it("does nothing when window is undefined", () => {
    const win = global.window;
    (global as Record<string, unknown>).window = undefined;

    expect(() => sendEvent("test", {})).not.toThrow();

    global.window = win;
  });
});

describe("watchEvent", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    global.window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("adds event listener", () => {
    const handler = vi.fn();
    watchEvent("test", handler);

    expect(window.addEventListener).toHaveBeenCalledWith(
      "seo-shell:test",
      expect.any(Function)
    );
  });

  it("returns unsubscribe function", () => {
    const handler = vi.fn();
    const unsubscribe = watchEvent("test", handler);

    unsubscribe();

    expect(window.removeEventListener).toHaveBeenCalledWith(
      "seo-shell:test",
      expect.any(Function)
    );
  });

  it("calls handler with event detail", () => {
    const handler = vi.fn();
    let capturedListener: ((event: Event) => void) | null = null;

    vi.mocked(window.addEventListener).mockImplementation(
      (_name: string, listener: EventListenerOrEventListenerObject) => {
        capturedListener = listener as (event: Event) => void;
      }
    );

    watchEvent("test", handler);

    const mockEvent = new CustomEvent("seo-shell:test", {
      detail: { foo: "bar" },
    });
    capturedListener?.(mockEvent);

    expect(handler).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("returns noop when window is undefined", () => {
    const win = global.window;
    (global as Record<string, unknown>).window = undefined;

    const unsubscribe = watchEvent("test", vi.fn());
    expect(() => unsubscribe()).not.toThrow();

    global.window = win;
  });
});

describe("createEventBridge", () => {
  const originalWindow = global.window;

  beforeEach(() => {
    global.window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    global.window = originalWindow;
  });

  it("queues events", () => {
    const bridge = createEventBridge();

    bridge.queue("event1", { data: 1 });
    bridge.queue("event2", { data: 2 });

    expect(bridge.pendingEvents).toHaveLength(2);
    expect(bridge.pendingEvents[0]).toEqual({
      name: "event1",
      payload: { data: 1 },
    });
    expect(bridge.pendingEvents[1]).toEqual({
      name: "event2",
      payload: { data: 2 },
    });
  });

  it("flushes all queued events", () => {
    const bridge = createEventBridge();

    bridge.queue("event1", { data: 1 });
    bridge.queue("event2", { data: 2 });
    bridge.flush();

    expect(window.dispatchEvent).toHaveBeenCalledTimes(2);
    expect(bridge.pendingEvents).toHaveLength(0);
  });

  it("clears pending events after flush", () => {
    const bridge = createEventBridge();

    bridge.queue("event1", { data: 1 });
    bridge.flush();

    expect(bridge.pendingEvents).toHaveLength(0);
  });
});
