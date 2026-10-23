const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://8d037e55-ee42-46aa-9371-a36de024c7dd-00-2m01srlp9rho5.pike.replit.dev";

export async function secureFetch(url: string, options: any = {}) {
  const token = typeof window !== "undefined" ? localStorage.getItem("access_token") : null;
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...options.headers,
  };
  const fullUrl = url.startsWith("http") ? url : `${API_BASE}${url}`;
  const res = await fetch(fullUrl, {
    ...options,
    credentials: "include",
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });
  if (res.status === 401 && typeof window !== "undefined") {
    localStorage.removeItem("access_token");
    window.location.href = "/login";
  }
  if (!res.ok) {
    console.error("API Error:", res.status);
    throw new Error("Something went wrong. Please try again.");
  }
  return res;
}

export const apiClient = {
  get: (url: string, options?: any) => secureFetch(url, { ...options, method: "GET" }),
  post: (url: string, body?: unknown, options?: any) => secureFetch(url, { ...options, method: "POST", body: body as BodyInit }),
  put: (url: string, body?: unknown, options?: any) => secureFetch(url, { ...options, method: "PUT", body: body as BodyInit }),
  patch: (url: string, body?: unknown, options?: any) => secureFetch(url, { ...options, method: "PATCH", body: body as BodyInit }),
  delete: (url: string, options?: any) => secureFetch(url, { ...options, method: "DELETE" }),
};

export default apiClient;
