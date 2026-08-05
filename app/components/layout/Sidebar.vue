<script setup lang="ts">
import { Network, ChevronsLeft, ChevronsRight } from "@lucide/vue"
import { navGroups } from "@/lib/nav-config"
import { cn } from "@/lib/utils"

const { collapsed, toggle } = useSidebar()
const route = useRoute()

function isActive(href?: string) {
  if (!href) return false
  return route.path === href || route.path.startsWith(`${href}/`)
}
</script>

<template>
  <aside
    :class="cn(
      'sidebar-shell hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block',
      collapsed ? 'w-14' : 'w-60'
    )"
  >
    <div :class="cn('fixed flex h-screen flex-col transition-[width] duration-200', collapsed ? 'w-14' : 'w-60')">
      <div class="min-h-0 flex-1 bg-card">
        <div :class="cn('flex h-12 shrink-0 items-center gap-2 border-b border-border', collapsed ? 'justify-center px-2' : 'px-4')">
          <div class="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary/15">
            <Network class="h-3.5 w-3.5 text-primary" />
          </div>
          <span v-if="!collapsed" class="truncate font-display text-sm font-semibold tracking-tight">NUXTADMS</span>
        </div>

        <nav class="space-y-1 overflow-y-auto px-2 py-3" style="max-height: calc(100vh - 3rem - 3rem)">
          <template v-for="group in navGroups" :key="group.label">
            <div class="pt-2 first:pt-0">
              <p v-if="!collapsed" class="truncate px-2 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
                {{ group.label }}
              </p>
              <NuxtLink
                v-for="item in group.items"
                :key="item.title"
                :to="item.href ?? '#'"
                :class="cn(
                  'flex items-center gap-2.5 rounded-md py-1.5 text-[13px] font-medium transition-colors',
                  collapsed ? 'justify-center px-2' : 'px-2',
                  isActive(item.href) ? 'bg-primary/15 text-primary' : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )"
              >
                <component :is="item.icon" class="h-3.5 w-3.5 shrink-0" />
                <span v-if="!collapsed" class="truncate">{{ item.title }}</span>
              </NuxtLink>
            </div>
          </template>
        </nav>
      </div>

      <div :class="cn('flex shrink-0 border-t border-border bg-card p-2', collapsed ? 'justify-center' : 'justify-end')">
        <Button variant="ghost" size="icon" :aria-label="collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'" @click="toggle">
          <component :is="collapsed ? ChevronsRight : ChevronsLeft" class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </aside>
</template>
