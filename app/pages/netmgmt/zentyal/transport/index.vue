<script setup lang="ts">
import type { MailTransportRow } from "#shared/types/api"

const { request } = useApiClient()
const { data, pending, error } = await useAsyncData(
  "zentyal-transport",
  () => request<{ result: MailTransportRow[] }>("/netmgmt/zentyal-mail/transport/")
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Zentyal / Transport Map" description="Aturan routing domain -> relay tujuan Postfix. Simpan akan otomatis reload & flush Postfix." />
    <Card>
      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <TransportMapEditor v-else :initial-rows="data?.result ?? []" />
    </Card>
  </div>
</template>
