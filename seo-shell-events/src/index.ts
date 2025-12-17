export type SeoShellEventPayload = Record<string, unknown>;

export type SeoShellEventHandler<T = SeoShellEventPayload> = (
  payload: T
) => void;

const EVENT_PREFIX = "seo-shell:";

export const sendEvent = <T = SeoShellEventPayload>(
  eventName: string,
  payload: T
): void => {
  if (typeof window === "undefined") {
    return;
  }

  const event = new CustomEvent(`${EVENT_PREFIX}${eventName}`, {
    detail: payload,
  });
  window.dispatchEvent(event);
};

export const watchEvent = <T = SeoShellEventPayload>(
  eventName: string,
  handler: SeoShellEventHandler<T>
): (() => void) => {
  if (typeof window === "undefined") {
    return () => {};
  }

  const listener = (event: Event) => {
    const customEvent = event as CustomEvent<T>;
    handler(customEvent.detail);
  };

  window.addEventListener(`${EVENT_PREFIX}${eventName}`, listener);

  return () => {
    window.removeEventListener(`${EVENT_PREFIX}${eventName}`, listener);
  };
};

export const getEventPayload = <T = unknown>(eventName: string): T | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const win = window as unknown as {
    __SEO_SHELL_EVENTS__?: Record<string, unknown>;
  };

  return (win.__SEO_SHELL_EVENTS__?.[eventName] as T) ?? null;
};
