<script setup lang="ts">
import type { Paginated, ITInfraCategory, ITInfraEntrySummary } from "#shared/types/api"

const PAGE_SIZE = 20
const route = useRoute()
const { request } = useApiClient()

const { data: categoriesData } = await useAsyncData(
  "itinfra-categories",
  () => request<{ results: ITInfraCategory[] }>("/netmgmt/itinfra/categories/")
)
const categories = computed(() => categoriesData.value?.results ?? [])

const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams()
  if (route.query.category) params.set("category_id", String(route.query.category))
  if (route.query.sortBy) params.set("_sort_by", String(route.query.sortBy))
  if (route.query.sortDir) params.set("_order", String(route.query.sortDir))
  if (route.query.q) params.set("_q", String(route.query.q))
  if (route.query.page) params.set("_page", String(route.query.page))
  params.set("_limit", String(pageSize.value))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `itinfra-entries-${query.value}`,
  () => request<Paginated<ITInfraEntrySummary>>(`/netmgmt/itinfra/entries/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Data IT-Infra" description="Registry data infrastruktur bebas -- langganan internet, VPS, domain, dll. Isi (password dkk) baru terlihat saat dibuka detail/edit.">
      <template #action>
        <div class="flex items-center gap-2">
          <AddCategoryDialog />
          <AddItInfraButton :categories="categories" />
        </div>
      </template>
    </PageHeader>
    <Card>
      <div class="flex flex-wrap items-center justify-between gap-3 border-b border-border p-3">
        <SearchBar placeholder="Cari nama / catatan / kategori" />
        <div class="flex flex-wrap gap-1.5">
          <NuxtLink
            to="/netmgmt/itinfra"
            :class="['rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', !route.query.category ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground']"
          >
            Semua
          </NuxtLink>
          <NuxtLink
            v-for="c in categories" :key="c.id" :to="`/netmgmt/itinfra?category=${c.id}`"
            :class="['rounded-md border px-2.5 py-1 text-xs font-medium transition-colors', String(route.query.category) === String(c.id) ? 'border-primary bg-primary/10 text-primary' : 'border-border text-muted-foreground hover:bg-secondary hover:text-foreground']"
          >
            {{ c.name }}
          </NuxtLink>
        </div>
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
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">
              {{ categories.length === 0 ? "Belum ada kategori -- buat kategori dulu sebelum menambah data." : "Tidak ada data ditemukan." }}
            </TableCell>
          </TableRow>
          <TableRow v-for="entry in data?.results" :key="entry.id" v-else>
            <TableCell><Badge variant="secondary">{{ entry.category_name }}</Badge></TableCell>
            <TableCell class="font-medium">
              <span class="flex items-center gap-1.5">
                {{ entry.name }}
                <Badge v-if="entry.is_staff_only" variant="warning" class="text-[10px]">Staff Only</Badge>
              </span>
            </TableCell>
            <TableCell class="max-w-xs truncate text-muted-foreground" :title="entry.notes">{{ entry.notes || "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ new Date(entry.updated_at).toLocaleString("id-ID") }}</TableCell>
            <TableCell><ItInfraActionsMenu :entry="entry" :categories="categories" /></TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
