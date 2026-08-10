<script setup lang="ts">
import { cn } from "@/lib/utils"

/**
 * ⚠️ DISELARASKAN ke input.tsx Next.js (dicek ulang LANGSUNG dari
 * source) -- versi SEBELUMNYA pakai py-1.5/text-xs/file:text-xs,
 * TIDAK cocok dgn Next.js yang pakai py-1/text-sm/file:text-sm. Ini
 * PERBEDAAN LAMA yang TERNYATA jadi penyebab sisa ketidakcocokan
 * Select vs Input SETELAH Select sendiri sudah diselaraskan ke
 * select.tsx Next.js (Select & Input Next.js SAMA-SAMA pakai
 * py-1/text-sm, cuma Input.vue Nuxt yang menyimpang).
 */
const props = defineProps<{ class?: string }>()
const modelValue = defineModel<string | number>()
</script>

<template>
  <input
    v-model="modelValue"
    :class="cn(
      'flex h-8 w-full rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-sm transition-colors file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50',
      props.class
    )"
  />
</template>
