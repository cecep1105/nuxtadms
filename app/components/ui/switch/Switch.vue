<script setup lang="ts">
import { SwitchRoot, SwitchThumb, useForwardProps } from "reka-ui"
import type { SwitchRootProps } from "reka-ui"
import { cn } from "@/lib/utils"

/**
 * ⚠️ BUG YANG SUDAH DIPERBAIKI (dilaporkan pertama kali lewat toggle
 * Proxied/Unproxied Cloudflare, ternyata berdampak ke 6 file lain juga
 * -- lihat catatan lengkap): SwitchRoot dari reka-ui prop model-nya
 * BERNAMA `modelValue` (emit `update:modelValue`), BUKAN `checked`.
 * Versi SEBELUMNYA di sini cuma nge-forward SwitchRootProps/
 * SwitchRootEmits APA ADANYA (tanpa custom prop `checked`) -- jadi
 * setiap pemanggil yang pakai `v-model:checked="someRef"` (SEMUA
 * pemanggil di codebase ini) sebenarnya BINDING KE PROP YANG TIDAK
 * ADA (`checked` jatuh jadi fallthrough attribute biasa, TIDAK
 * TERHUBUNG ke state internal switch SAMA SEKALI) -- switch TIDAK
 * PERNAH benar2 baca NILAI AWAL yang benar (baca = salah) DAN toggle
 * TIDAK PERNAH mengubah ref aslinya (tulis = gagal diam-diam, TANPA
 * error).
 *
 * FIX: wrapper INI SEKARANG yang jadi lapisan terjemahan eksplisit --
 * expose prop/emit `checked`/`update:checked` (nama yang SEMUA
 * pemanggil sudah pakai & PALING intuitif, sesuai semantik HTML
 * checkbox/switch native), diterjemahkan ke `model-value`/
 * `update:model-value` SUNGGUHAN milik SwitchRoot di baliknya. Props
 * LAIN (disabled/id/name/dst) TETAP di-forward apa adanya spt
 * sebelumnya, TIDAK ada yang hilang.
 */
const props = defineProps<Omit<SwitchRootProps, "modelValue" | "defaultValue"> & { checked?: boolean; class?: string }>()
const emit = defineEmits<{ (e: "update:checked", value: boolean): void }>()
const forwardedProps = useForwardProps(props)
</script>
<template>
  <SwitchRoot
    v-bind="forwardedProps"
    :model-value="checked"
    :class="cn('peer inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-transparent transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=unchecked]:bg-secondary', props.class)"
    @update:model-value="(v) => emit('update:checked', v === true)"
  >
    <SwitchThumb class="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0.5" />
  </SwitchRoot>
</template>
