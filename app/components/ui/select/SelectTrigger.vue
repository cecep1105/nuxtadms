<script setup lang="ts">
import type { SelectTriggerProps } from "reka-ui"
import type { HTMLAttributes } from "vue"
import { ChevronDown } from "@lucide/vue"
import { reactiveOmit } from "@vueuse/core"
import { SelectIcon, SelectTrigger, useForwardProps } from "reka-ui"
import { cn } from "@/lib/utils"

/**
 * ⚠️ DITULIS ULANG SEPENUHNYA (bukan tambal sulam per-properti lagi) --
 * versi SEBELUMNYA campuran dari template shadcn-vue STANDAR/lebih
 * BARU (data-[size=*], dark:bg-input/30, aria-invalid:*, w-fit, dst --
 * SEMUA properti ini TIDAK ADA di select.tsx Next.js proyek ini) yang
 * TIDAK PERNAH sepenuhnya diselaraskan ke select.tsx Next.js -- setiap
 * kali 1 properti diperbaiki (tinggi, lalu text-size), masih ADA
 * properti lain yang beda (w-fit vs w-full, dark:bg-input/30 vs
 * bg-background polos) krn PENDEKATAN tambal-sulam tidak pernah
 * membandingkan FILE UTUH.
 *
 * Sekarang: class di bawah adalah TERJEMAHAN LITERAL, baris-per-baris,
 * dari select.tsx Next.js (dicek ulang LANGSUNG dari file lengkapnya).
 * Prop `size` (variant sm/default) DIHAPUS -- tidak ada konsepnya di
 * Next.js sama sekali, DAN sudah dikonfirmasi tidak pernah dipakai di
 * mana pun di codebase Nuxt ini (grep kosong).
 */
const props = defineProps<SelectTriggerProps & { class?: HTMLAttributes["class"] }>()

const delegatedProps = reactiveOmit(props, "class")
const forwardedProps = useForwardProps(delegatedProps)
</script>

<template>
  <SelectTrigger
    v-bind="forwardedProps"
    :class="cn(
      'flex h-8 w-full items-center justify-between rounded-md border border-input bg-background px-2.5 py-1 text-sm shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 *:data-[slot=select-value]:line-clamp-1',
      props.class,
    )"
  >
    <slot />
    <SelectIcon as-child>
      <ChevronDown class="h-4 w-4 opacity-50" />
    </SelectIcon>
  </SelectTrigger>
</template>
