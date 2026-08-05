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
