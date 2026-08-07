<script setup lang="ts">
import type { Paginated, FaceProfile } from "#shared/types/api"

const PAGE_SIZE = 20
const route = useRoute()
const { request } = useApiClient()

const page = computed(() => Number(route.query.page ?? "1"))
const pageSize = computed(() => Number(route.query.page_size ?? PAGE_SIZE))
const query = computed(() => {
  const params = new URLSearchParams({ page: String(page.value), page_size: String(pageSize.value) })
  if (route.query.q) params.set("q", String(route.query.q))
  if (route.query.ordering) params.set("ordering", String(route.query.ordering))
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  "face-profiles-list",
  () => request<Paginated<FaceProfile>>(`/mattendance/admin/face-profiles/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Face Profile" description='Pengambilan wajah untuk mobile attendance -- "hanya dilakukan sekali" per employee, admin bisa buka kunci untuk enrollment ulang.' />
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari PIN..." />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>PIN</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead><SortableHeader label="Status" sort-key="is_locked" /></TableHead>
            <TableHead><SortableHeader label="Didaftarkan" sort-key="enrolled_at" /></TableHead>
            <TableHead><SortableHeader label="Diperbarui" sort-key="updated_at" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Belum ada face profile terdaftar.</TableCell>
          </TableRow>
          <TableRow v-for="profile in data?.results" :key="profile.id" v-else>
            <TableCell class="font-mono">{{ profile.pin }}</TableCell>
            <TableCell class="font-medium">{{ profile.employee_name?.trim() || "-" }}</TableCell>
            <TableCell>
              <Badge v-if="profile.is_locked" variant="warning">🔒 Terkunci</Badge>
              <Badge v-else variant="secondary">Belum dikunci</Badge>
            </TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(profile.enrolled_at).toLocaleString("id-ID") }}</TableCell>
            <TableCell class="font-tabular text-muted-foreground">{{ new Date(profile.updated_at).toLocaleString("id-ID") }}</TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <ToggleLockButton :id="profile.id" :is-locked="profile.is_locked" />
                <DeleteConfirmButton :endpoint="`/mattendance/admin/face-profiles/${profile.id}/`" :label="`Face Profile '${profile.pin} — ${profile.employee_name || 'tanpa nama'}'`" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="data" :count="data.count" :page-size="pageSize" :current-page="page" />
    </Card>
  </div>
</template>
