export type UserRole = 'admin' | 'manager' | 'viewer';
export type ItemStatus = 'in_stock' | 'low_stock' | 'ordered' | 'discontinued';
export type AuditAction = 'create' | 'update' | 'delete' | 'status_change';

export interface Profile {
  id: string;
  full_name: string | null;
  role: UserRole;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  name: string;
  description: string | null;
  color: string;
  created_by: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  description: string | null;
  sku: string;
  quantity: number;
  min_quantity: number;
  unit: string;
  category_id: string | null;
  status: ItemStatus;
  cost_price: number | null;
  sell_price: number | null;
  location: string | null;
  image_url: string | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
  category?: Category;
  created_by_profile?: Profile;
  updated_by_profile?: Profile;
}

export interface AuditLog {
  id: string;
  user_id: string | null;
  action: AuditAction;
  entity_type: string;
  entity_id: string | null;
  old_values: Record<string, unknown> | null;
  new_values: Record<string, unknown> | null;
  created_at: string;
  user?: Profile;
}

export interface StockSnapshot {
  id: string;
  item_id: string;
  quantity: number;
  snapshot_date: string;
  created_at: string;
}

export interface ApiResponse<T> {
  data: T;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DashboardStats {
  totalItems: number;
  lowStockItems: number;
  totalCategories: number;
  totalValue: number;
  recentActivity: AuditLog[];
  statusBreakdown: { status: ItemStatus; count: number }[];
}

export interface ForecastData {
  itemId: string;
  itemName: string;
  currentQuantity: number;
  minQuantity: number;
  avgDailyConsumption: number;
  predictedDaysUntilStockout: number;
  reorderSuggested: boolean;
  trendData: { date: string; quantity: number; predicted?: number }[];
}

export interface TrendData {
  date: string;
  totalQuantity: number;
  totalValue: number;
  lowStockCount: number;
}

export interface InventoryFilters {
  search?: string;
  category_id?: string;
  status?: ItemStatus;
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  full_name: string;
}
