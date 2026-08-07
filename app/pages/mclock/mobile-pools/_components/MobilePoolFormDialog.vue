<script setup lang="ts">
import { Loader2, Pencil, Plus } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { MobilePool } from "#shared/types/api"

const props = defineProps<{ mode: "create" | "edit"; pool?: MobilePool }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const emptyForm = () => ({ PoolID: "", PoolCode: "", PoolName: "", Latitude: "", Longitude: "", Radius: "" })
const form = ref(emptyForm())

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.pool) {
    const p = props.pool
    form.value = {
      PoolID: p.PoolID, PoolCode: p.PoolCode ?? "", PoolName: p.PoolName ?? "",
      Latitude: p.Latitude ?? "", Longitude: p.Longitude ?? "", Radius: p.Radius !== null ? String(p.Radius) : "",
    }
  } else {
    form.value = emptyForm()
  }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  const payload = { ...form.value, Radius: form.value.Radius ? Number(form.value.Radius) : null }
  try {
    if (props.mode === "create") {
      await request("/mclock/mobile-pool/", { method: "POST", body: JSON.stringify(payload) })
    } else {
      await request(`/mclock/mobile-pool/${props.pool!.PoolID}/`, { method: "PATCH", body: JSON.stringify(payload) })
    }
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as Record<string, string[]> | null
      error.value = body ? Object.values(body).flat().join(" ") : "Gagal menyimpan."
    } else {
      error.value = "Gagal menyimpan."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button v-if="mode === 'create'" size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Pool (Testing)</Button>
    <Button v-else variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>

    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === "create" ? "Tambah Mobile Pool" : `Edit Pool — ${pool?.PoolID}` }}</DialogTitle>
        <DialogDescription>
          🧪 Data ini disinkronkan dari MSSQL eksternal -- perubahan lewat sini murni utk testing, akan tertimpa saat sync berikutnya jalan.
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="poolid">Pool ID</Label>
            <Input id="poolid" v-model="form.PoolID" :disabled="mode === 'edit'" required class="font-mono" />
          </div>
          <div class="space-y-1.5">
            <Label for="poolcode">Pool Code</Label>
            <Input id="poolcode" v-model="form.PoolCode" class="font-mono" />
          </div>
        </div>
        <div class="space-y-1.5">
          <Label for="poolname">Nama Pool</Label>
          <Input id="poolname" v-model="form.PoolName" />
        </div>
        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1.5">
            <Label for="lat">Latitude</Label>
            <Input id="lat" v-model="form.Latitude" class="font-mono" />
          </div>
          <div class="space-y-1.5">
            <Label for="lng">Longitude</Label>
            <Input id="lng" v-model="form.Longitude" class="font-mono" />
          </div>
          <div class="space-y-1.5">
            <Label for="radius">Radius (m)</Label>
            <Input id="radius" v-model="form.Radius" type="number" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
