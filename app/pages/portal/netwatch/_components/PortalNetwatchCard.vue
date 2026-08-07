<script setup lang="ts">
import { CircleCheck, CircleX, CircleDashed, Clock } from "@lucide/vue"
import { cn } from "@/lib/utils"
import type { MikrotikNetwatchItem } from "#shared/types/api"

/**
 * Versi PORTAL dari NetwatchCard (staff) -- READ-ONLY SEPENUHNYA, TIDAK
 * ADA NetwatchActionsMenu di bawahnya (SENGAJA, scope Portal utk
 * Netwatch cuma lihat -- kelola tetap staff-only).
 */
const STATUS_CONFIG: Record<string, { label: string; variant: "success" | "destructive" | "warning" | "secondary"; icon: typeof CircleCheck }> = {
  up: { label: "Up", variant: "success", icon: CircleCheck },
  down: { label: "Down", variant: "destructive", icon: CircleX },
  waiting: { label: "Waiting", variant: "warning", icon: CircleDashed },
  initializing: { label: "Initializing", variant: "secondary", icon: CircleDashed },
}

const props = defineProps<{ item: MikrotikNetwatchItem }>()
const cfg = computed(() => STATUS_CONFIG[props.item.status] ?? STATUS_CONFIG.waiting!)
const isDown = computed(() => props.item.status === "down")
const commentFirstPart = computed(() => props.item.comment?.split("|")[0] ?? "")
</script>

<template>
  <div :class="cn('rounded-lg border p-4 transition-colors', isDown ? 'border-destructive/40 bg-destructive/5' : 'border-border bg-card')">
    <div class="flex items-start justify-between gap-2">
      <div class="min-w-0">
        <p class="truncate font-mono text-sm font-semibold">{{ item.host }}</p>
        <p v-if="item.comment" class="mt-0.5 truncate text-xs text-muted-foreground" :title="item.comment">{{ commentFirstPart }}</p>
      </div>
      <Badge :variant="cfg.variant" class="shrink-0 gap-1">
        <component :is="cfg.icon" class="h-3 w-3" /> {{ cfg.label }}
      </Badge>
    </div>

    <div class="mt-3 space-y-1 text-xs text-muted-foreground">
      <div class="flex items-center gap-1.5">
        <Clock class="h-3 w-3 shrink-0" />
        <span>Since: {{ item.since ?? "-" }}</span>
      </div>
      <div class="flex items-center justify-between">
        <span>Interval: {{ item.interval ?? "-" }}</span>
        <span>Timeout: {{ item.timeout ?? "-" }}</span>
      </div>
      <Badge v-if="item.disabled === 'true'" variant="secondary" class="mt-1">Disabled</Badge>
    </div>
  </div>
</template>
