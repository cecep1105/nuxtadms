<script setup lang="ts">
import { SwitchRoot, SwitchThumb, useForwardPropsEmits } from "reka-ui"
import type { SwitchRootEmits, SwitchRootProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<SwitchRootProps & { class?: string }>()
const emits = defineEmits<SwitchRootEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>
<template>
  <SwitchRoot
    v-bind="forwarded"
    :class="cn('peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary', props.class)"
  >
    <SwitchThumb class="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
  </SwitchRoot>
</template>
