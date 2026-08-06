<script setup lang="ts">
import { Smartphone } from "@lucide/vue"
import type { Paginated, Transaction } from "#shared/types/api"

const PAGE_SIZE = 20
const route = useRoute()
const { request } = useApiClient()

const page = computed(() => Number(route.query.page ?? "1"))
const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))

const query = computed(() => {
  const params = new URLSearchParams({ page: String(page.value), page_size: String(pageSize.value) })
  if (route.query.q) params.set("q", String(route.query.q))
  if (route.query.ordering) params.set("ordering", String(route.query.ordering))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  "transactions-list",
  () => request<Paginated<Transaction>>(`/iclock/transaction/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Transaction" description="Riwayat absensi -- data mesin ini dibuat otomatis via PUSH SDK/mobile, tidak untuk diedit manual." />
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari PIN / Nama employee..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="Waktu" sort-key="TTime" /></TableHead>
            <TableHead>Employee</TableHead>
            <TableHead>Device / Sumber</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Verify</TableHead>
            <TableHead><SortableHeader label="Function" sort-key="Function" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada transaksi ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="trx in data?.results" :key="trx.id" v-else>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(trx.TTime).toLocaleString("id-ID") }}</TableCell>
            <TableCell>
              <p class="font-medium">{{ trx.EmployeeName?.trim() || "-" }}</p>
              <p class="font-mono text-[11px] text-muted-foreground">{{ trx.EmployeePIN }}</p>
            </TableCell>
            <TableCell>
              <Badge v-if="trx.SN === 'ABSENDIGITAL01'" variant="default"><Smartphone class="mr-1 h-2.5 w-2.5" /> Mobile</Badge>
              <span v-else class="font-mono text-muted-foreground">{{ trx.SN ?? "-" }}</span>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ trx.StateDisplay }}</TableCell>
            <TableCell class="text-muted-foreground">{{ trx.SN === "ABSENDIGITAL01" ? `Pool ${trx.Verify}` : trx.VerifyDisplay }}</TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ trx.Function ?? "-" }}</TableCell>
            <TableCell>
              <div class="flex justify-end">
                <DeleteConfirmButton
                  :endpoint="`/iclock/transaction/${trx.id}/`"
                  :label="`Transaksi ${trx.EmployeeName || trx.EmployeePIN} pada ${new Date(trx.TTime).toLocaleString('id-ID')}`"
                />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
