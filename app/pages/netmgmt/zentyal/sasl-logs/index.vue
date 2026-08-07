<script setup lang="ts">
import type { Paginated, MailAuthFailLogEntry } from "#shared/types/api"

const PAGE_SIZE = 20
const route = useRoute()
const time = computed(() => (route.query.time as string) ?? "minute")
const { request } = useApiClient()

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams({ time: time.value })
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `zentyal-sasl-logs-${query.value}`,
  () => request<Paginated<MailAuthFailLogEntry>>(`/netmgmt/zentyal-mail/sasl-logs/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Zentyal / SASL Logs" description="Percobaan autentikasi SASL (SMTP) yang GAGAL, dikelompokkan per IP -- indikasi kemungkinan brute-force." />
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <TimeFilterLinks base-path="/netmgmt/zentyal/sasl-logs" :current="time" />
        <SearchBar placeholder="Cari IP" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="date" label="Waktu" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="ip" label="IP" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="count" label="Jumlah Percobaan" /></TableHead>
            <TableHead>Catatan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="4" class="py-8 text-center text-muted-foreground">Tidak ada percobaan gagal pada rentang waktu ini.</TableCell>
          </TableRow>
          <TableRow v-for="(entry, i) in data?.results" :key="i" v-else>
            <TableCell class="text-muted-foreground">{{ entry.date }}</TableCell>
            <TableCell class="font-mono">{{ entry.ip }}</TableCell>
            <TableCell>
              <Badge :variant="(entry.count ?? 1) > 3 ? 'destructive' : 'secondary'">{{ entry.count }}x</Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ entry.notes }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
