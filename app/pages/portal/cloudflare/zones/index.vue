<script setup lang="ts">
import { ArrowLeft, Globe } from "@lucide/vue"
import type { Paginated, CloudflareZone } from "#shared/types/api"

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
  () => `portal-cloudflare-zones-${query.value}`,
  () => request<Paginated<CloudflareZone>>(`/netmgmt/cloudflare/zones/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Cloudflare - Domains">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>
    <Card>
      <div class="border-b border-border p-3">
        <SearchBar placeholder="Cari nama domain" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="name" label="Domain" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="status" label="Status" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="3" class="py-8 text-center text-muted-foreground">Tidak ada domain ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="zone in data?.results" :key="zone.id" v-else>
            <TableCell class="font-mono font-medium">{{ zone.name }}</TableCell>
            <TableCell>
              <Badge v-if="zone.paused" variant="warning">Paused</Badge>
              <Badge v-else-if="zone.status === 'active'" variant="success">Active</Badge>
              <Badge v-else variant="secondary">{{ zone.status }}</Badge>
            </TableCell>
            <TableCell>
              <div class="flex justify-end">
                <NuxtLink :to="`/portal/cloudflare/zones/${zone.id}`" class="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline">
                  <Globe class="h-3.5 w-3.5" /> Lihat Record
                </NuxtLink>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
