import type { AnalyticsRecord } from './contract';
export type Transport = (event: AnalyticsRecord) => void | Promise<void>;
export const noop: Transport = () => {};
declare global {
  interface Window {
    __ccEvents?: AnalyticsRecord[];
  }
}
export function debugTransport(target: Window = window): Transport {
  target.__ccEvents = [];
  return (event) => {
    target.__ccEvents!.push(event);
    console.debug('[cc analytics]', event);
  };
}
/** D5: no provider. Debug is enabled by bootstrap only in dev/test-preview builds. */
export function createTransport(search: string): Transport {
  return new URLSearchParams(search).get('analytics') === 'debug' ? debugTransport() : noop;
}
