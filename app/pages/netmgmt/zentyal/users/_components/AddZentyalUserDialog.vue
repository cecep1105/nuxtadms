<script setup lang="ts">
import { Loader2, UserPlus } from "@lucide/vue"

/**
 * Tambah user Zentyal (mail server) -- uidNumber dihitung OTOMATIS
 * server-side (MAX+1 dari user yang ada), gidNumber pakai default yang
 * dikonfigurasi admin -- tidak perlu diisi di form ini.
 */
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const username = ref("")
const displayName = ref("")
const lastName = ref("")
const email = ref("")
const password = ref("")

function reset() {
  username.value = ""; displayName.value = ""; lastName.value = ""; email.value = ""; password.value = ""
  error.value = null
}
watch(open, (isOpen) => { if (!isOpen) reset() })

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/netmgmt/zentyal/users/create/", { method: "POST", body: JSON.stringify({ username: username.value, display_name: displayName.value, last_name: lastName.value, email: email.value, password: password.value }) })
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
        <DialogTitle>Tambah User Zentyal</DialogTitle>
        <DialogDescription>uidNumber &amp; home directory dibuat otomatis.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label for="zt-username">Username (uid)</Label>
          <Input id="zt-username" v-model="username" required class="font-mono" placeholder="budi" />
        </div>
        <div class="space-y-1.5">
          <Label for="zt-display-name">Nama Lengkap</Label>
          <Input id="zt-display-name" v-model="displayName" required placeholder="Budi Santoso" />
        </div>
        <div class="space-y-1.5">
          <Label for="zt-last-name">Nama Belakang</Label>
          <Input id="zt-last-name" v-model="lastName" placeholder="Santoso" />
        </div>
        <div class="space-y-1.5">
          <Label for="zt-email">Email</Label>
          <Input id="zt-email" v-model="email" type="email" placeholder="budi@hibautama.com" />
        </div>
        <div class="space-y-1.5">
          <Label for="zt-password">Password Awal</Label>
          <Input id="zt-password" v-model="password" type="password" required minlength="8" />
          <p class="text-[11px] text-muted-foreground">Minimal 8 karakter.</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Tambah User</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
