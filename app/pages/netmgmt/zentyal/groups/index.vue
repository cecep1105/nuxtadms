<script setup lang="ts">
import type { Paginated, DirectoryGroup } from "#shared/types/api"

const PAGE_SIZE = 20
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
  params.set("_search_fields", "name,description")
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  "zentyal-groups-list",
  () => request<Paginated<DirectoryGroup>>(`/netmgmt/zentyal/groups/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="NetMgmt / Zentyal / Groups">
      <template #description>
        Daftar group Zentyal LDAP (posix &amp; distribution/mailing-list digabung) &amp; kelola keanggotaannya.
        <span class="text-[11px]">
          Badge <Badge variant="secondary" class="mx-0.5 align-middle">posix</Badge> = group keamanan biasa,
          <Badge variant="default" class="mx-0.5 align-middle">distribution</Badge> = mailing list.
        </span>
      </template>
      <template #action><AddZentyalGroupDialog /></template>
    </PageHeader>
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari nama / deskripsi group" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="name" label="Nama Group" /></TableHead>
            <TableHead>Jenis</TableHead>
            <TableHead><RouterOSSortableHeader column-key="description" label="Deskripsi" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="member_count" label="Jumlah Member" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Tidak ada group ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="group in data?.results" :key="group.dn" v-else>
            <TableCell class="font-medium">{{ group.name }}</TableCell>
            <TableCell>
              <Badge v-if="group.kind === 'distribution'" variant="default">distribution</Badge>
              <Badge v-else variant="secondary">posix</Badge>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ group.description || "-" }}</TableCell>
            <TableCell class="text-muted-foreground">{{ group.member_count }}</TableCell>
            <TableCell>
              <div class="flex justify-end">
                <ManageMembersButton source="zentyal" :group-dn="group.dn" :group-name="group.name" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
