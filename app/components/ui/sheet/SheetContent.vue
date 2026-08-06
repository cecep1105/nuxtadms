<script setup lang="ts">
import { X } from "@lucide/vue"
import { DialogContent, DialogOverlay, DialogPortal, DialogClose, useForwardPropsEmits } from "reka-ui"
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import { cn } from "@/lib/utils"

/**
 * Sheet -- drawer geser dari sisi layar (kiri, dipakai utk menu mobile).
 * Reka-ui TIDAK punya primitive Sheet TERPISAH -- shadcn (React MAUPUN
 * Vue) SELALU membangun Sheet dari Dialog primitive yang SAMA, cuma beda
 * posisi/animasi (overlay tetap sama, konten digeser ke tepi bukan
 * ditengah, animasi slide bukan zoom+fade).
 */
interface Props extends DialogContentProps {
  class?: string
  side?: "left" | "right" | "top" | "bottom"
}
const props = withDefaults(defineProps<Props>(), { side: "left" })
const emits = defineEmits<DialogContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)

const sideClass = {
  left: "inset-y-0 left-0 h-full w-60 border-r data-[state=closed]:slide-out-to-left data-[state=open]:slide-in-from-left",
  right: "inset-y-0 right-0 h-full w-60 border-l data-[state=closed]:slide-out-to-right data-[state=open]:slide-in-from-right",
  top: "inset-x-0 top-0 border-b data-[state=closed]:slide-out-to-top data-[state=open]:slide-in-from-top",
  bottom: "inset-x-0 bottom-0 border-t data-[state=closed]:slide-out-to-bottom data-[state=open]:slide-in-from-bottom",
}
</script>

<template>
  <DialogPortal>
    <DialogOverlay class="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogContent
      v-bind="forwarded"
      :class="cn('fixed z-50 border-border bg-card shadow-lg transition ease-in-out data-[state=closed]:animate-out data-[state=open]:animate-in data-[state=closed]:duration-200 data-[state=open]:duration-300', sideClass[side], props.class)"
    >
      <slot />
      <DialogClose class="absolute right-3 top-3 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
        <X class="h-4 w-4" />
        <span class="sr-only">Tutup</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
