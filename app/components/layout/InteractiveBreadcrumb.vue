<script setup lang="ts">
import { ChevronRight, ChevronDown } from "@lucide/vue"
import { navGroups, type NavItem, type NavGroup } from "@/lib/nav-config"

interface BreadcrumbOption {
  label: string
  /** Href TUJUAN kalau opsi ini diklik -- utk item "folder" (children, tanpa href sendiri), pakai href child PERTAMANYA (folder sendiri bukan halaman). */
  href: string
  isCurrent: boolean
}
interface BreadcrumbSegment {
  label: string
  href?: string
  /** Opsi lain SETINGKAT (sibling) yang bisa dipilih lewat dropdown di segmen ini. Kosong kalau cuma 1 opsi (dropdown tidak berguna). */
  options: BreadcrumbOption[]
}

/** Href navigasi utk 1 opsi breadcrumb -- item biasa pakai href sendiri, item "folder" (py children, tanpa href) pakai href child PERTAMANYA. */
function resolveHref(item: NavItem): string | undefined {
  if (item.href) return item.href
  return item.children?.[0] ? resolveHref(item.children[0]) : undefined
}

function buildOptions(items: NavItem[], current: NavItem): BreadcrumbOption[] {
  const options = items
    .map((item) => ({ label: item.title, href: resolveHref(item), isCurrent: item === current }))
    .filter((opt): opt is BreadcrumbOption => !!opt.href)
  return options.length > 1 ? options : []
}

function matchInItems(items: NavItem[], pathname: string): BreadcrumbSegment[] | null {
  for (const item of items) {
    if (item.href && (pathname === item.href || pathname.startsWith(`${item.href}/`))) {
      return [{ label: item.title, href: item.href, options: buildOptions(items, item) }]
    }
    if (item.children && item.children.length > 0) {
      const deeper = matchInItems(item.children, pathname)
      if (deeper) {
        return [{ label: item.title, href: resolveHref(item), options: buildOptions(items, item) }, ...deeper]
      }
    }
  }
  return null
}

function findBreadcrumb(pathname: string): BreadcrumbSegment[] {
  for (const group of navGroups) {
    const matched = matchInItems(group.items, pathname)
    if (matched) {
      // Grup 1-item (spt "Dashboard") TIDAK perlu segmen grup terpisah --
      // labelnya SAMA PERSIS dgn satu2nya item di dalamnya, redundan kalau ditampilkan 2x.
      if (group.items.length === 1) return matched
      return [{ label: group.label, options: [] }, ...matched]
    }
  }
  return [{ label: "Dashboard", href: "/", options: [] }]
}

/**
 * Breadcrumb INTERAKTIF -- tiap segmen yang punya sibling (mis. "Mikrotik"
 * bisa diganti "Mail Server (Zentyal)"/"Active Directory", atau "DHCP
 * Leases" bisa diganti "Firewall Filter"/"Netwatch") jadi dropdown, bisa
 * lompat ke halaman LAIN di level yang sama TANPA perlu buka sidebar --
 * paling berguna saat sidebar sedang diciutkan (collapsed).
 *
 * ⚠️ BUG YANG SUDAH DIPERBAIKI (dropdown breadcrumb "nyangkut" tetap
 * terbuka setelah navigasi): komponen ini hidup di Topbar.vue, BAGIAN
 * DARI LAYOUT (default.vue) -- BUKAN bagian dari halaman itu sendiri.
 * Nuxt TIDAK me-remount layout antar navigasi halaman (cuma konten
 * <NuxtPage /> yang diganti) -- kalau 1 segmen breadcrumb py LABEL
 * yang SAMA PERSIS sebelum & sesudah navigasi (mis. "Infrastructure
 * Management" tetap muncul di breadcrumb halaman TUJUAN juga), Vue
 * `v-for` (dgn key `${segment.label}-${i}`) MEMAKAI ULANG instance
 * komponen DropdownMenu yang SAMA (TIDAK di-destroy+recreate) --
 * status buka/tutupnya (state INTERNAL reka-ui, BUKAN prop) BISA
 * "kebawa" dari sebelum navigasi.
 *
 * FIX: kontrol status buka/tutup SETIAP dropdown scr EKSPLISIT lewat
 * `openKey` di sini (BUKAN pasrahkan ke state internal reka-ui), &
 * PAKSA tertutup (openKey = null) SETIAP KALI route berubah -- jaminan
 * ini TIDAK bergantung pada detail teknis persis kenapa state bisa
 * "kebawa" (persistence layout, quirk SSR/hydration, dst), SELALU
 * benar utk SEMUA skenario navigasi. DITAMBAH: max-h-72 overflow-y-auto
 * di DropdownMenuContent -- trigger breadcrumb ada DEKAT SEKALI dgn
 * tepi ATAS viewport (topbar), CSS var bawaan reka-ui utk max-height
 * OTOMATIS jadi SANGAT BESAR dari posisi ini (nyaris setinggi viewport)
 * -- kotak dropdown jadi tinggi & nyaris kosong, kelihatan spt "menu
 * sidebar nyasar ke breadcrumb" di screenshot yang dilaporkan.
 */
const route = useRoute()
const segments = computed(() => findBreadcrumb(route.path))

const openKey = ref<string | null>(null)
watch(() => route.path, () => { openKey.value = null })
</script>

<template>
  <div class="flex min-w-0 flex-1 items-center gap-1.5 text-sm">
    <span v-for="(segment, i) in segments" :key="`${segment.label}-${i}`" class="flex min-w-0 items-center gap-1.5">
      <ChevronRight v-if="i > 0" class="h-3 w-3 shrink-0 text-muted-foreground/50" />

      <!-- Tidak ada sibling -- teks/link biasa, TANPA dropdown (percuma). -->
      <template v-if="segment.options.length === 0">
        <NuxtLink
          v-if="segment.href"
          :to="segment.href"
          :class="['truncate hover:underline', i === segments.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground']"
        >
          {{ segment.label }}
        </NuxtLink>
        <span v-else :class="['truncate', i === segments.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground']">
          {{ segment.label }}
        </span>
      </template>

      <!-- Ada sibling -- dropdown, supaya bisa lompat ke menu lain LEWAT
           breadcrumb tanpa perlu buka sidebar. `open` DIKONTROL EKSPLISIT
           (bukan uncontrolled bawaan) -- lihat catatan bug di atas. -->
      <DropdownMenu
        v-else
        :open="openKey === `${segment.label}-${i}`"
        @update:open="(v) => (openKey = v ? `${segment.label}-${i}` : null)"
      >
        <DropdownMenuTrigger
          :class="['inline-flex items-center gap-0.5 truncate rounded px-1 -mx-1 hover:bg-secondary', i === segments.length - 1 ? 'font-medium text-foreground' : 'text-muted-foreground']"
        >
          {{ segment.label }}
          <ChevronDown class="h-3 w-3 shrink-0 opacity-60" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" class="max-h-72 overflow-y-auto">
          <DropdownMenuItem
            v-for="opt in segment.options" :key="opt.label" as-child
            :class="opt.isCurrent ? 'bg-accent' : ''"
            @click="openKey = null"
          >
            <NuxtLink :to="opt.href">{{ opt.label }}</NuxtLink>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </span>
  </div>
</template>
