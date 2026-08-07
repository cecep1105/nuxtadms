<script setup lang="ts">
import { RefreshCw } from "@lucide/vue"

/**
 * ⚠️ PENYEDERHANAAN DISENGAJA: versi Next.js py komponen ini "live"
 * lewat WebSocket (dengarkan broadcast Celery Beat check_mailq tiap
 * ~1 menit, auto router.refresh()) -- di sini DISEDERHANAKAN jadi
 * tombol refresh manual, SAMA keputusan dgn Active Device
 * sebelumnya (live-update WS belum diporting, modul inti diprioritaskan
 * dulu). Bisa ditambahkan nanti kalau dibutuhkan.
 */
const loading = ref(false)
async function handleRefresh() {
  loading.value = true
  await refreshNuxtData()
  loading.value = false
}
</script>

<template>
  <Button variant="outline" size="sm" :disabled="loading" @click="handleRefresh">
    <RefreshCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" /> Refresh
  </Button>
</template>
