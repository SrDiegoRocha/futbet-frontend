import { HttpParams } from '@angular/common/http';

export function toHttpParams(
  source: Readonly<Record<string, unknown>> | object | null | undefined,
): HttpParams {
  let params = new HttpParams();
  if (!source) return params;
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    if (value === null || value === undefined) continue;
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== null && item !== undefined) {
          params = params.append(key, String(item));
        }
      }
    } else {
      params = params.set(key, String(value));
    }
  }
  return params;
}
