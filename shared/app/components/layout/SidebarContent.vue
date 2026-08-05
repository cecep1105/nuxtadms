<script setup lang="ts">
import { Network, ChevronDown } from "@lucide/vue"
import { navGroups, nonStaffNavGroups } from "@/lib/nav-config"
import { groupContainsPath, collectActiveKeys } from "@/lib/nav-helpers"
import { cn } from "@/lib/utils"

/**
 * Konten sidebar yang SESUNGGUHNYA (logo + nav) -- dipisah dari
 * <Sidebar> (wrapper <aside> + tombol collapse) supaya bisa dipakai
 * ULANG nanti utk Sheet mobile di Topbar.vue (SAMA pola dgn
 * SidebarContent versi Next.js).
 */
const props = defineProps<{ collapsed?: boolean }>()
const emit = defineEmits<{ (e: "navigate"): void }>()

const route = useRoute()
const { user } = useUserSession()
const isStaff = computed(() => !!(user.value?.is_staff || user.value?.is_superuser))
const groups = computed(() => (isStaff.value ? navGroups : nonStaffNavGroups))

// Grup/item bertingkat mana yang lagi terbuka -- default: SEMUA yang
// MEMUAT halaman AKTIF saat ini (di kedalaman berapa pun) otomatis
// terbuka, sisanya tertutup. User bisa toggle manual sesudahnya.
function computeInitialOpenKeys(): Set<string> {
  const initial = new Set<string>()
  for (const group of groups.value) {
    if (group.items.length > 1 && groupContainsPath(group, route.path)) {
      initial.add(group.label)
    }
    collectActiveKeys(group.items, route.path, 1, initial)
  }
  return initial
}
const openGroups = ref<Set<string>>(computeInitialOpenKeys())

function toggleGroup(label: string) {
  const next = new Set(openGroups.value)
  if (next.has(label)) next.delete(label)
  else next.add(label)
  openGroups.value = next
}
</script>

<template>
  <div class="sidebar-shell flex h-full flex-col bg-card">
    <div :class="cn('flex h-12 shrink-0 items-center gap-2 border-b border-border', collapsed ? 'justify-center px-2' : 'px-4')">
      <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
        <Network class="h-3.5 w-3.5 text-primary" />
      </div>
      <span v-if="!collapsed" class="truncate font-display text-sm font-semibold tracking-tight">NUXTADMS</span>
    </div>

    <nav class="flex-1 space-y-1 overflow-y-auto px-2 py-3">
      <template v-for="group in groups" :key="group.label">
        <!-- Grup 1 item -- link langsung, TIDAK ada header/dropdown (spt "Dashboard"). -->
        <NavLink v-if="group.items.length === 1" :item="group.items[0]!" :collapsed="!!collapsed" @navigate="emit('navigate')" />

        <!-- Mode sidebar diciutkan -- tampilkan SEMUA item grup ini langsung (flat, rekursif turun ke children juga). -->
        <div v-else-if="collapsed" class="space-y-0.5 pt-2 first:pt-0">
          <NavItemRenderer
            v-for="item in group.items" :key="item.title"
            :item="item" :collapsed="true" :depth="0" :open-keys="openGroups"
            @navigate="emit('navigate')" @toggle="toggleGroup"
          />
        </div>

        <!-- Grup 2+ item -- dropdown per-aplikasi, bisa di-collapse/expand. -->
        <div v-else class="pt-1 first:pt-0">
          <button
            type="button"
            :class="cn(
              'flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-[13px] font-medium transition-colors',
              groupContainsPath(group, route.path) ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )"
            @click="toggleGroup(group.label)"
          >
            <component :is="group.icon ?? Network" class="h-3.5 w-3.5 shrink-0" />
            <span class="flex-1 truncate text-left">{{ group.label }}</span>
            <ChevronDown :class="cn('h-3.5 w-3.5 shrink-0 transition-transform duration-150', openGroups.has(group.label) && 'rotate-180')" />
          </button>
          <div v-if="openGroups.has(group.label)" class="mt-0.5 space-y-0.5">
            <NavItemRenderer
              v-for="item in group.items" :key="item.title"
              :item="item" :collapsed="false" :depth="1" :open-keys="openGroups"
              @navigate="emit('navigate')" @toggle="toggleGroup"
            />
          </div>
        </div>
      </template>
    </nav>
  </div>
</template>
