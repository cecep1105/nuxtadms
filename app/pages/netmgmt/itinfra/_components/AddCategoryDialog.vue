<script setup lang="ts">
import { Loader2, FolderPlus } from "@lucide/vue"

const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const name = ref("")

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/netmgmt/itinfra/categories/", { method: "POST", body: JSON.stringify({ name: name.value }) })
    open.value = false
    name.value = ""
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menambah kategori.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" variant="outline" @click="open = true"><FolderPlus class="h-3.5 w-3.5" /> Kategori Baru</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Tambah Kategori</DialogTitle>
        <DialogDescription>Mis. Internet, VPS, Domain, Lisensi Software, dll.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label for="cat-name">Nama Kategori</Label>
          <Input id="cat-name" v-model="name" required placeholder="VPS" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Tambah</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
