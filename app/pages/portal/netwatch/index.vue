<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { MikrotikNetwatchItem } from "#shared/types/api"

/**
 * SEMUA host diambil SEKALIGUS (_limit besar, TANPA pagination) --
 * SAMA pola dgn staff, krn update SETELAHNYA murni via WebSocket
 * (daftar LENGKAP tiap broadcast), rekonsiliasi dgn pagination
 * server-side jadi rumit tanpa banyak manfaat.
 */
definePageMeta({ layout: "portal" })

const { request } = useApiClient()
const { data, pending, error } = await useAsyncData(
  "portal-netwatch",
  () => request<{ results: MikrotikNetwatchItem[] }>("/netmgmt/portal/netwatch/?_limit=1000")
)
</script>

<template>
  <div>
    <PageHeader title="Netwatch">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>

    <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
    <div v-else-if="error" class="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
    <PortalNetwatchLiveView v-else :initial-data="data?.results ?? []" />
  </div>
</template>
