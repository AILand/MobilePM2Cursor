const API_BASE = "/api";

export interface User {
  id: number;
  email: string;
  name: string;
  role: "SystemAdmin" | "OfficeStaff" | "TradePerson";
  deletedAt?: string | null;
}

export interface Client {
  id: number;
  name: string;
  contact?: string | null;
  deletedAt?: string | null;
}

export interface TradeRole {
  id: number;
  name: string;
}

export interface TradePerson {
  id: number;
  userId: number;
  user: User;
  roles: Array<{ tradeRole: TradeRole }>;
  deletedAt?: string | null;
}

export interface Job {
  id: number;
  name: string;
  description?: string | null;
  clientId: number;
  client: Client;
  materials?: string | null;
  requirements: Array<{
    id: number;
    tradeRoleId: number;
    tradeRole: TradeRole;
    requiredSlots: number;
  }>;
  deletedAt?: string | null;
}

export interface Allocation {
  id: number;
  jobId: number;
  tradePersonId: number;
  date: string;
  period: "AM" | "PM";
  job: Job & { client: Client };
  tradePerson: TradePerson & { user: User };
}

export interface Note {
  id: number;
  content: string;
  authorId: number;
  author: User;
  clientId?: number | null;
  client?: Client | null;
  tradePersonId?: number | null;
  tradePerson?: TradePerson | null;
  allocationId?: number | null;
  createdAt: string;
}

async function request<T>(
  endpoint: string,
  options?: RequestInit,
): Promise<T> {
  const token = localStorage.getItem("token");
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
    ...options?.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: "Unknown error" }));
    throw new Error(error.error || `HTTP ${response.status}`);
  }

  return response.json();
}

export const api = {
  auth: {
    login: (email: string, password: string) =>
      request<{ token: string; user: User }>("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      }),
    me: () => request<User>("/auth/me"),
  },
  users: {
    list: () => request<User[]>("/users"),
    get: (id: number) => request<User>(`/users/${id}`),
    create: (data: { email: string; name: string; password: string; role: User["role"] }) =>
      request<User>("/users", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ email: string; name: string; role: User["role"] }>) =>
      request<User>(`/users/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<User>(`/users/${id}`, {
        method: "DELETE",
      }),
  },
  clients: {
    list: () => request<Client[]>("/clients"),
    get: (id: number) => request<Client>(`/clients/${id}`),
    create: (data: { name: string; contact?: string }) =>
      request<Client>("/clients", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{ name: string; contact?: string }>) =>
      request<Client>(`/clients/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<Client>(`/clients/${id}`, {
        method: "DELETE",
      }),
  },
  tradies: {
    list: () => request<TradePerson[]>("/tradies"),
    get: (id: number) => request<TradePerson>(`/tradies/${id}`),
    create: (data: { userId: number; tradeRoleIds: number[] }) =>
      request<TradePerson>("/tradies", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: { tradeRoleIds: number[] }) =>
      request<TradePerson>(`/tradies/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<TradePerson>(`/tradies/${id}`, {
        method: "DELETE",
      }),
    roles: () => request<TradeRole[]>("/tradies/roles/list"),
  },
  jobs: {
    list: () => request<Job[]>("/jobs"),
    get: (id: number) => request<Job>(`/jobs/${id}`),
    create: (data: {
      name: string;
      description?: string;
      clientId: number;
      materials?: string;
      requirements: Array<{ tradeRoleId: number; requiredSlots: number }>;
    }) =>
      request<Job>("/jobs", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    update: (id: number, data: Partial<{
      name: string;
      description?: string;
      clientId: number;
      materials?: string;
      requirements: Array<{ tradeRoleId: number; requiredSlots: number }>;
    }>) =>
      request<Job>(`/jobs/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<Job>(`/jobs/${id}`, {
        method: "DELETE",
      }),
  },
  schedule: {
    grid: (weekStart?: string) =>
      request<{ weekStart: string; tradies: Array<TradePerson & { allocations: Allocation[] }> }>(
        `/schedule/grid${weekStart ? `?weekStart=${weekStart}` : ""}`,
      ),
    gantt: (tradePersonId: number, weekStart?: string) =>
      request<{ weekStart: string; allocations: Allocation[] }>(
        `/schedule/gantt/${tradePersonId}${weekStart ? `?weekStart=${weekStart}` : ""}`,
      ),
    mySchedule: (weekStart?: string) =>
      request<{ weekStart: string; allocations: Allocation[] }>(
        `/schedule/my-schedule${weekStart ? `?weekStart=${weekStart}` : ""}`,
      ),
    create: (data: { jobId: number; tradePersonId: number; date: string; period: "AM" | "PM" }) =>
      request<Allocation>("/schedule", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    delete: (id: number) =>
      request<Allocation>(`/schedule/${id}`, {
        method: "DELETE",
      }),
  },
  notes: {
    list: (params?: { clientId?: number; tradePersonId?: number; allocationId?: number }) => {
      const query = new URLSearchParams();
      if (params?.clientId) query.append("clientId", params.clientId.toString());
      if (params?.tradePersonId) query.append("tradePersonId", params.tradePersonId.toString());
      if (params?.allocationId) query.append("allocationId", params.allocationId.toString());
      return request<Note[]>(`/notes${query.toString() ? `?${query}` : ""}`);
    },
    create: (data: {
      content: string;
      clientId?: number;
      tradePersonId?: number;
      allocationId?: number;
    }) =>
      request<Note>("/notes", {
        method: "POST",
        body: JSON.stringify(data),
      }),
  },
};



