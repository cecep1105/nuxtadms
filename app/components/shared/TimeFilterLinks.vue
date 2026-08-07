<script setup lang="ts">
import { cn } from "@/lib/utils"

const OPTIONS = [
  { value: "minute", label: "Menit Ini" },
  { value: "hour", label: "Jam Ini" },
  { value: "day", label: "Hari Ini" },
]

/** Filter waktu simpel (minute/hour/day) dipakai IMAP Logs & SASL Logs -- BEDA dari param page/page_size dkk, spesifik ke 2 halaman log auth-fail ini saja. */
defineProps<{ basePath: string; current: string }>()
</script>

<template>
  <div class="flex gap-1.5">
    <NuxtLink
      v-for="opt in OPTIONS" :key="opt.value" :to="`${basePath}?time=${opt.value}`"
      :class="cn('rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', current === opt.value ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground')"
    >
      {{ opt.label }}
    </NuxtLink>
  </div>
</template>
