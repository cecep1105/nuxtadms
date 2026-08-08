<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { IDCardListItem, IDCardStatus } from "#shared/types/api"

/**
 * TAMPILAN GRID VISUAL (bukan tabel spt versi staff) -- SENGAJA, krn
 * user yang akses menu portal ini yang akan MEMANAGE kartu2 tersebut
 * sehari-hari (lebih intuitif lihat kartu sbg GAMBAR yg dikenali
 * sekilas, drpd baris data teknis).
 */
const PAGE_SIZE = 24
const STATUS_VARIANT: Record<IDCardStatus, "success" | "secondary" | "destructive" | "warning"> = {
  belum_cetak: "secondary", sudah_cetak: "success", hilang: "destructive", cetak_ulang: "warning",
}

definePageMeta({ layout: "portal" })

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
  "portal-idcard-cards-list",
  () => request<{ count: number; page: number; results: IDCardListItem[] }>(`/idcard/cards/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Daftar ID Card">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>

    <div class="mb-4">
      <SearchBar placeholder="Cari nama / PIN / no. identitas" />
    </div>

    <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
    <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
    <Card v-else-if="!data?.results.length" class="py-12 text-center text-sm text-muted-foreground">Belum ada kartu.</Card>
    <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      <NuxtLink v-for="card in data.results" :key="card.id" :to="`/portal/idcard-cards/${card.id}`">
        <Card class="overflow-hidden transition-shadow hover:shadow-md">
          <img :src="resolveMediaUrl(card.card_image)" :alt="card.holder_name" class="aspect-[54/86] w-full object-cover" />
          <div class="space-y-1 p-2.5">
            <p class="truncate text-sm font-medium">{{ card.holder_name }}</p>
            <p class="truncate font-mono text-xs text-muted-foreground">{{ card.holder_identifier || "-" }}</p>
            <div class="flex items-center justify-between gap-1 pt-0.5">
              <Badge variant="secondary" class="text-[10px]">{{ card.card_type_label }}</Badge>
              <Badge :variant="STATUS_VARIANT[card.status]" class="text-[10px]">{{ card.status_label }}</Badge>
            </div>
          </div>
        </Card>
      </NuxtLink>
    </div>

    <div class="mt-4">
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="PAGE_SIZE" :current-page="Number(route.query.page ?? '1')" />
    </div>
  </div>
</template>
