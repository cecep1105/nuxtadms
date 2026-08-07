<script setup lang="ts">
import { Loader2, KeyRound } from "@lucide/vue"

/**
 * Dialog reset password, DIPAKAI BERSAMA Active Directory & Zentyal
 * (parameterized lewat `source`) -- body request beda dikit tapi
 * bentuknya cukup mirip utk 1 komponen: {user_dn, new_password}.
 *
 * PENTING beda krusial di baliknya: AD WAJIB koneksi terenkripsi
 * (LDAPS/StartTLS) utk operasi ini -- kalau AD_USE_SSL=False, backend
 * akan MENOLAK dgn pesan jelas, ditampilkan APA ADANYA di dialog ini.
 */
const props = defineProps<{ source: "ad" | "zentyal"; userDn: string; userLabel: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const newPassword = ref("")
const confirmPassword = ref("")
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) {
    newPassword.value = ""; confirmPassword.value = ""; error.value = null; success.value = false
  }
})

async function handleSubmit() {
  error.value = null
  if (newPassword.value !== confirmPassword.value) {
    error.value = "Konfirmasi password tidak cocok."
    return
  }
  if (newPassword.value.length < 8) {
    error.value = "Password baru minimal 8 karakter."
    return
  }
  loading.value = true
  try {
    await request(`/netmgmt/${props.source}/reset-password/`, { method: "POST", body: JSON.stringify({ user_dn: props.userDn, new_password: newPassword.value }) })
    success.value = true
    newPassword.value = ""; confirmPassword.value = ""
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal reset password.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Reset Password — {{ userLabel }}</DialogTitle>
        <DialogDescription>
          {{ source === "ad"
            ? "Password baru langsung aktif. Butuh koneksi terenkripsi (LDAPS/StartTLS) ke Active Directory -- akan gagal kalau server belum dikonfigurasi SSL."
            : "Password baru langsung aktif untuk login mail/LDAP Zentyal." }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div v-if="success" class="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Password berhasil direset.</div>

        <div class="space-y-1.5">
          <Label for="new_password">Password Baru</Label>
          <Input id="new_password" v-model="newPassword" type="password" required />
        </div>
        <div class="space-y-1.5">
          <Label for="confirm_password">Konfirmasi Password Baru</Label>
          <Input id="confirm_password" v-model="confirmPassword" type="password" required />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Tutup</Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><KeyRound v-else class="h-3.5 w-3.5" /> Reset Password
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
