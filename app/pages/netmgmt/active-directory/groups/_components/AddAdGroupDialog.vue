<script setup lang="ts">
import { Loader2, FolderPlus } from "@lucide/vue"

/** Tambah group Active Directory -- selalu dibuat sbg security group global biasa (jenis paling umum). */
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const name = ref("")
const description = ref("")

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/netmgmt/ad/groups/create/", { method: "POST", body: JSON.stringify({ name: name.value, description: description.value }) })
    open.value = false
    name.value = ""; description.value = ""
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menambah group.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" @click="open = true"><FolderPlus class="h-3.5 w-3.5" /> Tambah Group</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Tambah Group Active Directory</DialogTitle>
        <DialogDescription>Dibuat sebagai security group global (jenis paling umum).</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label for="ad-group-name">Nama Group</Label>
          <Input id="ad-group-name" v-model="name" required placeholder="IT Support" />
        </div>
        <div class="space-y-1.5">
          <Label for="ad-group-desc">Deskripsi</Label>
          <Input id="ad-group-desc" v-model="description" placeholder="Tim dukungan IT" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Tambah Group</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
