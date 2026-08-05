<script setup lang="ts">
import type { NavItem } from "@/lib/nav-config"
import { cn } from "@/lib/utils"

const props = defineProps<{
  item: NavItem
  collapsed: boolean
  /** 0 = langsung di bawah grup, 1 = di dalam sub-menu bertingkat -- makin dalam, makin banyak indentasi. */
  depth?: number
}>()
const emit = defineEmits<{ (e: "navigate"): void }>()

const route = useRoute()
const active = computed(() => !!props.item.href && (route.path === props.item.href || route.path.startsWith(`${props.item.href}/`)))
const depth = computed(() => props.depth ?? 0)
</script>

<template>
  <NuxtLink
    :to="item.href ?? '#'"
    :title="collapsed ? item.title : undefined"
    :class="cn(
      'flex items-center gap-2.5 rounded-md py-1.5 text-[13px] font-medium transition-colors',
      depth === 0 ? 'px-2' : depth === 1 ? 'px-2 pl-7' : 'px-2 pl-11',
      collapsed && 'justify-center px-2',
      active ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
    )"
    @click="emit('navigate')"
  >
    <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
    <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
  </NuxtLink>
</template>
