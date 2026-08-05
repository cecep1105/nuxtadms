<script setup lang="ts">
import { PopoverContent, PopoverPortal, useForwardPropsEmits } from "reka-ui"
import type { PopoverContentEmits, PopoverContentProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<PopoverContentProps & { class?: string }>()
const emits = defineEmits<PopoverContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>
<template>
  <PopoverPortal>
    <PopoverContent
      v-bind="forwarded"
      :side-offset="8"
      :class="cn('z-50 rounded-md border border-border bg-card p-3 shadow-lg outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95', props.class)"
    >
      <slot />
    </PopoverContent>
  </PopoverPortal>
</template>
