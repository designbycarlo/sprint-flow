const PRESERVE_KEYS = ['theme'];

export async function clearClientCache(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const preserved: Record<string, string> = {};
    for (const key of PRESERVE_KEYS) {
      const value = window.localStorage.getItem(key);
      if (value !== null) preserved[key] = value;
    }
    window.localStorage.clear();
    for (const [key, value] of Object.entries(preserved)) {
      window.localStorage.setItem(key, value);
    }
  } catch {
    // localStorage unavailable; ignore
  }

  try {
    window.sessionStorage.clear();
  } catch {
    // sessionStorage unavailable; ignore
  }

  try {
    if ('caches' in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch {
    // Cache Storage unavailable; ignore
  }
}
