export function withTimeout(promise, timeoutMs, label) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(
      () => reject(new Error(`${label} excedió ${timeoutMs} ms`)),
      timeoutMs,
    );
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}
