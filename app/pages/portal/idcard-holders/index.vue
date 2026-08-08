<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { IDCardHolder } from "#shared/types/api"

/**
 * TANPA tombol Edit (SENGAJA, beda dari halaman staff) -- ubah data
 * holder yang SUDAH ada di luar cakupan portal yang disepakati (PATCH/
 * DELETE TETAP staff-only). AddHolderButton (staff) DIPAKAI ULANG APA
 * ADANYA -- generik, endpoint POST /idcard/holders/ sudah permission-
 * nya diperluas terima izin portal can_view_idcard.
 */
const PAGE_SIZE = 20
definePageMeta({ layout: "portal" })

const route = useRoute()
const { request } = useApiClient()

const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(PAGE_SIZE))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  "portal-idcard-holders-list",
  () => request<{ count: number; page: number; results: IDCardHolder[] }>(`/idcard/holders/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Data Visitor / BHL">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
      <template #action><AddHolderButton /></template>
    </PageHeader>
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari nama / no. identitas / perusahaan" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow><TableHead>Nama</TableHead><TableHead>Jenis</TableHead><TableHead>No. Identitas</TableHead><TableHead>Perusahaan/Keperluan</TableHead><TableHead>Berlaku</TableHead></TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Belum ada data.</TableCell>
          </TableRow>
          <TableRow v-for="holder in data?.results" :key="holder.id" v-else>
            <TableCell class="font-medium">{{ holder.full_name }}</TableCell>
            <TableCell><Badge variant="secondary">{{ holder.card_type === "visitor" ? "Visitor" : "BHL" }}</Badge></TableCell>
            <TableCell class="text-muted-foreground">{{ holder.id_number || "-" }}</TableCell>
            <TableCell class="text-muted-foreground">
              {{ holder.card_type === "visitor" ? ([holder.company, holder.purpose].filter(Boolean).join(" — ") || "-") : "-" }}
            </TableCell>
            <TableCell class="text-muted-foreground">
              {{ holder.valid_until ? `s.d. ${new Date(holder.valid_until).toLocaleDateString("id-ID")}` : "Tidak terbatas" }}
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="PAGE_SIZE" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
