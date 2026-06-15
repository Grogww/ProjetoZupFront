// Cliente HTTP central para o backend Node/Express (ProjetoZup-main).
// Toda chamada usa import.meta.env.VITE_API_BASE_URL — nunca URL fixa.
// Lida com Bearer token, refresh automático em 401 e upload multipart.

const ACCESS_KEY = "zup_access_token";
const REFRESH_KEY = "zup_refresh_token";

const BASE_URL = (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/+$/, "") || "";

if (!BASE_URL && typeof window !== "undefined") {
  // eslint-disable-next-line no-console
  console.warn("[api] VITE_API_BASE_URL não está definida. Configure no .env (ex.: http://localhost:3333/api)");
}

export const tokens = {
  get access() { return localStorage.getItem(ACCESS_KEY); },
  get refresh() { return localStorage.getItem(REFRESH_KEY); },
  set(access: string | null, refresh: string | null) {
    if (access) localStorage.setItem(ACCESS_KEY, access); else localStorage.removeItem(ACCESS_KEY);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh); else localStorage.removeItem(REFRESH_KEY);
  },
  clear() {
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  },
};

export class ApiError extends Error {
  status: number;
  data: any;
  constructor(message: string, status: number, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
  }
}

type Options = {
  method?: string;
  body?: any;
  query?: Record<string, string | number | boolean | undefined | null>;
  auth?: boolean; // default true
  headers?: Record<string, string>;
  signal?: AbortSignal;
  multipart?: boolean;
  _noRetry?: boolean;
};

let refreshing: Promise<string | null> | null = null;

async function doRefresh(): Promise<string | null> {
  if (refreshing) return refreshing;
  const rt = tokens.refresh;
  if (!rt) return null;
  refreshing = (async () => {
    try {
      const r = await fetch(`${BASE_URL}/auth/refresh`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh_token: rt }),
      });
      if (!r.ok) { tokens.clear(); return null; }
      const data = await r.json();
      const access = data.access_token ?? data.session?.access_token ?? null;
      const refresh = data.refresh_token ?? data.session?.refresh_token ?? rt;
      tokens.set(access, refresh);
      return access;
    } catch {
      tokens.clear();
      return null;
    } finally {
      refreshing = null;
    }
  })();
  return refreshing;
}

function buildUrl(path: string, query?: Options["query"]) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const url = `${BASE_URL}${p}`;
  if (!query) return url;
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(query)) {
    if (v === undefined || v === null) continue;
    qs.append(k, String(v));
  }
  const s = qs.toString();
  return s ? `${url}?${s}` : url;
}

export async function request<T = any>(path: string, opts: Options = {}): Promise<T> {
  const { method = "GET", body, query, auth = true, headers = {}, signal, multipart, _noRetry } = opts;

  const finalHeaders: Record<string, string> = { Accept: "application/json", ...headers };
  if (auth) {
    const t = tokens.access;
    if (t) finalHeaders.Authorization = `Bearer ${t}`;
  }

  let payload: BodyInit | undefined;
  if (body !== undefined && body !== null) {
    if (multipart) {
      payload = body as FormData;
    } else {
      finalHeaders["Content-Type"] = "application/json";
      payload = JSON.stringify(body);
    }
  }

  const res = await fetch(buildUrl(path, query), { method, headers: finalHeaders, body: payload, signal });

  if (res.status === 401 && auth && !_noRetry) {
    const newToken = await doRefresh();
    if (newToken) return request<T>(path, { ...opts, _noRetry: true });
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const data = isJson ? await res.json().catch(() => null) : await res.text().catch(() => null);

  if (!res.ok) {
    const msg = (data && typeof data === "object" && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new ApiError(String(msg), res.status, data);
  }
  return data as T;
}

export const api = {
  get: <T = any>(path: string, opts?: Omit<Options, "method" | "body">) => request<T>(path, { ...opts, method: "GET" }),
  post: <T = any>(path: string, body?: any, opts?: Omit<Options, "method" | "body">) =>
    request<T>(path, { ...opts, method: "POST", body }),
  patch: <T = any>(path: string, body?: any, opts?: Omit<Options, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PATCH", body }),
  put: <T = any>(path: string, body?: any, opts?: Omit<Options, "method" | "body">) =>
    request<T>(path, { ...opts, method: "PUT", body }),
  delete: <T = any>(path: string, opts?: Omit<Options, "method" | "body">) =>
    request<T>(path, { ...opts, method: "DELETE" }),
  baseUrl: BASE_URL,
};
