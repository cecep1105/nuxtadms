<script setup lang="ts">
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string }>()
</script>
<template>
  <tr :class="cn('border-b border-border transition-colors hover:bg-secondary/50', props.class)"><slot /></tr>
</template>
