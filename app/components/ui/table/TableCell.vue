<script setup lang="ts">
import { cn } from "@/lib/utils"
const props = defineProps<{ class?: string; colspan?: number }>()
</script>
<template>
  <td :class="cn('p-3 align-middle', props.class)" :colspan="props.colspan"><slot /></td>
</template>
