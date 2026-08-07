<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { Paginated, CloudflareDnsRecord } from "#shared/types/api"

const PAGE_SIZE = 20
const route = useRoute()
const zoneId = computed(() => route.params.zoneId as string)
const { request } = useApiClient()

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `cloudflare-records-${zoneId.value}-${query.value}`,
  () => request<Paginated<CloudflareDnsRecord>>(`/netmgmt/cloudflare/zones/${zoneId.value}/records/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Cloudflare / DNS Records">
      <template #description>
        <NuxtLink to="/netmgmt/cloudflare/zones" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Daftar Domain
        </NuxtLink>
      </template>
      <template #action><AddCloudflareRecordButton :zone-id="zoneId" /></template>
    </PageHeader>
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari nama / isi / tipe record" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="name" label="Nama" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="type" label="Tipe" /></TableHead>
            <TableHead>Isi</TableHead>
            <TableHead><RouterOSSortableHeader column-key="ttl" label="TTL" /></TableHead>
            <TableHead>Proxy</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Tidak ada record ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="record in data?.results" :key="record.id" v-else>
            <TableCell class="font-mono">{{ record.name }}</TableCell>
            <TableCell><Badge variant="secondary">{{ record.type }}</Badge></TableCell>
            <TableCell class="max-w-xs truncate font-mono text-muted-foreground" :title="record.content">
              {{ record.type === "MX" && record.priority != null ? `${record.priority} ${record.content}` : record.content }}
            </TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ record.ttl === 1 ? "Auto" : record.ttl }}</TableCell>
            <TableCell>
              <Badge v-if="record.proxiable" :variant="record.proxied ? 'success' : 'secondary'">{{ record.proxied ? "Proxied" : "DNS Only" }}</Badge>
              <span v-else class="text-xs text-muted-foreground">-</span>
            </TableCell>
            <TableCell><CloudflareRecordActionsMenu :zone-id="zoneId" :record="record" /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
