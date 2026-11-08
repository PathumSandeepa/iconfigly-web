export interface ApiError {
  type?: string;
  title: string;
  status: number;
  detail: string;
  fields?: Record<string, string>;
  request_id?: string;
}

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : null;
}

export async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith("/api/v1")
    ? endpoint
    : `/api/v1${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;

  const headers = new Headers(options.headers || {});

  if (!headers.has("Content-Type") && options.body && typeof options.body === "string") {
    headers.set("Content-Type", "application/json");
  }

  const method = (options.method || "GET").toUpperCase();
  if (["POST", "PUT", "PATCH", "DELETE"].includes(method)) {
    const csrfToken =
      typeof window !== "undefined"
        ? (window as unknown as { __CSRF_TOKEN__?: string }).__CSRF_TOKEN__ ||
          getCookie("iconfigly_csrf")
        : null;
    if (csrfToken && !headers.has("X-CSRF-Token")) {
      headers.set("X-CSRF-Token", csrfToken);
    }
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (res.status === 204) {
    return {} as T;
  }

  const contentType = res.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json") || contentType.includes("application/problem+json");

  if (!res.ok) {
    if (isJson) {
      const errData = (await res.json()) as ApiError;
      throw errData;
    }
    const text = await res.text();
    throw {
      title: "Request Failed",
      status: res.status,
      detail: text || res.statusText,
    } as ApiError;
  }

  if (isJson) {
    const json = await res.json();
    return json.data !== undefined ? json.data : json;
  }

  return (await res.text()) as unknown as T;
}
