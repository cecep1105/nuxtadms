<script setup lang="ts">
import { Loader2, RefreshCw, ShieldCheck, Shield, Trash2 } from "@lucide/vue"
import type { DeviceLiveUser } from "#shared/types/api"

const PRIVILEGE_ADMIN = 14
const PAGE_SIZE = 10
type SortKey = "user_id" | "name" | "privilege"

const props = defineProps<{ sn: string; alias: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const users = ref<DeviceLiveUser[]>([])
const count = ref(0)
const search = ref("")
const debouncedSearch = ref("")
const page = ref(1)
const sortKey = ref<SortKey>("user_id")
const sortDir = ref<"asc" | "desc">("asc")
const busyUserId = ref<string | null>(null)

async function loadUsers() {
  loading.value = true
  error.value = null
  try {
    const params = new URLSearchParams({ page: String(page.value), page_size: String(PAGE_SIZE), sort: sortKey.value, dir: sortDir.value })
    if (debouncedSearch.value) {
      if (/^\d+$/.test(debouncedSearch.value)) params.set("pin", debouncedSearch.value)
      else params.set("name", debouncedSearch.value)
    }
    const data = await request<{ count: number; results: DeviceLiveUser[] }>(`/iclock/active-device/${props.sn}/live-users/?${params.toString()}`)
    users.value = data.results
    count.value = data.count
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengambil daftar user dari device.")
  } finally {
    loading.value = false
  }
}

let debounceHandle: ReturnType<typeof setTimeout> | undefined
watch(search, (v) => {
  if (debounceHandle) clearTimeout(debounceHandle)
  debounceHandle = setTimeout(() => { debouncedSearch.value = v }, 400)
})
watch(debouncedSearch, () => { page.value = 1 })
watch([open, page, sortKey, sortDir, debouncedSearch], () => { if (open.value) loadUsers() })

function handleSort(key: string) {
  const k = key as SortKey
  if (k === sortKey.value) sortDir.value = sortDir.value === "asc" ? "desc" : "asc"
  else { sortKey.value = k; sortDir.value = "asc" }
}

async function handleTogglePrivilege(u: DeviceLiveUser) {
  busyUserId.value = u.user_id
  try {
    await request(`/iclock/active-device/${props.sn}/user-toggle-privilege/`, {
      method: "POST", body: JSON.stringify({ user_id: u.user_id, current_privilege: u.privilege }),
    })
    await loadUsers()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah privilege user.")
  } finally {
    busyUserId.value = null
  }
}

async function handleDeleteUser(u: DeviceLiveUser) {
  if (!confirm(`Hapus user '${u.user_id}' (${u.name}) dari device fisik '${props.alias}'? Tindakan ini tidak bisa dibatalkan.`)) return
  busyUserId.value = u.user_id
  try {
    await request(`/iclock/active-device/${props.sn}/user-delete/`, { method: "POST", body: JSON.stringify({ user_id: u.user_id }) })
    await loadUsers()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus user dari device.")
  } finally {
    busyUserId.value = null
  }
}

const totalPages = computed(() => Math.max(1, Math.ceil(count.value / PAGE_SIZE)))
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[85vh] max-w-2xl overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Live Users — {{ alias }}</DialogTitle>
        <DialogDescription>Daftar user yang BENAR-BENAR tersimpan di memori device saat ini (koneksi langsung, bukan dari database).</DialogDescription>
      </DialogHeader>

      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

      <div class="flex items-center gap-2">
        <Input v-model="search" placeholder="Cari PIN (angka) / nama..." class="flex-1" />
        <Button variant="outline" size="icon" aria-label="Muat ulang" @click="loadUsers" :disabled="loading">
          <RefreshCw :class="['h-3.5 w-3.5', loading && 'animate-spin']" />
        </Button>
      </div>

      <div class="overflow-y-auto rounded-md border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <SortableTh label="PIN" sort-key="user_id" :current-sort="sortKey" :current-dir="sortDir" @sort="handleSort" />
              <SortableTh label="Nama" sort-key="name" :current-sort="sortKey" :current-dir="sortDir" @sort="handleSort" />
              <SortableTh label="Privilege" sort-key="privilege" :current-sort="sortKey" :current-dir="sortDir" @sort="handleSort" />
              <TableHead class="text-right">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="loading"><TableCell :colspan="4" class="py-8 text-center"><Loader2 class="mx-auto h-5 w-5 animate-spin text-muted-foreground" /></TableCell></TableRow>
            <TableRow v-else-if="users.length === 0"><TableCell :colspan="4" class="py-6 text-center text-muted-foreground">Tidak ada user ditemukan.</TableCell></TableRow>
            <TableRow v-for="u in users" :key="u.user_id" v-else>
              <TableCell class="font-mono">{{ u.user_id }}</TableCell>
              <TableCell>{{ u.name || "-" }}</TableCell>
              <TableCell>
                <Badge v-if="u.privilege === PRIVILEGE_ADMIN" variant="default">Admin</Badge>
                <Badge v-else variant="secondary">User</Badge>
              </TableCell>
              <TableCell>
                <div class="flex justify-end gap-0.5">
                  <Button variant="ghost" size="icon" :disabled="busyUserId === u.user_id" @click="handleTogglePrivilege(u)">
                    <Loader2 v-if="busyUserId === u.user_id" class="h-3.5 w-3.5 animate-spin" />
                    <ShieldCheck v-else-if="u.privilege === PRIVILEGE_ADMIN" class="h-3.5 w-3.5 text-primary" />
                    <Shield v-else class="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                  <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" :disabled="busyUserId === u.user_id" @click="handleDeleteUser(u)">
                    <Trash2 class="h-3.5 w-3.5" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div class="flex items-center justify-between text-xs text-muted-foreground">
        <span>{{ count }} user total</span>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" :disabled="page <= 1 || loading" @click="page = Math.max(1, page - 1)">Sebelumnya</Button>
          <span class="font-tabular">{{ page }} / {{ totalPages }}</span>
          <Button variant="outline" size="sm" :disabled="page >= totalPages || loading" @click="page = Math.min(totalPages, page + 1)">Selanjutnya</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
