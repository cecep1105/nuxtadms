<script setup lang="ts">
import type { Component } from "vue"

defineProps<{ href: string; icon: Component; title: string; description: string }>()
</script>

<template>
  <NuxtLink :to="href">
    <Card class="h-full transition-colors hover:border-primary/40">
      <div class="flex flex-row items-center gap-3 p-4 pb-0">
        <div class="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
          <component :is="icon" class="h-4 w-4" />
        </div>
        <p class="font-display text-sm font-semibold leading-none tracking-tight">{{ title }}</p>
      </div>
      <div class="p-4">
        <p class="text-xs text-muted-foreground">{{ description }}</p>
      </div>
    </Card>
  </NuxtLink>
</template>
