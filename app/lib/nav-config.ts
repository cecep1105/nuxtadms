import type { Component } from "vue"
import { LayoutDashboard, Users, HardDrive, UserCircle, KeyRound } from "@lucide/vue"

export interface NavItem {
  title: string
  href?: string
  icon: Component
  children?: NavItem[]
}

export interface NavGroup {
  label: string
  icon?: Component
  items: NavItem[]
}

/**
 * Starter -- cuma 2 modul inti (Dashboard, Active Device) sesuai
 * kesepakatan tahap fondasi. Struktur TIPE-nya SAMA PERSIS dgn
 * nav-config.ts versi Next.js (NavGroup > NavItem, item.children utk
 * grup bertingkat) supaya modul berikutnya gampang ditambah dgn pola
 * yang sudah ada, bukan diciptakan ulang tiap kali.
 */
export const navGroups: NavGroup[] = [
  {
    label: "Utama",
    items: [
      { title: "Dashboard", href: "/", icon: LayoutDashboard },
    ],
  },
  {
    label: "iClock — Device & Absensi",
    items: [
      { title: "Active Device", href: "/iclock/active-devices", icon: HardDrive },
    ],
  },
  {
    label: "Akses",
    items: [
      { title: "Manajemen User", href: "/users", icon: Users },
    ],
  },
]

/**
 * Nav utk akun BUKAN staff/superuser -- SAMA konsep dgn versi Next.js,
 * sidebar portal memang lebih sederhana (portal sendiri berbasis kartu
 * di halaman /portal, bukan sidebar penuh).
 */
export const nonStaffNavGroups: NavGroup[] = [
  {
    label: "Akun Saya",
    items: [
      { title: "Profil Saya", href: "/profile", icon: UserCircle },
      { title: "Ganti Password", href: "/profile/password", icon: KeyRound },
    ],
  },
]
