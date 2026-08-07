<script setup lang="ts">
import { MapPin } from "@lucide/vue"
import type { Paginated, MobilePoolLoc, MobilePool } from "#shared/types/api"

const PAGE_SIZE = 10

/**
 * Data titik geofence datang FLAT (per-titik, bukan per-Pool) dari API --
 * dikelompokkan per PoolID DI SINI (client), BUKAN via ?ordering=/?page=
 * ke Django langsung (API-nya cuma tahu baris titik individual, tidak
 * tahu konsep "per pool"). Ambil SEMUA titik sekaligus (page_size besar,
 * data ini biasanya tidak besar: jumlah pool x rata2 titik polygon),
 * kelompokkan, urutkan, BARU terapkan pagination atas HASIL kelompokan
 * (per Pool) -- SAMA PERSIS pola versi Next.js (Server Component).
 */
const route = useRoute()
const { request } = useApiClient()

const { data: locData, pending, error } = await useAsyncData(
  "mobile-pool-locations-all",
  () => request<Paginated<MobilePoolLoc>>("/mclock/mobile-pool-loc/?page_size=2000")
)
const { data: poolsData } = await useAsyncData(
  "mobile-pool-locations-pools",
  () => request<Paginated<MobilePool>>("/mclock/mobile-pool/?page_size=200")
)

const page = computed(() => Number(route.query.page ?? "1"))
const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const ordering = computed(() => (route.query.ordering as string) ?? "")

const allPools = computed(() => {
  const grouped = new Map<string, MobilePoolLoc[]>()
  for (const point of locData.value?.results ?? []) {
    const list = grouped.get(point.PoolID) ?? []
    list.push(point)
    grouped.set(point.PoolID, list)
  }
  const pools = Array.from(grouped.entries()).map(([poolId, points]) => ({
    poolId,
    points: [...points].sort((a, b) => a.Urut - b.Urut),
  }))

  // Sorting DIHITUNG DI SINI -- field yg bisa di-sort (poolId/pointCount/
  // status) itu HASIL KOMPUTASI lokal, bukan field asli di Django.
  // SortableHeader tetap dipakai apa adanya (cuma generate link
  // ?ordering=, tidak peduli field-nya "asli" Django atau lokal spt ini).
  const sortKey = ordering.value.replace(/^-/, "")
  const sortDesc = ordering.value.startsWith("-")
  const compareFns: Record<string, (a: (typeof pools)[number], b: (typeof pools)[number]) => number> = {
    poolId: (a, b) => a.poolId.localeCompare(b.poolId),
    pointCount: (a, b) => a.points.length - b.points.length,
    status: (a, b) => Number(a.points.length >= 3) - Number(b.points.length >= 3),
  }
  const compareFn = compareFns[sortKey] ?? compareFns.poolId!
  pools.sort((a, b) => (sortDesc ? -compareFn(a, b) : compareFn(a, b)))
  return pools
})

const totalPools = computed(() => allPools.value.length)
const pools = computed(() => allPools.value.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))
</script>

<template>
  <div>
    <PageHeader title="Mobile Pool Location (Geofence)" description="Titik polygon geofence per Pool -- klik 'Gambar di Peta' untuk menggambar/mengedit visual.">
      <template #action>
        <div class="flex gap-2">
          <AddPointDialog :pools="poolsData?.results ?? []" />
          <Button size="sm" as-child>
            <NuxtLink to="/mclock/mobile-pool-locations/draw"><MapPin class="h-3.5 w-3.5" /> Gambar Polygon Baru</NuxtLink>
          </Button>
        </div>
      </template>
    </PageHeader>

    <Card>
      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><SortableHeader label="Pool ID" sort-key="poolId" /></TableHead>
            <TableHead><SortableHeader label="Jumlah Titik" sort-key="pointCount" /></TableHead>
            <TableHead><SortableHeader label="Status" sort-key="status" /></TableHead>
            <TableHead>Titik Pertama</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!pools.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Belum ada polygon geofence tersimpan.</TableCell>
          </TableRow>
          <TableRow v-for="{ poolId, points } in pools" :key="poolId" v-else>
            <TableCell class="font-mono font-medium">{{ poolId }}</TableCell>
            <TableCell class="text-muted-foreground">{{ points.length }} titik</TableCell>
            <TableCell>
              <Badge v-if="points.length >= 3" variant="success">Valid</Badge>
              <Badge v-else variant="warning">Kurang titik (min. 3)</Badge>
            </TableCell>
            <TableCell class="font-mono text-[11px] text-muted-foreground">
              {{ points[0] ? `${points[0].Latitude}, ${points[0].Longitude}` : "-" }}
            </TableCell>
            <TableCell>
              <div class="flex justify-end">
                <Button variant="ghost" size="sm" as-child>
                  <NuxtLink :to="`/mclock/mobile-pool-locations/draw/${encodeURIComponent(poolId)}`"><MapPin class="h-3.5 w-3.5" /> Edit di Peta</NuxtLink>
                </Button>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="totalPools" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
