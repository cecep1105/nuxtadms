<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { Paginated, ITInfraEntrySummary } from "#shared/types/api"

/**
 * TIDAK ada filter tab kategori & TIDAK ada tombol Tambah (SENGAJA,
 * beda dari halaman staff) -- endpoint kategori TETAP staff-only, cari
 * berdasarkan kategori tetap bisa lewat search bar biasa. Entry yang
 * ditandai is_staff_only OTOMATIS TIDAK MUNCUL di sini SAMA SEKALI
 * (disaring di BACKEND) -- bukan cuma disembunyikan di tampilan.
 */
const PAGE_SIZE = 20
definePageMeta({ layout: "portal" })

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
  () => `portal-itinfra-${query.value}`,
  () => request<Paginated<ITInfraEntrySummary>>(`/netmgmt/itinfra/entries/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Data IT-Infra">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari nama / catatan / kategori" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="category_name" label="Kategori" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="name" label="Nama" /></TableHead>
            <TableHead>Catatan</TableHead>
            <TableHead><RouterOSSortableHeader column-key="updated_at" label="Diperbarui" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Tidak ada data ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="entry in data?.results" :key="entry.id" v-else>
            <TableCell><Badge variant="secondary">{{ entry.category_name }}</Badge></TableCell>
            <TableCell class="font-medium">{{ entry.name }}</TableCell>
            <TableCell class="max-w-xs truncate text-muted-foreground" :title="entry.notes">{{ entry.notes || "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ new Date(entry.updated_at).toLocaleString("id-ID") }}</TableCell>
            <TableCell>
              <div class="flex justify-end">
                <ViewItInfraDetailButton :entry-id="entry.id" :entry-name="entry.name" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
