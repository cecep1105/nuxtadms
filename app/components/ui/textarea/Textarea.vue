<script setup lang="ts">
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string; rows?: number }>()
const model = defineModel<string>()
</script>
<template>
  <textarea
    v-model="model" :rows="rows ?? 3"
    :class="cn('flex w-full rounded-md border border-input bg-background px-2.5 py-1.5 text-xs shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50', props.class)"
  />
</template>
