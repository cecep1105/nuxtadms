import type { NavItem, NavGroup } from "./nav-config"

/**
 * Cek REKURSIF -- true kalau `item` ATAU salah satu `children`-nya
 * (di kedalaman berapa pun) match pathname aktif. Dipakai baik utk
 * grup teratas MAUPUN item bertingkat (mis. "Mikrotik" di dalam
 * "Infrastructure Management").
 */
export function itemContainsPath(item: NavItem, pathname: string): boolean {
  if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) return true
  return (item.children ?? []).some((child) => itemContainsPath(child, pathname))
}

export function groupContainsPath(group: NavGroup, pathname: string): boolean {
  return group.items.some((item) => itemContainsPath(item, pathname))
}

/**
 * Kumpulkan SEMUA key (title bersarang) yang mengandung pathname
 * aktif, di kedalaman berapa pun -- dipakai auto-expand saat pertama
 * render supaya halaman yang lagi aktif langsung terlihat tanpa perlu
 * klik-klik dulu.
 */
export function collectActiveKeys(items: NavItem[], pathname: string, depth: number, acc: Set<string>) {
  for (const item of items) {
    if (item.children && item.children.length > 0) {
      if (itemContainsPath(item, pathname)) acc.add(`${depth}-${item.title}`)
      collectActiveKeys(item.children, pathname, depth + 1, acc)
    }
  }
}
