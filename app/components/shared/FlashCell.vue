<script setup lang="ts">
import { cn } from "@/lib/utils"

/**
 * Sel tabel yang KEDIP KUNING sesaat setiap kali `value`-nya BERUBAH --
 * feedback visual "ini baru saja di-update lewat WebSocket", supaya
 * perubahan real-time TERLIHAT (bukan cuma diam-diam berubah tanpa
 * disadari).
 */
const props = withDefaults(defineProps<{ value: string | number; class?: string; flashClass?: string }>(), {
  flashClass: "bg-yellow-100 text-black dark:bg-yellow-500/30 dark:text-yellow-100",
})

const flash = ref(false)
let timer: ReturnType<typeof setTimeout> | undefined

watch(() => props.value, () => {
  flash.value = true
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => { flash.value = false }, 1000)
})

onBeforeUnmount(() => { if (timer) clearTimeout(timer) })
</script>

<template>
  <td :class="cn(props.class, 'p-3 align-middle transition-colors duration-500', flash && flashClass)">{{ value }}</td>
</template>
