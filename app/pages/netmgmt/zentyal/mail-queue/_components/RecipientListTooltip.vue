<script setup lang="ts">
import { Users, ChevronDown } from "@lucide/vue"

/**
 * Kolom "Penerima" -- kalau cuma 1 penerima, tampil apa adanya (teks
 * biasa, TIDAK perlu dropdown). Kalau LEBIH dari 1, tampil ringkas
 * "penerima1 + N lainnya" -- klik utk lihat daftar LENGKAP di popover.
 *
 * ⚠️ BUG YANG SUDAH DIPERBAIKI (dilaporkan: "kolom Penerima kosong
 * sama sekali" -- TAPI CUMA kolom itu, kolom lain di baris yang SAMA
 * tetap normal -- TERJADI SAAT refresh via WebSocket, TIDAK terjadi
 * saat load awal): akar masalahnya BUKAN soal WebSocket-nya sendiri,
 * tapi TIMING/ISI DATA -- `props.recipient.split(...)` akan CRASH
 * (TypeError) kalau `recipient` ternyata `null`/`undefined` di
 * RUNTIME (mis. utk pesan yang bounce/gagal ke-parse recipient-nya
 * dari sisi Flask API Zentyal) -- WALAU TypeScript mengklaim field
 * ini SELALU `string`, klaim tipe itu TIDAK MENJAMIN bentuk
 * SUNGGUHAN respons API di runtime. Versi LAMA (teks polos
 * `{{ item.recipient }}`, SEBELUM fitur dropdown ini) TIDAK kena
 * masalah ini krn interpolasi teks Vue MEMANG aman merender
 * null/undefined jadi string kosong -- baru fitur INI yang rentan,
 * krn manggil `.split()` LANGSUNG di atasnya. Item bermasalah itu
 * KEBETULAN baru muncul di queue SAAT refresh terjadi (bukan pas load
 * awal) -- MURNI soal timing/isi queue saat itu, BUKAN soal mekanisme
 * WebSocket-nya sendiri.
 *
 * FIX: prop diterima sbg `string | null | undefined` (JUJUR
 * mencerminkan kemungkinan bentuk SUNGGUHAN, bukan tipe idealis), dan
 * computed di-guard eksplisit -- kalau bukan string yg valid, anggap
 * array kosong (fallback ke tampilan "-" biasa, TIDAK PERNAH crash).
 *
 * Delimiter field `recipient` dari API BELUM 100% pasti (koma ATAU
 * spasi, sumbernya Flask API eksternal di server Zentyal, di luar
 * kendali kode ini) -- makanya parsing di sini SENGAJA ROBUST thd
 * KEDUA kemungkinan: split berdasarkan RUN koma DAN/ATAU spasi
 * sekaligus (`/[\s,]+/`), BUKAN cuma salah satu -- aman utk format
 * "a@x.com, b@x.com" (koma+spasi), "a@x.com,b@x.com" (koma polos),
 * MAUPUN "a@x.com b@x.com" (spasi polos) tanpa perlu tahu PASTI
 * mana yang benar.
 */
const props = defineProps<{ recipient: string | null | undefined }>()

const recipients = computed(() => {
  if (typeof props.recipient !== "string" || !props.recipient.trim()) return []
  return props.recipient
    .split(/[\s,]+/)
    .map((r) => r.trim())
    .filter(Boolean)
})


const extraCount = computed(() => recipients.value.length - 1)
</script>

<template>
  <span v-if="extraCount === 0" class="text-muted-foreground">{{ recipients[0] || "-" }}</span>
    <Tooltip v-else>
      <TooltipTrigger as-child>
        <span class="cursor-help">
          {{ recipients[0] }} + {{ recipients.length - 1 }} lainnya
        </span>
      </TooltipTrigger>

      <TooltipContent class="w-[220px] bg-yellow-100">
        <div class="space-y-1 text-foreground">
          <p
            v-for="recipient in recipients"
            :key="recipient"
            class="break-all text-xs dark:text-black"
          >
            {{ recipient }}
          </p>
        </div>
      </TooltipContent>
    </Tooltip>
</template>
