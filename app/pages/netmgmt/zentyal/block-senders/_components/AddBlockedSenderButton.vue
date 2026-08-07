<script setup lang="ts">
import { Loader2, Plus } from "@lucide/vue"

const { request } = useApiClient()
const open = ref(false)
const email = ref("")
const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/netmgmt/zentyal-mail/block-senders/", { method: "POST", body: JSON.stringify({ email: email.value }) })
    open.value = false
    email.value = ""
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menambah blocked sender.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Blokir Sender</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Blokir Sender</DialogTitle>
        <DialogDescription>Email dari alamat ini akan otomatis ditolak (REJECT) oleh Postfix.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label for="email">Alamat Email</Label>
          <Input id="email" v-model="email" type="email" required placeholder="spammer@contoh.com" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Blokir</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
