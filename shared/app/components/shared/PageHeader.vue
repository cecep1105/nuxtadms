<script setup lang="ts">
defineProps<{ title: string; description?: string }>()
</script>
<template>
  <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
    <div>
      <h1 class="font-display text-lg font-semibold tracking-tight">{{ title }}</h1>
      <p v-if="description" class="text-xs text-muted-foreground">{{ description }}</p>
      <slot name="description" />
    </div>
    <div v-if="$slots.action || $slots.default"><slot name="action" /><slot /></div>
  </div>
</template>
