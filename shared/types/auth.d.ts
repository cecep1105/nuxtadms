/**
 * Augmentasi tipe UserSession bawaan nuxt-auth-utils -- bentuknya SAMA
 * PERSIS dgn DjangoUser versi Next.js (types/next-auth.d.ts), supaya
 * porting halaman/komponen antar keduanya minim gesekan tipe. Field
 * accessToken/refreshToken/accessTokenExpires DISENGAJA ikut masuk
 * sesi (dibaca client via useUserSession()) -- SAMA pola dgn NextAuth
 * versi Next.js (browser fetch LANGSUNG ke Django pakai Bearer token,
 * BUKAN proxy lewat server Nuxt utk setiap panggilan API).
 */
interface DjangoUser {
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
  can_transfer_finger: boolean
  can_view_attendance_recap: boolean
  can_view_attendance_recap_kantin: boolean
  can_view_attendance_recap_driver: boolean
  can_view_dhcp_lease: boolean
  can_view_fwfilter: boolean
  can_view_netwatch: boolean
  can_view_ad_users: boolean
  can_view_ad_locked_users: boolean
  can_view_ad_dns: boolean
  can_view_ad_groups: boolean
  can_view_zentyal_users: boolean
  can_view_zentyal_groups: boolean
  can_view_cloudflare: boolean
  can_view_itinfra: boolean
  can_view_idcard: boolean
  can_view_active_device: boolean
  has_employee_link: boolean
}

declare module "#auth-utils" {
  interface User extends DjangoUser {}

  interface UserSession {
    accessToken: string
    refreshToken: string
    accessTokenExpires: number
    error?: "RefreshTokenError"
  }
}

export {}
