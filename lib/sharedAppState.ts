import type { User, Client, Product, Order, Task, ClockLog } from '../types';

export interface SharedAppData {
  users: User[];
  clients: Client[];
  products: Product[];
  orders: Order[];
  tasks: Task[];
  clockLogs: ClockLog[];
}

export interface SharedAppStatePayload {
  version: number;
  updatedAt: string | null;
  data: SharedAppData | null;
}

const SHARED_STATE_ENDPOINT = '/.netlify/functions/app-state';

function isJsonResponse(response: Response) {
  return response.headers.get('content-type')?.includes('application/json');
}

export async function loadSharedAppState(): Promise<SharedAppStatePayload | null> {
  const response = await fetch(SHARED_STATE_ENDPOINT, {
    method: 'GET',
    cache: 'no-store',
  });

  if (!response.ok || !isJsonResponse(response)) {
    return null;
  }

  const payload = (await response.json()) as SharedAppStatePayload;
  return payload?.data ? payload : null;
}

export async function saveSharedAppState(data: SharedAppData): Promise<SharedAppStatePayload | null> {
  const response = await fetch(SHARED_STATE_ENDPOINT, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });

  if (!response.ok || !isJsonResponse(response)) {
    return null;
  }

  return (await response.json()) as SharedAppStatePayload;
}

function mergeById<T extends { id: string | number }>(localItems: T[], sharedItems: T[]): T[] {
  const merged = new Map<string | number, T>();
  localItems.forEach(item => merged.set(item.id, item));
  sharedItems.forEach(item => merged.set(item.id, item));
  return Array.from(merged.values());
}

/** Shared data wins on conflicts, while local-only records are preserved for first migration. */
export function mergeSharedAppData(localData: SharedAppData, sharedData: SharedAppData): SharedAppData {
  return {
    users: mergeById(localData.users, sharedData.users),
    clients: mergeById(localData.clients, sharedData.clients),
    products: mergeById(localData.products, sharedData.products),
    orders: mergeById(localData.orders, sharedData.orders),
    tasks: mergeById(localData.tasks, sharedData.tasks),
    clockLogs: mergeById(localData.clockLogs, sharedData.clockLogs),
  };
}
