<script setup lang="ts">
import { Users, ChevronDown } from "@lucide/vue"

/**
 * Kolom "Penerima" -- kalau cuma 1 penerima, tampil apa adanya (teks
 * biasa, TIDAK perlu dropdown). Kalau LEBIH dari 1, tampil ringkas
 * "penerima1 + N lainnya" -- klik utk lihat daftar LENGKAP di popover.
 *
 * ⚠️ Delimiter field `recipient` dari API BELUM 100% pasti (koma ATAU
 * spasi, sumbernya Flask API eksternal di server Zentyal, di luar
 * kendali kode ini) -- makanya parsing di sini SENGAJA ROBUST thd
 * KEDUA kemungkinan: split berdasarkan RUN koma DAN/ATAU spasi
 * sekaligus (`/[\s,]+/`), BUKAN cuma salah satu -- aman utk format
 * "a@x.com, b@x.com" (koma+spasi), "a@x.com,b@x.com" (koma polos),
 * MAUPUN "a@x.com b@x.com" (spasi polos) tanpa perlu tahu PASTI
 * mana yang benar.
 */
const props = defineProps<{ recipient: string }>()

const recipients = computed(() =>
  props.recipient
    .split(/[\s,]+/)
    .map((r) => r.trim())
    .filter(Boolean)
)

const extraCount = computed(() => recipients.value.length - 1)
</script>

<template>
  <span v-if="recipients.length <= 1" class="text-muted-foreground">{{ recipient || "-" }}</span>

  <Popover v-else>
    <PopoverTrigger as-child>
      <button type="button" class="inline-flex items-center gap-1 text-left text-muted-foreground hover:text-foreground hover:underline">
        <span class="truncate">{{ recipients[0] }}</span>
        <span class="shrink-0 whitespace-nowrap text-xs">+ {{ extraCount }} lainnya</span>
        <ChevronDown class="h-3 w-3 shrink-0" />
      </button>
    </PopoverTrigger>
    <PopoverContent class="w-80" align="start">
      <div class="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <Users class="h-3.5 w-3.5" /> {{ recipients.length }} Penerima
      </div>
      <div class="max-h-64 space-y-0.5 overflow-y-auto">
        <p v-for="(r, i) in recipients" :key="i" class="truncate font-mono text-xs">{{ r }}</p>
      </div>
    </PopoverContent>
  </Popover>
</template>
