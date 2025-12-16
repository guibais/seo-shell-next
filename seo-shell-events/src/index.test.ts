import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sendEvent, watchEvent } from "./index";

describe("sendEvent", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    globalThis.window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
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
    const win = globalThis.window;
    (globalThis as Record<string, unknown>).window = undefined;

    expect(() => sendEvent("test", { ok: true })).not.toThrow();

    globalThis.window = win;
  });
});

describe("watchEvent", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    globalThis.window = {
      dispatchEvent: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("adds event listener", () => {
    const handler = vi.fn();

    watchEvent("test", handler);

    expect(window.addEventListener).toHaveBeenCalledWith(
      "seo-shell:test",
      expect.any(Function)
    );
  });

  it("returns unsubscribe function and removes listener", () => {
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

    const addEventListenerMock =
      window.addEventListener as unknown as ReturnType<typeof vi.fn>;

    addEventListenerMock.mockImplementation(
      (_name: string, listener: EventListenerOrEventListenerObject) => {
        capturedListener = listener as (event: Event) => void;
      }
    );

    watchEvent("test", handler);

    const event = new CustomEvent("seo-shell:test", {
      detail: { foo: "bar" },
    });

    const listener = capturedListener;
    if (!listener) {
      throw new Error("listener_not_registered");
    }
    listener(event);

    expect(handler).toHaveBeenCalledWith({ foo: "bar" });
  });

  it("returns noop unsubscribe when window is undefined", () => {
    const win = globalThis.window;
    (globalThis as Record<string, unknown>).window = undefined;

    const unsubscribe = watchEvent("test", vi.fn());

    expect(() => unsubscribe()).not.toThrow();

    globalThis.window = win;
  });
});
