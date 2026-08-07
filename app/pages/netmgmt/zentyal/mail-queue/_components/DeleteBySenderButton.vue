<script setup lang="ts">
import { Loader2, Trash2 } from "@lucide/vue"

/** Hapus SEMUA pesan di queue dari 1 sender sekaligus -- berguna kalau ada spam/backscatter dari 1 alamat, drpd hapus satu-satu. */
const { request } = useApiClient()
const open = ref(false)
const sender = ref("")
const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/netmgmt/zentyal-mail/queue/", { method: "POST", body: JSON.stringify({ command: "DELQFROMSENDER", sender: sender.value }) })
    open.value = false
    sender.value = ""
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus pesan dari sender ini.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button variant="outline" size="sm" @click="open = true"><Trash2 class="h-3.5 w-3.5" /> Hapus per Sender</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus Semua Pesan dari Sender</DialogTitle>
        <DialogDescription>Semua pesan di queue dari alamat ini akan dihapus PERMANEN sekaligus.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label for="sender">Alamat Sender</Label>
          <Input id="sender" v-model="sender" type="email" required placeholder="spammer@contoh.com" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" variant="destructive" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Hapus</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
