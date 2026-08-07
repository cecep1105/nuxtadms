<script setup lang="ts">
import { Loader2, UserPlus, UserMinus, Search } from "@lucide/vue"
import type { DirectoryUser } from "#shared/types/api"

/**
 * Dialog kelola member group, DIPAKAI BERSAMA Active Directory & Zentyal
 * (parameterized lewat `source`) -- bentuk data konsisten, tapi body
 * POST membership SEDIKIT beda:
 *   - AD: {group_dn, user_dn, action}
 *   - Zentyal: {group_dn, user_uid, user_dn, action} -- backend Zentyal
 *     otomatis pilih user_uid ATAU user_dn tergantung jenis group,
 *     frontend cukup kirim KEDUANYA.
 */
const props = defineProps<{ source: "ad" | "zentyal"; groupDn: string; groupName: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const members = ref<DirectoryUser[] | null>(null)
const error = ref<string | null>(null)
const busyDn = ref<string | null>(null)

const searchQuery = ref("")
const searchResults = ref<DirectoryUser[]>([])
const searching = ref(false)

async function loadMembers() {
  error.value = null
  try {
    const data = await request<{ count: number; results: DirectoryUser[] }>(`/netmgmt/${props.source}/groups/${encodeURIComponent(props.groupDn)}/members/`)
    members.value = data.results
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal memuat member group.")
  }
}

watch(open, (isOpen) => {
  if (isOpen) {
    members.value = null
    searchQuery.value = ""
    searchResults.value = []
    loadMembers()
  }
})

let debounceHandle: ReturnType<typeof setTimeout> | undefined
watch(searchQuery, (q) => {
  if (debounceHandle) clearTimeout(debounceHandle)
  if (q.trim().length < 2) {
    searchResults.value = []
    return
  }
  debounceHandle = setTimeout(async () => {
    searching.value = true
    try {
      const data = await request<{ results: DirectoryUser[] }>(`/netmgmt/${props.source}/users/?_q=${encodeURIComponent(q)}&_search_fields=username,display_name,email&_limit=8`)
      const memberDns = new Set((members.value ?? []).map((m) => m.dn))
      searchResults.value = data.results.filter((u) => !memberDns.has(u.dn))
    } catch {
      searchResults.value = []
    } finally {
      searching.value = false
    }
  }, 350)
})

async function handleAdd(user: DirectoryUser) {
  busyDn.value = user.dn
  error.value = null
  try {
    await request(`/netmgmt/${props.source}/group-membership/`, { method: "POST", body: JSON.stringify({ group_dn: props.groupDn, user_dn: user.dn, user_uid: user.username, action: "add" }) })
    searchQuery.value = ""
    searchResults.value = []
    await loadMembers()
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menambah member.")
  } finally {
    busyDn.value = null
  }
}

async function handleRemove(user: DirectoryUser) {
  busyDn.value = user.dn
  error.value = null
  try {
    await request(`/netmgmt/${props.source}/group-membership/`, { method: "POST", body: JSON.stringify({ group_dn: props.groupDn, user_dn: user.dn, user_uid: user.username, action: "remove" }) })
    await loadMembers()
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus member.")
  } finally {
    busyDn.value = null
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[85vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>Kelola Member — {{ groupName }}</DialogTitle>
        <DialogDescription>Tambah atau hapus user dari group ini.</DialogDescription>
      </DialogHeader>

      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

      <div class="space-y-1.5">
        <div class="relative">
          <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input v-model="searchQuery" placeholder="Cari user utk ditambahkan..." class="pl-8" />
        </div>
        <p v-if="searching" class="text-[11px] text-muted-foreground">Mencari...</p>
        <div v-if="searchResults.length > 0" class="space-y-1 rounded-md border border-border p-1">
          <div v-for="user in searchResults" :key="user.dn" class="flex items-center justify-between rounded-sm px-2 py-1.5 text-xs hover:bg-accent">
            <span>{{ user.display_name }} <span class="font-mono text-muted-foreground">({{ user.username }})</span></span>
            <Button variant="ghost" size="icon" :disabled="busyDn === user.dn" @click="handleAdd(user)">
              <Loader2 v-if="busyDn === user.dn" class="h-3.5 w-3.5 animate-spin" /><UserPlus v-else class="h-3.5 w-3.5 text-success" />
            </Button>
          </div>
        </div>
      </div>

      <div class="space-y-1">
        <p class="text-xs font-medium text-muted-foreground">Member saat ini ({{ members?.length ?? 0 }})</p>
        <div v-if="members === null" class="flex justify-center py-6"><Loader2 class="h-5 w-5 animate-spin text-muted-foreground" /></div>
        <p v-else-if="members.length === 0" class="py-4 text-center text-xs text-muted-foreground">Belum ada member di group ini.</p>
        <div v-else class="max-h-64 space-y-1 overflow-y-auto">
          <div v-for="user in members" :key="user.dn" class="flex items-center justify-between rounded-md border border-border px-3 py-2 text-xs">
            <div>
              <p class="font-medium">{{ user.display_name }}</p>
              <p class="font-mono text-[11px] text-muted-foreground">{{ user.username }} <template v-if="user.email">• {{ user.email }}</template></p>
            </div>
            <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" :disabled="busyDn === user.dn" @click="handleRemove(user)">
              <Loader2 v-if="busyDn === user.dn" class="h-3.5 w-3.5 animate-spin" /><UserMinus v-else class="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
