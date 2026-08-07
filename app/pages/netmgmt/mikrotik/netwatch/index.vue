<script setup lang="ts">
import type { MikrotikNetwatchItem } from "#shared/types/api"

const config = useRuntimeConfig()
const routerIp = config.public.mikrotikNetwatchRouterIp
const basePath = `/netmgmt/routeros/${routerIp}/tool-netwatch`

const { request } = useApiClient()
const { data, pending, error } = await useAsyncData(
  "mikrotik-netwatch",
  () => request<{ results: MikrotikNetwatchItem[] }>(`${basePath}/?_limit=1000`)
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Mikrotik Netwatch" description="Mikrotik Host Monitoring.">
      <template #action><AddNetwatchButton :base-path="basePath" /></template>
    </PageHeader>

    <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
    <div v-else-if="error" class="rounded-lg border border-destructive/30 bg-destructive/10 p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
    <NetwatchView v-else :items="data?.results ?? []" :base-path="basePath" />
  </div>
</template>
