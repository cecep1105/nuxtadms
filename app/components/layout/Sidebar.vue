<script setup lang="ts">
import { ChevronsLeft, ChevronsRight } from "@lucide/vue"
import { cn } from "@/lib/utils"

const { collapsed, toggle } = useSidebar()
</script>

<template>
  <aside
    :class="cn(
      'sidebar-shell hidden shrink-0 border-r border-border transition-[width] duration-200 lg:block',
      collapsed ? 'w-14' : 'w-60'
    )"
  >
    <div :class="cn('fixed flex h-screen flex-col transition-[width] duration-200', collapsed ? 'w-14' : 'w-60')">
      <div class="min-h-0 flex-1">
        <SidebarContent :collapsed="collapsed" />
      </div>
      <div :class="cn('flex shrink-0 border-t border-border bg-card p-2 text-foreground', collapsed ? 'justify-center' : 'justify-end')">
        <Button variant="ghost" size="icon" :aria-label="collapsed ? 'Perluas sidebar' : 'Ciutkan sidebar'" @click="toggle">
          <component :is="collapsed ? ChevronsRight : ChevronsLeft" class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  </aside>
</template>
