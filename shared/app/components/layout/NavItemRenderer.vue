<script setup lang="ts">
import { ChevronDown } from "@lucide/vue"
import type { NavItem } from "@/lib/nav-config"
import { itemContainsPath } from "@/lib/nav-helpers"
import { cn } from "@/lib/utils"

/**
 * Render 1 item nav -- kalau item ini PUNYA `children`, jadi dropdown
 * bertingkat SENDIRI (button toggle + chevron) -- kalau TIDAK, cuma
 * link biasa (NavLink). REKURSIF by design (Vue SFC bisa reference diri
 * sendiri via nama filename di dalam template-nya sendiri, TANPA perlu
 * import eksplisit) -- children BISA punya children lagi kalau nanti
 * perlu lebih dari 2 tingkat, walau sejauh ini cuma dipakai 1 tingkat
 * sub-menu spt Mikrotik/Mail Server/Active Directory/VMware di dalam
 * Infrastructure Management.
 */
const props = defineProps<{
  item: NavItem
  collapsed: boolean
  depth: number
  openKeys: Set<string>
}>()
const emit = defineEmits<{ (e: "navigate"): void; (e: "toggle", key: string): void }>()

const route = useRoute()
const key = computed(() => `${props.depth}-${props.item.title}`)
const isOpen = computed(() => props.openKeys.has(key.value))
const isActive = computed(() => itemContainsPath(props.item, route.path))
</script>

<template>
  <NavLink v-if="!item.children || item.children.length === 0" :item="item" :collapsed="collapsed" :depth="depth" @navigate="emit('navigate')" />

  <!-- Sidebar diciutkan -- tampilkan SEMUA children langsung (flat, dropdown bertingkat cuma relevan pas full-width). -->
  <div v-else-if="collapsed" class="space-y-0.5">
    <NavItemRenderer
      v-for="child in item.children" :key="child.title"
      :item="child" :collapsed="collapsed" :depth="depth" :open-keys="openKeys"
      @navigate="emit('navigate')" @toggle="(k) => emit('toggle', k)"
    />
  </div>

  <div v-else>
    <button
      type="button"
      :class="cn(
        'flex w-full items-center gap-2.5 rounded-md py-1.5 text-[13px] font-medium transition-colors',
        depth === 0 ? 'px-2' : 'px-2 pl-7',
        isActive ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
      )"
      @click="emit('toggle', key)"
    >
      <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
      <span class="flex-1 truncate text-left">{{ item.title }}</span>
      <ChevronDown :class="cn('h-3.5 w-3.5 shrink-0 transition-transform duration-150', isOpen && 'rotate-180')" />
    </button>
    <div v-if="isOpen" class="mt-0.5 space-y-0.5">
      <NavItemRenderer
        v-for="child in item.children" :key="child.title"
        :item="child" :collapsed="false" :depth="depth + 1" :open-keys="openKeys"
        @navigate="emit('navigate')" @toggle="(k) => emit('toggle', k)"
      />
    </div>
  </div>
</template>
