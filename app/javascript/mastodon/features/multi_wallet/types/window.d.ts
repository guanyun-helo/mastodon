import { Window as KeplrWindow } from '@keplr-wallet/types';

interface LeapWindow {
  leap: any;
}

declare global {
  interface Window extends KeplrWindow, LeapWindow {
    cosmostation: {
      cosmos: {
        request: (message: { method: string; params?: unknown }) => Promise<T>;
        on: (
          eventName: string,
          eventHandler: (event?: unknown) => void
        ) => unknown;
        off: (handler: unknown) => void;
      };
    };
  }
}
