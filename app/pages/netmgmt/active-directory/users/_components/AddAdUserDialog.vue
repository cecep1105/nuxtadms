<script setup lang="ts">
import { Loader2, UserPlus } from "@lucide/vue"

/**
 * Tambah user Active Directory -- alur bikin user AD BUKAN 1 langkah:
 * user dibuat NONAKTIF dulu, password di-set, BARU diaktifkan. Kalau
 * password gagal (mis. tidak memenuhi kebijakan AD), user TETAP
 * tersimpan tapi nonaktif -- pesan error dari backend akan menjelaskan ini.
 */
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const username = ref("")
const displayName = ref("")
const firstName = ref("")
const lastName = ref("")
const email = ref("")
const password = ref("")

function reset() {
  username.value = ""; displayName.value = ""; firstName.value = ""; lastName.value = ""; email.value = ""; password.value = ""
  error.value = null
}

watch(open, (isOpen) => { if (!isOpen) reset() })

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/netmgmt/ad/users/create/", {
      method: "POST",
      body: JSON.stringify({ username: username.value, display_name: displayName.value, first_name: firstName.value, last_name: lastName.value, email: email.value, password: password.value }),
    })
    open.value = false
    reset()
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menambah user.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" @click="open = true"><UserPlus class="h-3.5 w-3.5" /> Tambah User</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah User Active Directory</DialogTitle>
        <DialogDescription>Username jadi sAMAccountName. Password wajib memenuhi kebijakan AD (kompleksitas/panjang minimum).</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label for="ad-username">Username</Label>
          <Input id="ad-username" v-model="username" required class="font-mono" placeholder="budi.santoso" />
        </div>
        <div class="space-y-1.5">
          <Label for="ad-display-name">Nama Lengkap (Display Name)</Label>
          <Input id="ad-display-name" v-model="displayName" required placeholder="Budi Santoso" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="ad-first-name">Nama Depan</Label>
            <Input id="ad-first-name" v-model="firstName" placeholder="Budi" />
          </div>
          <div class="space-y-1.5">
            <Label for="ad-last-name">Nama Belakang</Label>
            <Input id="ad-last-name" v-model="lastName" placeholder="Santoso" />
          </div>
        </div>
        <div class="space-y-1.5">
          <Label for="ad-email">Email</Label>
          <Input id="ad-email" v-model="email" type="email" placeholder="budi.santoso@contoso.com" />
        </div>
        <div class="space-y-1.5">
          <Label for="ad-password">Password Awal</Label>
          <Input id="ad-password" v-model="password" type="password" required />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Tambah User</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
