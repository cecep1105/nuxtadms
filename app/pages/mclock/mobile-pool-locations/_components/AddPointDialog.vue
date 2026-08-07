<script setup lang="ts">
import { Loader2, Plus } from "@lucide/vue"
import type { MobilePool } from "#shared/types/api"

const props = defineProps<{ pools: MobilePool[] }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const form = ref({ PoolID: "", Urut: "", Latitude: "", Longitude: "" })

watch(open, (isOpen) => {
  if (!isOpen) {
    error.value = null
    form.value = { PoolID: "", Urut: "", Latitude: "", Longitude: "" }
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/mclock/mobile-pool-loc/", { method: "POST", body: JSON.stringify(form.value) })
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menambah titik. Kombinasi Pool + Urut mungkin sudah ada.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button size="sm" variant="outline" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Titik Manual</Button>
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Tambah Titik Polygon</DialogTitle>
        <DialogDescription>Input manual 1 titik -- utk gambar seluruh polygon sekaligus, pakai "Gambar Polygon Baru" di peta.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label>Pool</Label>
          <Select v-model="form.PoolID">
            <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="p in pools" :key="p.PoolID" :value="p.PoolID">{{ p.PoolName ?? p.PoolID }} ({{ p.PoolID }})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1.5">
          <Label for="urut">Urutan Titik</Label>
          <Input id="urut" v-model="form.Urut" type="number" step="1" min="1" required placeholder="Urutan keliling polygon, mis. 1, 2, 3..." />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="lat">Latitude</Label>
            <Input id="lat" v-model="form.Latitude" required class="font-mono" placeholder="-6.123456" />
          </div>
          <div class="space-y-1.5">
            <Label for="lng">Longitude</Label>
            <Input id="lng" v-model="form.Longitude" required class="font-mono" placeholder="106.123456" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading || !form.PoolID"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
