<script setup lang="ts">
import type { IDCardListItem, IDCardStatus } from "#shared/types/api"

const PAGE_SIZE = 20
const STATUS_VARIANT: Record<IDCardStatus, "success" | "secondary" | "destructive" | "warning"> = {
  belum_cetak: "secondary", sudah_cetak: "success", hilang: "destructive", cetak_ulang: "warning",
}

const route = useRoute()
const { request } = useApiClient()

const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  if (route.query.status) params.set("status", String(route.query.status))
  if (route.query.card_type) params.set("card_type", String(route.query.card_type))
  params.set("_limit", String(PAGE_SIZE))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  "idcard-cards-list",
  () => request<{ count: number; page: number; results: IDCardListItem[] }>(`/idcard/cards/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Daftar ID Card" description="Semua kartu yang sudah digenerate, beserta status cetaknya." />
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari nama / PIN / no. identitas" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Preview</TableHead><TableHead>Jenis</TableHead><TableHead>Nama</TableHead>
            <TableHead>PIN/No. Identitas</TableHead><TableHead>Template</TableHead><TableHead>Status</TableHead>
            <TableHead>Dibuat</TableHead><TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="8" class="py-8 text-center text-muted-foreground">Belum ada kartu.</TableCell>
          </TableRow>
          <TableRow v-for="card in data?.results" :key="card.id" v-else>
            <TableCell>
              <NuxtLink :to="`/idcard/cards/${card.id}`">
                <img :src="resolveMediaUrl(card.card_image)" :alt="card.holder_name" class="h-16 w-11 rounded border border-border object-cover" />
              </NuxtLink>
            </TableCell>
            <TableCell><Badge variant="secondary">{{ card.card_type_label }}</Badge></TableCell>
            <TableCell>
              <NuxtLink :to="`/idcard/cards/${card.id}`" class="font-medium hover:text-primary hover:underline">{{ card.holder_name }}</NuxtLink>
            </TableCell>
            <TableCell class="font-mono text-muted-foreground">{{ card.holder_identifier || "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ card.template_name }}</TableCell>
            <TableCell><Badge :variant="STATUS_VARIANT[card.status]">{{ card.status_label }}</Badge></TableCell>
            <TableCell class="text-muted-foreground">{{ new Date(card.generated_at).toLocaleDateString("id-ID") }}</TableCell>
            <TableCell>
              <div class="flex justify-end"><DeleteCardRowButton :card-id="card.id" :holder-name="card.holder_name" /></div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="PAGE_SIZE" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
