<script setup lang="ts">
import { X } from "@lucide/vue"
import { DialogContent, DialogOverlay, DialogPortal, DialogClose, useForwardPropsEmits } from "reka-ui"
import type { DialogContentEmits, DialogContentProps } from "reka-ui"
import { cn } from "@/lib/utils"

const props = defineProps<DialogContentProps & { class?: string }>()
const emits = defineEmits<DialogContentEmits>()
const forwarded = useForwardPropsEmits(props, emits)
</script>

<template>
  <DialogPortal>
    <DialogOverlay class="fixed inset-0 z-50 bg-black/60 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
    <DialogContent
      v-bind="forwarded"
      :class="cn(
        'fixed left-1/2 top-1/2 z-50 grid w-full max-w-md -translate-x-1/2 -translate-y-1/2 gap-4 rounded-lg border border-border bg-card p-5 shadow-lg duration-200 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95',
        props.class
      )"
    >
      <slot />
      <DialogClose class="absolute right-3 top-3 rounded-sm text-muted-foreground opacity-70 transition-opacity hover:opacity-100 focus:outline-none">
        <X class="h-4 w-4" />
        <span class="sr-only">Tutup</span>
      </DialogClose>
    </DialogContent>
  </DialogPortal>
</template>
