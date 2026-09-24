import { setupWorker } from 'msw/browser';
import { handlers } from '@/mocks/handlers';

const worker = setupWorker(...handlers);
let startPromise: Promise<void> | null = null;

export function startMockWorker() {
  startPromise ??= worker
    .start({
      serviceWorker: { url: '/mockServiceWorker.js' },
      onUnhandledRequest: 'bypass',
    })
    .then(() => undefined);
  return startPromise;
}
