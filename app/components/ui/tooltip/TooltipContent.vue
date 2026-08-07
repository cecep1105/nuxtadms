<script setup lang="ts">
import { TooltipContent, TooltipPortal } from "reka-ui"
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string; sideOffset?: number }>()
</script>
<template>
  <TooltipPortal>
    <TooltipContent
      :side-offset="sideOffset ?? 4"
      :class="cn('z-50 overflow-hidden rounded-md border border-border bg-popover px-2.5 py-1 text-xs text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95', props.class)"
    >
      <slot />
    </TooltipContent>
  </TooltipPortal>
</template>
