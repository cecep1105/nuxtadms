<script setup lang="ts">
import { ChevronUp, ChevronDown, ChevronsUpDown } from "@lucide/vue"

const props = defineProps<{ label: string; sortKey: string; currentSort: string; currentDir: "asc" | "desc" }>()
const emit = defineEmits<{ (e: "sort", key: string): void }>()
const active = computed(() => props.currentSort === props.sortKey)
</script>

<template>
  <TableHead>
    <button type="button" class="inline-flex items-center gap-1 hover:text-foreground" @click="emit('sort', sortKey)">
      {{ label }}
      <ChevronDown v-if="active && currentDir === 'desc'" class="h-3 w-3" />
      <ChevronUp v-else-if="active" class="h-3 w-3" />
      <ChevronsUpDown v-else class="h-3 w-3 opacity-40" />
    </button>
  </TableHead>
</template>
