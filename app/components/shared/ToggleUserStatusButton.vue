<script setup lang="ts">
import { Loader2, UserX, UserCheck } from "@lucide/vue"

/**
 * Toggle enable/disable akun -- BEDA dari "unlock" (UnlockUserButton,
 * KHUSUS AD): ini status yang diubah MANUAL oleh admin, bukan status
 * lockout OTOMATIS krn salah password berkali-kali.
 *
 * `source` menentukan endpoint yang dipanggil -- dipakai bareng AD &
 * Zentyal, PERILAKU beda di backend (AD pakai bit userAccountControl,
 * Zentyal pakai prefix '!' di userPassword).
 */
const props = defineProps<{ source: "ad" | "zentyal"; userDn: string; userLabel: string; isEnabled: boolean }>()
const { request } = useApiClient()
const confirmOpen = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const action = computed(() => (props.isEnabled ? "disable" : "enable"))
const endpoint = computed(() => (props.source === "ad" ? "/netmgmt/ad/users/toggle-status/" : "/netmgmt/zentyal/users/toggle-status/"))

async function handleConfirm() {
  loading.value = true
  error.value = null
  try {
    await request(endpoint.value, { method: "POST", body: JSON.stringify({ user_dn: props.userDn, action: action.value }) })
    confirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, `Gagal ${props.isEnabled ? "menonaktifkan" : "mengaktifkan"} user.`)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button
    variant="ghost" size="icon" :aria-label="isEnabled ? 'Nonaktifkan' : 'Aktifkan'"
    :class="isEnabled ? 'text-destructive hover:text-destructive' : 'text-success hover:text-success'"
    @click="confirmOpen = true"
  >
    <UserX v-if="isEnabled" class="h-3.5 w-3.5" /><UserCheck v-else class="h-3.5 w-3.5" />
  </Button>

  <Dialog v-model:open="confirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ isEnabled ? "Nonaktifkan" : "Aktifkan" }} User?</DialogTitle>
        <DialogDescription>
          <template v-if="isEnabled">Akun <span class="font-medium text-foreground">{{ userLabel }}</span> akan dinonaktifkan -- tidak bisa login sampai diaktifkan kembali.</template>
          <template v-else>Akun <span class="font-medium text-foreground">{{ userLabel }}</span> akan diaktifkan kembali.</template>
        </DialogDescription>
      </DialogHeader>
      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
      <DialogFooter>
        <Button variant="outline" @click="confirmOpen = false">Batal</Button>
        <Button :variant="isEnabled ? 'destructive' : 'default'" :disabled="loading" @click="handleConfirm">
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> {{ isEnabled ? "Nonaktifkan" : "Aktifkan" }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
