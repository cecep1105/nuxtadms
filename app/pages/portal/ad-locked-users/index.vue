<script setup lang="ts">
import { ArrowLeft } from "@lucide/vue"
import type { Paginated, DirectoryUser } from "#shared/types/api"

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
  params.set("_search_fields", "username,display_name,email")
  return params.toString()
})

const { data, pending, error } = await useAsyncData(
  () => `portal-ad-locked-users-${query.value}`,
  () => request<Paginated<DirectoryUser>>(`/netmgmt/ad/users/locked/?${query.value}`),
  { watch: [query] }
)
</script>

<template>
  <div>
    <PageHeader title="Active Directory - Locked Users">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>
    <Card>
      <div class="flex items-center justify-between border-b border-border p-3">
        <SearchBar placeholder="Cari username / nama / email" />
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead><RouterOSSortableHeader column-key="username" label="Username" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="display_name" label="Nama" /></TableHead>
            <TableHead><RouterOSSortableHeader column-key="email" label="Email" /></TableHead>
            <TableHead>Status</TableHead>
            <TableHead><RouterOSSortableHeader column-key="locked_at" label="Terkunci Sejak" /></TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="6" class="py-8 text-center text-muted-foreground">Tidak ada user yang terkunci saat ini.</TableCell>
          </TableRow>
          <TableRow v-for="user in data?.results" :key="user.dn" v-else>
            <TableCell class="font-mono">{{ user.username }}</TableCell>
            <TableCell class="font-medium">{{ user.display_name }}</TableCell>
            <TableCell class="text-muted-foreground">{{ user.email || "-" }}</TableCell>
            <TableCell><Badge variant="destructive">Terkunci</Badge></TableCell>
            <TableCell class="text-muted-foreground" :title="user.locked_at ?? ''">{{ formatRelativeTime(user.locked_at) }}</TableCell>
            <TableCell>
              <div class="flex justify-end">
                <UnlockUserButton :user-dn="user.dn" :user-label="user.display_name || user.username" />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      <PaginationBar v-if="!pending && !error" :count="data?.count ?? 0" :page-size="pageSize" :current-page="Number(route.query.page ?? '1')" />
    </Card>
  </div>
</template>
