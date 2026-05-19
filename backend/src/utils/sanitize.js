import xss from 'xss';

export function sanitizeString(s) {
  if (typeof s !== 'string') return s;
  return xss(s, { whiteList: {}, stripIgnoreTag: true });
}

export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const [k, v] of Object.entries(obj)) {
    if (typeof v === 'string') out[k] = sanitizeString(v);
    else if (v && typeof v === 'object') out[k] = sanitizeObject(v);
    else out[k] = v;
  }
  return out;
}
