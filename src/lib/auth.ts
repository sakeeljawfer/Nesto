const encoder = new TextEncoder();

const bytesToHex = (bytes: ArrayBuffer) =>
  [...new Uint8Array(bytes)].map((byte) => byte.toString(16).padStart(2, '0')).join('');

const fallbackHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return `fallback-${(hash >>> 0).toString(16)}`;
};

export const hashPassword = async (password: string, salt: string) => {
  const value = `${salt}:${password}`;
  if (!globalThis.crypto?.subtle) return fallbackHash(value);
  try {
    const digest = await crypto.subtle.digest('SHA-256', encoder.encode(value));
    return bytesToHex(digest);
  } catch {
    return fallbackHash(value);
  }
};

export const createSalt = () => {
  if (!globalThis.crypto?.getRandomValues) return `${Date.now()}-${Math.random()}`;
  return crypto.getRandomValues(new Uint32Array(4)).join('-');
};
