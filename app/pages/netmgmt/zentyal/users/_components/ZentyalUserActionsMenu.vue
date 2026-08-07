<script setup lang="ts">
import { MoreVertical, Power, Trash2, Loader2, KeyRound } from "@lucide/vue"

/**
 * Zentyal/POSIX TIDAK PUNYA bit "disabled" spt AD -- toggle status di
 * sini bekerja lewat prefix '!' di userPassword (konvensi Unix
 * standar, sama dgn `passwd -l`).
 */
const props = defineProps<{ userDn: string; userLabel: string; isEnabled: boolean }>()
const { request } = useApiClient()

const toggleConfirmOpen = ref(false)
const toggleLoading = ref(false)
const toggleError = ref<string | null>(null)

const deleteOpen = ref(false)
const deleteLoading = ref(false)
const deleteError = ref<string | null>(null)

const resetPasswordOpen = ref(false)

const action = computed(() => (props.isEnabled ? "disable" : "enable"))

async function handleToggle() {
  toggleLoading.value = true
  toggleError.value = null
  try {
    await request("/netmgmt/zentyal/users/toggle-status/", { method: "POST", body: JSON.stringify({ user_dn: props.userDn, action: action.value }) })
    toggleConfirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    toggleError.value = extractErrorMessage(err, `Gagal ${props.isEnabled ? "menonaktifkan" : "mengaktifkan"} user.`)
  } finally {
    toggleLoading.value = false
  }
}

async function handleDelete() {
  deleteLoading.value = true
  deleteError.value = null
  try {
    await request("/netmgmt/zentyal/users/delete/", { method: "POST", body: JSON.stringify({ user_dn: props.userDn }) })
    deleteOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    deleteError.value = extractErrorMessage(err, "Gagal menghapus user.")
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <Button variant="ghost" size="icon" aria-label="Aksi User"><MoreVertical class="h-3.5 w-3.5" /></Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end">
      <DropdownMenuItem @click="resetPasswordOpen = true"><KeyRound class="h-3.5 w-3.5" /> Reset Password</DropdownMenuItem>
      <DropdownMenuItem @click="toggleConfirmOpen = true"><Power class="h-3.5 w-3.5" /> {{ isEnabled ? "Nonaktifkan" : "Aktifkan" }}</DropdownMenuItem>
      <DropdownMenuSeparator />
      <DropdownMenuItem class="text-destructive focus:text-destructive" @click="deleteOpen = true"><Trash2 class="h-3.5 w-3.5" /> Hapus</DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>

  <DirectoryResetPasswordDialog source="zentyal" :user-dn="userDn" :user-label="userLabel" v-model:open="resetPasswordOpen" />

  <Dialog v-model:open="toggleConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ isEnabled ? "Nonaktifkan" : "Aktifkan" }} User?</DialogTitle>
        <DialogDescription>
          <template v-if="isEnabled">Akun <span class="font-medium text-foreground">{{ userLabel }}</span> akan dinonaktifkan -- tidak bisa login/autentikasi sampai diaktifkan kembali.</template>
          <template v-else>Akun <span class="font-medium text-foreground">{{ userLabel }}</span> akan diaktifkan kembali.</template>
        </DialogDescription>
      </DialogHeader>
      <div v-if="toggleError" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ toggleError }}</div>
      <DialogFooter>
        <Button variant="outline" @click="toggleConfirmOpen = false">Batal</Button>
        <Button :variant="isEnabled ? 'destructive' : 'default'" :disabled="toggleLoading" @click="handleToggle">
          <Loader2 v-if="toggleLoading" class="h-3.5 w-3.5 animate-spin" /> {{ isEnabled ? "Nonaktifkan" : "Aktifkan" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="deleteOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus User?</DialogTitle>
        <DialogDescription>User <span class="font-medium text-foreground">{{ userLabel }}</span> akan dihapus PERMANEN dari LDAP, tidak ada undo.</DialogDescription>
      </DialogHeader>
      <div v-if="deleteError" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ deleteError }}</div>
      <DialogFooter>
        <Button variant="outline" @click="deleteOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="deleteLoading" @click="handleDelete">
          <Loader2 v-if="deleteLoading" class="h-3.5 w-3.5 animate-spin" /> Hapus
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
