<script setup lang="ts">
import type { Paginated, MailBlockedSenderRow } from "#shared/types/api"

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
  "zentyal-block-senders-list",
  () => request<Paginated<MailBlockedSenderRow>>(`/netmgmt/zentyal-mail/block-senders/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Zentyal / Blocked Senders" description="Daftar alamat email yang ditolak (REJECT) otomatis oleh Postfix.">
      <template #action><AddBlockedSenderButton /></template>
    </PageHeader>
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari email" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="email" label="Email" /></TableHead>
            <TableHead>Aksi Postfix</TableHead>
            <TableHead><RouterOSSortableHeader column-key="status" label="Status" /></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="3" class="py-8 text-center text-muted-foreground">Belum ada sender yang diblokir.</TableCell>
          </TableRow>
          <TableRow v-for="(row, i) in data?.results" :key="i" v-else>
            <TableCell class="font-mono">{{ row.email }}</TableCell>
            <TableCell class="text-muted-foreground">{{ row.action }}</TableCell>
            <TableCell>
              <Badge v-if="row.status === '1'" variant="destructive">Aktif</Badge>
              <Badge v-else variant="secondary">Nonaktif</Badge>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
