import { setupWorker } from 'msw/browser';
import { handlers } from '@/mocks/handlers';

const worker = setupWorker(...handlers);
let startPromise: Promise<void> | null = null;

export function startMockWorker() {
  startPromise ??= worker
    .start({
      serviceWorker: { url: '/mockServiceWorker.js' },
      onUnhandledRequest(request, print) {
        if (new URL(request.url).pathname.startsWith('/api/')) print.error();
      },
    })
    .then(() => undefined);
  return startPromise;
}
