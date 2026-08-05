/**
 * Tipe data API -- starter set utk modul fondasi (Dashboard, Users).
 * Ditambah bertahap seiring modul baru diporting, SAMA pola dgn
 * types/api.ts versi Next.js -- di fondasi ini SENGAJA cuma bagian
 * yg relevan dulu.
 */

export interface Paginated<T> {
  count: number
  next: string | null
  previous: string | null
  results: T[]
}

/** Bentuk pagination KHUSUS UserViewSet -- BEDA dari Paginated<T> standar. */
export interface UserListPaginated<T> {
  count: number
  num_pages: number
  current_page: number
  results: T[]
}

export interface Department {
  DeptID: number
  DeptName: string
}

export interface ActiveDevice {
  SN: string
  Alias: string
  DeviceName: string | null
  DeptID: number | null
  DeptName: string | null
  Function: string | null
  IPAddress: string | null
  MAC: string | null
  TZAdj: number | null
  State: number
  LastActivity: string | null
  LastData: string | null
  PushVersion: string | null
  LogStamp: string | null
  OpLogStamp: string | null
  PhotoStamp: string | null
  ErrorDelay: number
  Delay: number
  TransTimes: string | null
  TransInterval: number
  UpdateDB: string
  Realtime: boolean
  Encrypt: boolean
}

export interface DeviceLiveUser {
  user_id: string
  name: string
  privilege: number
  password?: string
  group_id?: string
  card?: number
}

export interface DeviceLiveLog {
  user_id: string
  timestamp: string | null
  status: number | null
  status_label: string
  punch: number | null
  punch_label: string
}

export interface DeviceFunctionChoice {
  value: string
  label: string
}

export interface EmployeeSearchResult {
  id: number
  pin: string
  name: string
}

export interface FeaturePermissionItem {
  codename: string
  label: string
  granted: boolean
}

export interface FeaturePermissionsResponse {
  user_id: number
  username?: string
  permissions: FeaturePermissionItem[]
}
export interface DjangoApiUser {
  id: number
  username: string
  email: string
  first_name: string
  last_name: string
  full_name: string
  phone_number: string | null
  department: string | null
  title: string | null
  auth_source: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  must_change_password: boolean
  emp_pin: string | null
  emp_name: string | null
  has_employee_link: boolean
}
