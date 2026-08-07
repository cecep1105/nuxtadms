<script setup lang="ts">
import type { Paginated, MobilePool, MobilePoolLoc } from "#shared/types/api"

const route = useRoute()
const poolId = computed(() => decodeURIComponent(route.params.poolId as string))
const { request } = useApiClient()

// ?q= adalah pencarian substring (icontains), jadi filter LAGI di client
// supaya cocok PERSIS PoolID ini saja (bukan PoolID lain yg kebetulan
// mengandung substring sama) -- SAMA catatan dgn versi Next.js.
const { data: locData } = await useAsyncData(
  () => `draw-edit-loc-${poolId.value}`,
  () => request<Paginated<MobilePoolLoc>>(`/mclock/mobile-pool-loc/?q=${encodeURIComponent(poolId.value)}&page_size=200`)
)
const { data: poolsData } = await useAsyncData("draw-edit-pools", () => request<Paginated<MobilePool>>("/mclock/mobile-pool/?page_size=200"))

const points = computed(() =>
  (locData.value?.results ?? [])
    .filter((p) => p.PoolID === poolId.value)
    .sort((a, b) => a.Urut - b.Urut)
    .map((p) => ({ Latitude: p.Latitude, Longitude: p.Longitude }))
)
</script>

<template>
  <div>
    <PageHeader :title="`Edit Polygon — ${poolId}`">
      <template #description>
        <NuxtLink to="/mclock/mobile-pool-locations" class="text-primary hover:underline">← Kembali ke Mobile Pool Location</NuxtLink>
      </template>
    </PageHeader>
    <PoolLocationMapDrawer :pool-id="poolId" :existing-points="points" :known-pool-ids="(poolsData?.results ?? []).map((p) => p.PoolID)" />
  </div>
</template>
