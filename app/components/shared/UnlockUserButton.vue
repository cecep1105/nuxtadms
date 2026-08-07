<script setup lang="ts">
import { Loader2, LockOpen } from "@lucide/vue"

/**
 * Unlock akun AD yang terkunci OTOMATIS (lockoutTime != 0, krn salah
 * password berkali-kali) -- BEDA dari enable/disable
 * (ToggleUserStatusButton), itu status MANUAL admin, konsep terpisah.
 * KHUSUS AD (Zentyal tidak punya konsep lockout otomatis spt ini).
 */
const props = defineProps<{ userDn: string; userLabel: string }>()
const { request } = useApiClient()
const confirmOpen = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

async function handleConfirm() {
  loading.value = true
  error.value = null
  try {
    await request("/netmgmt/ad/users/unlock/", { method: "POST", body: JSON.stringify({ user_dn: props.userDn }) })
    confirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal unlock user.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button variant="outline" size="sm" @click="confirmOpen = true"><LockOpen class="h-3.5 w-3.5" /> Unlock</Button>

  <Dialog v-model:open="confirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Unlock User?</DialogTitle>
        <DialogDescription>Akun <span class="font-medium text-foreground">{{ userLabel }}</span> akan dibuka kuncinya dan bisa login lagi.</DialogDescription>
      </DialogHeader>
      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
      <DialogFooter>
        <Button variant="outline" @click="confirmOpen = false">Batal</Button>
        <Button :disabled="loading" @click="handleConfirm">
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Unlock
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
