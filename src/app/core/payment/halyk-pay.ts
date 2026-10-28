import { HalykPayment } from '../api/models';

interface HalykGlobal {
  pay(params: Record<string, unknown>): unknown;
}

declare global {
  interface Window {
    halyk?: HalykGlobal;
  }
}

const loaded = new Map<string, Promise<void>>();

function loadScript(url: string): Promise<void> {
  let promise = loaded.get(url);
  if (!promise) {
    promise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script');
      script.src = url;
      script.async = true;
      script.onload = () => resolve();
      script.onerror = () => {
        loaded.delete(url);
        reject(new Error('payment-script'));
      };
      document.head.appendChild(script);
    });
    loaded.set(url, promise);
  }
  return promise;
}

/**
 * Переход на платёжную страницу Halyk ePay: скрипт банка собирает ссылку из параметров,
 * которые подготовил наш бэкенд (токен на конкретный счёт). Обычно скрипт сам делает
 * переход; если он вернул ссылку — переходим по ней.
 */
export async function redirectToHalyk(data: HalykPayment): Promise<void> {
  await loadScript(data.scriptUrl);
  const halyk = window.halyk;
  if (!halyk?.pay) {
    throw new Error('payment-script');
  }
  const result = halyk.pay(data.payment);
  if (typeof result === 'string' && result.startsWith('http')) {
    window.location.href = result;
  }
}
