import type { User, Client, Product, Order, Task, ClockLog, LiveLocation, AppBranding } from '../types';

export interface SharedAppData {
  resetVersion: string;
  branding: AppBranding;
  users: User[];
  clients: Client[];
  products: Product[];
  orders: Order[];
  tasks: Task[];
  clockLogs: ClockLog[];
  liveLocations: LiveLocation[];
}

export interface SharedAppStatePayload {
  version: number;
  updatedAt: string | null;
  data: SharedAppData | null;
}

const FALLBACK_SUPABASE_URL = 'https://fnabemclwkhjdcxouzhr.supabase.co';
const FALLBACK_SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZuYWJlbWNsd2toamRjeG91emhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzk3NDkyMjEsImV4cCI6MjA5NTMyNTIyMX0.4GA9tTatpI0v2OFzIs0Hc8tGqYJS5YQJcpDiLv2UM54';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL?.trim() || FALLBACK_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim() || FALLBACK_SUPABASE_ANON_KEY;
const APP_STATE_ID = 'default';
const APP_STATE_TABLE = 'app_state';

function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
}

function getSupabaseRestUrl(query = '') {
  const baseUrl = SUPABASE_URL.replace(/\/$/, '');
  return `${baseUrl}/rest/v1/${APP_STATE_TABLE}${query}`;
}

function getSupabaseHeaders(prefer?: string): HeadersInit {
  return {
    apikey: SUPABASE_ANON_KEY,
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    'Content-Type': 'application/json',
    ...(prefer ? { Prefer: prefer } : {}),
  };
}

export async function loadSharedAppState(): Promise<SharedAppStatePayload | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const params = `?id=eq.${encodeURIComponent(APP_STATE_ID)}&select=version,updated_at,data&limit=1`;
  const response = await fetch(getSupabaseRestUrl(params), {
    method: 'GET',
    headers: getSupabaseHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    console.warn('Failed to load Supabase shared state.', await response.text());
    return null;
  }

  const rows = (await response.json()) as Array<{ version?: number; updated_at?: string; data?: SharedAppData }>;
  const data = rows[0];
  if (!data?.data) return null;

  return {
    version: Number(data.version ?? 1),
    updatedAt: typeof data.updated_at === 'string' ? data.updated_at : null,
    data: normalizeSharedAppData(data.data as Partial<SharedAppData>),
  };
}

