<script setup lang="ts">
import { Check } from "@lucide/vue"
import { CheckboxRoot, CheckboxIndicator, useForwardProps } from "reka-ui"
import type { CheckboxRootProps } from "reka-ui"
import { cn } from "@/lib/utils"

/**
 * ⚠️ SAMA BUG & FIX dgn Switch.vue (lihat catatan lengkap di sana) --
 * CheckboxRoot dari reka-ui prop model-nya BERNAMA `modelValue`, BUKAN
 * `checked`. Semua pemanggil di codebase ini pakai `v-model:checked`,
 * jadi wrapper INI SEKARANG jadi lapisan terjemahan eksplisit.
 */
const props = defineProps<Omit<CheckboxRootProps, "modelValue" | "defaultValue"> & { checked?: boolean; class?: string }>()
const emit = defineEmits<{ (e: "update:checked", value: boolean): void }>()
const forwardedProps = useForwardProps(props)
</script>
<template>
  <CheckboxRoot
    v-bind="forwardedProps"
    :model-value="checked"
    :class="cn('peer h-4 w-4 shrink-0 rounded-sm border border-input shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:border-primary data-[state=checked]:text-primary-foreground', props.class)"
    @update:model-value="(v) => emit('update:checked', v === true)"
  >
    <CheckboxIndicator class="flex items-center justify-center text-current">
      <Check class="h-3 w-3" />
    </CheckboxIndicator>
  </CheckboxRoot>
</template>
