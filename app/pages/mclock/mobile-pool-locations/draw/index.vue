<script setup lang="ts">
import type { Paginated, MobilePool } from "#shared/types/api"

const { request } = useApiClient()
const { data: poolsData } = await useAsyncData("draw-new-pools", () => request<Paginated<MobilePool>>("/mclock/mobile-pool/?page_size=200"))
</script>

<template>
  <div>
    <PageHeader title="Gambar Polygon di Peta">
      <template #description>
        <NuxtLink to="/mclock/mobile-pool-locations" class="text-primary hover:underline">← Kembali ke Mobile Pool Location</NuxtLink>
      </template>
    </PageHeader>
    <PoolLocationMapDrawer pool-id="" :existing-points="[]" :known-pool-ids="(poolsData?.results ?? []).map((p) => p.PoolID)" />
  </div>
</template>