export async function saveSharedAppState(data: SharedAppData): Promise<SharedAppStatePayload | null> {
  if (!isSupabaseConfigured()) {
    return null;
  }

  const updatedAt = new Date().toISOString();
  const payload = {
    id: APP_STATE_ID,
    version: 1,
    updated_at: updatedAt,
    data,
  };

  const response = await fetch(getSupabaseRestUrl('?on_conflict=id&select=version,updated_at,data'), {
    method: 'POST',
    headers: getSupabaseHeaders('resolution=merge-duplicates,return=representation'),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    console.warn('Failed to save Supabase shared state.', await response.text());
    return null;
  }

  const rows = (await response.json()) as Array<{ version?: number; updated_at?: string; data?: SharedAppData }>;
  const saved = rows[0];
  if (!saved?.data) return null;

  return {
    version: Number(saved.version ?? 1),
    updatedAt: typeof saved.updated_at === 'string' ? saved.updated_at : updatedAt,
    data: normalizeSharedAppData(saved.data as Partial<SharedAppData>),
  };
}

function mergeById<T extends { id: string | number }>(localItems: T[], sharedItems: T[]): T[] {
  const merged = new Map<string | number, T>();
  localItems.forEach(item => merged.set(item.id, item));
  sharedItems.forEach(item => merged.set(item.id, item));
  return Array.from(merged.values());
}

/** Prefer local user records on id conflicts so newly created users are not dropped. */
export function mergeUsers(localUsers: User[], sharedUsers: User[]): User[] {
  const merged = new Map<number, User>();
  sharedUsers.forEach(user => merged.set(user.id, user));
  localUsers.forEach(user => merged.set(user.id, user));
  return Array.from(merged.values());
}

function mergeByUserId(localItems: LiveLocation[], sharedItems: LiveLocation[]): LiveLocation[] {
  const merged = new Map<number, LiveLocation>();
  localItems.forEach(item => merged.set(item.userId, item));
  sharedItems.forEach(item => merged.set(item.userId, item));
  return Array.from(merged.values());
}

/** Honour local deletions when local catalogue is a smaller subset of shared. */
export function mergeProducts(localProducts: Product[], sharedProducts: Product[]): Product[] {
  if (localProducts.length === 0) return sharedProducts;
  if (sharedProducts.length === 0) return localProducts;

  const merged = new Map<number, Product>();
  sharedProducts.forEach(product => merged.set(product.id, product));
  localProducts.forEach(product => merged.set(product.id, product));

  const localIds = new Set(localProducts.map(product => product.id));
  const sharedIds = new Set(sharedProducts.map(product => product.id));
  const sharedOnly = sharedProducts.filter(product => !localIds.has(product.id));
  const localIsStrictSubset =
    localProducts.length < sharedProducts.length &&
    localProducts.every(product => sharedIds.has(product.id));

  if (localIsStrictSubset && sharedOnly.length > 0) {
    return localProducts.map(product => merged.get(product.id)!);
  }

  const allIds = new Set([...localIds, ...sharedIds]);
  return Array.from(allIds).map(id => merged.get(id)!);
}

export function normalizeSharedAppData(data: Partial<SharedAppData>): SharedAppData {
  const resetVersion = typeof data.resetVersion === 'string' && data.resetVersion.trim().length > 0
    ? data.resetVersion.trim()
    : 'v1';
  const hasBrandingAppName = typeof data.branding?.appName === 'string';
  const branding: AppBranding = {
    appName:
      hasBrandingAppName
        ? data.branding!.appName.trim()
        : 'Acme Business Suite',
    logoUrl:
      typeof data.branding?.logoUrl === 'string' && data.branding.logoUrl.trim().length > 0
        ? data.branding.logoUrl.trim()
        : undefined,
  };
  return {
    resetVersion,
    branding,
    users: Array.isArray(data.users) ? data.users : [],
    clients: Array.isArray(data.clients) ? data.clients : [],
    products: Array.isArray(data.products) ? data.products : [],
    orders: Array.isArray(data.orders) ? data.orders : [],
    tasks: Array.isArray(data.tasks) ? data.tasks : [],
    clockLogs: Array.isArray(data.clockLogs) ? data.clockLogs : [],
    liveLocations: Array.isArray(data.liveLocations) ? data.liveLocations : [],
  };
}

const isDefaultBranding = (branding: AppBranding) =>
  branding.appName.trim() === 'Acme Business Suite' && !branding.logoUrl;

/** Shared data wins on conflicts, while local-only records are preserved for first migration. */
export function mergeSharedAppData(localData: SharedAppData, sharedData: SharedAppData): SharedAppData {
  const useLocalBranding =
    !isDefaultBranding(localData.branding) && isDefaultBranding(sharedData.branding);
  return {
    resetVersion: sharedData.resetVersion || localData.resetVersion,
    branding: useLocalBranding ? localData.branding : sharedData.branding || localData.branding,
    users: mergeUsers(localData.users, sharedData.users),
    clients: mergeById(localData.clients, sharedData.clients),
    products: mergeProducts(localData.products, sharedData.products),
    orders: mergeById(localData.orders, sharedData.orders),
    tasks: mergeById(localData.tasks, sharedData.tasks),
    clockLogs: mergeById(localData.clockLogs, sharedData.clockLogs),
    liveLocations: mergeByUserId(localData.liveLocations, sharedData.liveLocations),
  };
}
