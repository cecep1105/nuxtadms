<script setup lang="ts">
import type { UserListPaginated, DjangoApiUser } from "#shared/types/api"

const { request } = useApiClient()
const search = ref("")

const { data, pending, error, refresh } = await useAsyncData(
  "users-list",
  () => request<UserListPaginated<DjangoApiUser>>(`/users/?q=${encodeURIComponent(search.value)}`),
  { watch: [] }
)

function handleSearch() {
  refresh()
}
</script>

<template>
  <div>
    <PageHeader title="Manajemen User" description="Kelola akun staff yang punya akses ke dashboard ini (LDAP & lokal)." />

    <Card>
      <div class="flex items-center gap-2 border-b border-border p-3">
        <form class="flex flex-1 gap-2" @submit.prevent="handleSearch">
          <Input v-model="search" placeholder="Cari username / nama / email..." class="max-w-xs" />
          <Button type="submit" variant="outline" size="sm">Cari</Button>
        </form>
      </div>

      <div v-if="pending" class="p-8 text-center text-sm text-muted-foreground">Memuat...</div>
      <div v-else-if="error" class="p-8 text-center text-sm text-destructive">Gagal memuat data: {{ error.message }}</div>
      <Table v-else>
        <TableHeader>
          <TableRow>
            <TableHead>Username</TableHead>
            <TableHead>Nama</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Sumber Auth</TableHead>
            <TableHead>Status</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="5" class="py-8 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell>
          </TableRow>
          <TableRow v-for="u in data?.results" :key="u.id" v-else>
            <TableCell class="font-mono font-medium">{{ u.username }}</TableCell>
            <TableCell>
              <span class="flex items-center gap-1.5">
                {{ u.full_name || "-" }}
                <Badge v-if="u.emp_pin" variant="secondary" class="font-mono text-[10px]" :title="u.emp_name ?? undefined">PIN {{ u.emp_pin }}</Badge>
              </span>
            </TableCell>
            <TableCell class="text-muted-foreground">{{ u.email || "-" }}</TableCell>
            <TableCell>
              <Badge :variant="u.auth_source === 'ldap' ? 'default' : 'secondary'">{{ u.auth_source }}</Badge>
            </TableCell>
            <TableCell>
              <div class="flex flex-wrap gap-1">
                <Badge :variant="u.is_active ? 'success' : 'secondary'">{{ u.is_active ? "Aktif" : "Nonaktif" }}</Badge>
                <Badge v-if="u.is_staff" variant="default">Staff</Badge>
                <Badge v-if="u.is_superuser" variant="warning">Superuser</Badge>
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
