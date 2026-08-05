<script setup lang="ts">
import type { UserListPaginated, DjangoApiUser } from "#shared/types/api"

const { request } = useApiClient()
const { user: currentUser } = useUserSession()
const search = ref("")

const { data, pending, error, refresh } = await useAsyncData(
  "users-list",
  () => request<UserListPaginated<DjangoApiUser>>(`/users/?q=${encodeURIComponent(search.value)}`),
  { watch: [] }
)

const isSuperuser = computed(() => currentUser.value?.is_superuser ?? false)
const currentUserId = computed(() => currentUser.value?.id)

function handleSearch() {
  refresh()
}
</script>

<template>
  <div>
    <PageHeader title="Manajemen User" description="Kelola akun staff yang punya akses ke dashboard ini (LDAP & lokal).">
      <template #action>
        <UserFormDialog mode="create" :is-superuser="isSuperuser" />
      </template>
    </PageHeader>

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
            <TableHead>Departemen</TableHead>
            <TableHead>Status</TableHead>
            <TableHead class="text-right">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow v-if="!data?.results.length">
            <TableCell :colspan="7" class="py-8 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell>
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
            <TableCell class="text-muted-foreground">{{ u.department || "-" }}</TableCell>
            <TableCell>
              <div class="flex flex-wrap gap-1">
                <Badge :variant="u.is_active ? 'success' : 'secondary'">{{ u.is_active ? "Aktif" : "Nonaktif" }}</Badge>
                <Badge v-if="u.is_staff" variant="default">Staff</Badge>
                <Badge v-if="u.is_superuser" variant="warning">Superuser</Badge>
                <Badge v-if="u.must_change_password" variant="outline">Wajib ganti pw</Badge>
              </div>
            </TableCell>
            <TableCell>
              <div class="flex justify-end gap-0.5">
                <UserFormDialog mode="edit" :user="u" />
                <ResetPasswordDialog v-if="u.auth_source === 'local'" :user-id="u.id" :username="u.username" />
                <ToggleActiveButton
                  :user-id="u.id" :is-active="u.is_active"
                  :disabled="u.id === currentUserId"
                  :disabled-reason="u.id === currentUserId ? 'Tidak dapat mengubah status akun sendiri' : undefined"
                />
                <ManagePermissionsDialog :user-id="u.id" :username="u.username" :is-staff="u.is_staff" />
                <SetStaffButton
                  v-if="isSuperuser"
                  :user-id="u.id" :is-staff="u.is_staff"
                  :disabled="u.id === currentUserId"
                  :disabled-reason="u.id === currentUserId ? 'Tidak dapat mengubah role sendiri' : undefined"
                />
                <!-- Hapus user CUMA boleh superuser, TIDAK CUKUP staff biasa -- sama catatan dgn versi Next.js. -->
                <DeleteConfirmButton
                  v-if="isSuperuser && !u.is_superuser"
                  :endpoint="`/users/${u.id}/`" :label="`User '${u.username}'`"
                  :disabled="u.id === currentUserId"
                  :disabled-reason="u.id === currentUserId ? 'Tidak dapat menghapus akun sendiri' : undefined"
                />
              </div>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </Card>
  </div>
</template>
