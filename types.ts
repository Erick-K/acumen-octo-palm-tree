
export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notificationsEnabled: boolean;
  defaultPage: Page;
}

/** Primary territory / base location for sales reps and admins (Kenya). */
export interface UserWorkLocation {
  county: string;
  town: string;
  /** Optional street, building, or landmark */
  addressLine?: string;
}

export interface User {
  id: number;
  name: string;
  username: string;
  password: string;
  pinNumber?: string; // New field for business security
  role: 'Sales Representative' | 'Admin';
  avatarUrl?: string;
  isClockedIn?: boolean;
  isActive?: boolean;
  preferences?: UserPreferences;
  workLocation?: UserWorkLocation;
}

export interface ClockLog {
  id: string;
  userId: number;
  type: 'in' | 'out';
  timestamp: string;
}

export interface Visit {
  id: string;
  date: string;
  notes?: string;
}

export interface Client {
  id: number;
  name: string;
  company: string;
  companyPin?: string; // New business field for client verification
  isSupplier?: boolean; // When true, treat this company as a supplier
  supplierCategory?: string; // e.g. Packaging, Raw Materials, Transport, Services
  salesRepId: number;
  email?: string;
  phone?: string;
  location: {
    lat: number;
    lng: number;
    address: string;
  };
  visits?: Visit[];
}

export interface ProductVariation {
    name: string; // e.g., "Size", "Color"
    options: string[]; // e.g., ["S", "M", "L"], ["Red", "Blue"]
}

export interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  imageUrl?: string;
  variations?: ProductVariation[];
}

export interface OrderItem {
  productId: number;
  quantity: number;
  priceAtSale: number;
}

export interface Order {
  id: string;
  clientId: number;
  salesRepId: number;
  items: OrderItem[];
  total: number;
  status: 'Pending' | 'Shipped' | 'Delivered' | 'Cancelled';
  date: string;
  isPaid?: boolean; // Payment status: true = Paid, false/undefined = Not Paid
}

export type TaskPriority = 'Low' | 'Medium' | 'High';
export type TaskStatus = 'To-do' | 'Done';

export interface Task {
    id: string;
    title: string;
    assignedToId: number;
    dueDate: string;
    priority: TaskPriority;
    status: TaskStatus;
}

export enum Page {
  Dashboard = 'dashboard',
  Products = 'products',
  Orders = 'orders',
  Clients = 'clients',
  Tasks = 'tasks',
  Profile = 'profile',
  Users = 'users',
}
