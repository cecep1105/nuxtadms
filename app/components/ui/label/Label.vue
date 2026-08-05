<script setup lang="ts">
import { Label, type LabelProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<LabelProps & { class?: string }>()
</script>

<template>
  <Label :class="cn('text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70', props.class)" v-bind="props">
    <slot />
  </Label>
</template>
