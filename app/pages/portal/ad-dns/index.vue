<script setup lang="ts">
import { ArrowLeft, Globe } from "@lucide/vue"
import type { DnsZone, DnsZonePartition } from "#shared/types/api"

const PARTITION_LABELS: Record<DnsZonePartition, { label: string; variant: "default" | "secondary" | "warning" }> = {
  forest: { label: "Forest", variant: "default" },
  domain: { label: "Domain", variant: "secondary" },
  legacy: { label: "Legacy", variant: "warning" },
}

definePageMeta({ layout: "portal" })

const { request } = useApiClient()
const { data, pending, error } = await useAsyncData(
  "portal-ad-dns-zones",
  () => request<{ count: number; results: DnsZone[]; partition_errors: string[] }>("/netmgmt/ad/dns/zones/")
)
</script>

<template>
  <div>
    <PageHeader title="Active Directory - DNS Zones">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>
    <Card>
      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow><TableHead>Nama Zone</TableHead><TableHead>Partisi</TableHead><TableHead class="text-right">Aksi</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="3" class="py-8 text-center text-muted-foreground">Tidak ada zone DNS ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="zone in data?.results" :key="zone.dn" v-else>
            <TableCell class="font-mono font-medium">{{ zone.name }}</TableCell>
            <TableCell><Badge :variant="PARTITION_LABELS[zone.partition].variant">{{ PARTITION_LABELS[zone.partition].label }}</Badge></TableCell>
            <TableCell>
              <div class="flex justify-end">
                <NuxtLink :to="`/portal/ad-dns/${encodeURIComponent(zone.dn)}`" class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <Globe class="h-3.5 w-3.5" /> Lihat Record
                </NuxtLink>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>

    <div v-if="data?.partition_errors.length" class="mt-3 rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">
      <p class="font-medium">Beberapa partisi tidak bisa dicek (mungkin memang tidak ada di AD Anda):</p>
      <ul class="mt-1 list-inside list-disc space-y-0.5">
        <li v-for="err in data.partition_errors" :key="err">{{ err }}</li>
      </ul>
    </div>
  </div>
</template>
