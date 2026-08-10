<script setup lang="ts">
import type { MailQueueResponse } from "#shared/types/api"

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
  "zentyal-mail-queue",
  () => request<MailQueueResponse>(`/netmgmt/zentyal-mail/queue/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Zentyal / Mail Queue" description="Daftar pesan di mail queue Postfix -- Requeue/Delete per pesan, atau hapus sekaligus per sender.">
      <template #action><DeleteBySenderButton /></template>
    </PageHeader>
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <div class="flex flex-wrap items-center gap-3">
          <SearchBar placeholder="Cari Queue ID / sender / recipient" />
          <!-- Indikator ringkas Total/Active/Deferred -- angka GLOBAL (seluruh
               queue), TIDAK berubah walau lagi difilter/pindah halaman. -->
          <div v-if="data" class="flex items-center gap-2">
            <Badge variant="secondary" class="gap-1">Total <span class="font-tabular font-semibold">{{ data.total_count }}</span></Badge>
            <Badge variant="success" class="gap-1">Active <span class="font-tabular font-semibold">{{ data.active_count }}</span></Badge>
            <Badge variant="warning" class="gap-1">Deferred <span class="font-tabular font-semibold">{{ data.deferred_count }}</span></Badge>
          </div>
        </div>
        <div class="flex items-center gap-3">
          <MailQueueLiveRefresher />
          <MailQueueRefreshButton />
        </div>
      </div>

      <!-- ⚠️ BUG YANG SUDAH DIPERBAIKI (tabel terlihat "dikosongkan lalu
           diisi" tiap kali live-refresh WebSocket jalan, MENGGANGGU --
           Next.js versi lama TIDAK begini): SEBELUMNYA kondisi di sini
           cuma `v-if="pending"` -- `pending` dari useAsyncData KEMBALI
           true SETIAP KALI refreshNuxtData() dipanggil (BUKAN cuma saat
           load PERTAMA kali), jadi tabel yang SUDAH terisi data ikut
           DIGANTI SEMENTARA jadi teks "Memuat..." tiap ~1 menit
           (broadcast mailq), padahal DATA LAMA MASIH ADA & SAH utk
           ditampilkan selagi data BARU sedang diambil -- flicker ini
           PERSIS yang dilaporkan.
           FIX: tambahkan `&& !data` -- loading text HANYA muncul saat
           BENAR-BENAR belum ada data sama sekali (load pertama kali),
           SETELAH itu tabel LAMA tetap tampil TANPA terganti apa pun
           selama refresh background jalan, baru diam-diam berganti ke
           data BARU begitu selesai (Vue reactivity + :key per baris
           yang SUDAH benar bikin transisinya halus, HANYA sel yang
           ISINYA beneran berubah yang ke-update di DOM). -->
      <div v-if="pending && !data" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error && !data" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else-if="data">
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="id" label="Queue ID" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="status" label="Status" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="size" label="Ukuran" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="rawdate" label="Tanggal" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="sender" label="Pengirim" /></TableHead>
            <TableHead>Penerima</TableHead>
            <TableHead>Alasan Ditunda</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="8" class="py-8 text-center text-muted-foreground">Mail queue kosong.</TableCell>
          </TableRow>
          <TableRow v-for="item in data?.results" :key="item.id" v-else>
            <TableCell class="font-mono">{{ item.id }}</TableCell>
            <TableCell>
              <Badge v-if="item.status === 'active'" variant="success">Active</Badge>
              <Badge v-else variant="warning">Deferred</Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ item.size }}</TableCell>
            <TableCell class="text-muted-foreground">{{ item.rawdate }}</TableCell>
            <TableCell class="text-muted-foreground">{{ item.sender }}</TableCell>
            <TableCell class="max-w-xs text-muted-foreground"><RecipientListPopover :recipient="item.recipient" /></TableCell>
            <TableCell class="max-w-xs truncate text-muted-foreground" :title="item.reason">{{ item.reason || "-" }}</TableCell>
            <TableCell><QueueItemActions :qid="item.id" /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
