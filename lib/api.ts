export const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/api";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem("token");
}

export function getUser(): { id: string; email: string; name: string; role: string } | null {
  if (typeof window === "undefined") return null;
  const raw = window.localStorage.getItem("user");
  if (!raw) return null;
  try {
    return JSON.parse(raw) as { id: string; email: string; name: string; role: string };
  } catch {
    return null;
  }
}

export type ApiPagination = {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

export type ApiResponse<T> = {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: ApiPagination;
};

async function apiRequest<T>(path: string, options: RequestInit = {}) {
  const token = getToken();
  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers ?? {}),
    },
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.localStorage.removeItem("token");
    window.localStorage.removeItem("user");
    if (window.location.pathname !== "/") {
      window.location.assign("/");
    }
  }

  if (res.status === 204) {
    return { success: true } as ApiResponse<T>;
  }

  const json = (await res.json()) as ApiResponse<T>;
  if (!json.success) {
    throw new Error(
      json.message ? `${json.message} (${path})` : `Terjadi kesalahan (${path})`
    );
  }
  return json;
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const json = await apiRequest<T>(path, options);
  return json.data as T;
}

export async function apiFetchFull<T>(
  path: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  return apiRequest<T>(path, options);
}
