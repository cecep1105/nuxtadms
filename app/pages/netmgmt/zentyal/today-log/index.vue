<script setup lang="ts">
import type { Paginated, MailTodayLogEntry } from "#shared/types/api"

const PAGE_SIZE = 20
const route = useRoute()
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
  "zentyal-today-log-list",
  () => request<Paginated<MailTodayLogEntry>>(`/netmgmt/zentyal-mail/today-log/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Zentyal / Today's Log" :description="`Ringkasan email masuk/keluar hari ini (${data?.count ?? 0} entri).`" />
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari sender / Queue ID" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="date" label="Waktu" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="qid" label="Queue ID" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="sender" label="Pengirim" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="size" label="Ukuran" /></TableHead>
            <TableHead>Jml Penerima</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Belum ada log hari ini.</TableCell>
          </TableRow>
          <TableRow v-for="(entry, i) in data?.results" :key="`${entry.qid}-${i}`" v-else>
            <TableCell class="text-muted-foreground">{{ entry.date }}</TableCell>
            <TableCell class="font-mono">{{ entry.qid }}</TableCell>
            <TableCell class="text-muted-foreground">{{ entry.sender }}</TableCell>
            <TableCell class="text-muted-foreground">{{ entry.size }}</TableCell>
            <TableCell class="text-muted-foreground">{{ entry.total_recp }}</TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
