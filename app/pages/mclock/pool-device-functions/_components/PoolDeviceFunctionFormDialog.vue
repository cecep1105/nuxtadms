<script setup lang="ts">
import { Loader2, Pencil, Plus } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { PoolDeviceFunction } from "#shared/types/api"

const props = defineProps<{ mode: "create" | "edit"; item?: PoolDeviceFunction }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const form = ref({ PoolID: props.item?.PoolID ?? "", function_type: props.item?.function_type ?? "BUKAN_KANTIN" })

watch(open, (isOpen) => {
  if (!isOpen) return
  form.value = { PoolID: props.item?.PoolID ?? "", function_type: props.item?.function_type ?? "BUKAN_KANTIN" }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    if (props.mode === "create") {
      await request("/mclock/pool-device-function/", { method: "POST", body: JSON.stringify(form.value) })
    } else {
      await request(`/mclock/pool-device-function/${props.item!.id}/`, { method: "PATCH", body: JSON.stringify(form.value) })
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
    <Button v-if="mode === 'create'" size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Mapping</Button>
    <Button v-else variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>

    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ mode === "create" ? "Tambah Pool Device Function" : `Edit Mapping — ${item?.PoolID}` }}</DialogTitle>
        <DialogDescription>
          Menentukan apakah PoolID ini KANTIN atau bukan -- dipakai <code>mattendance</code> menentukan kode fungsi check-in/out/meal (prioritas pertama, sebelum fallback ke prefix PIN).
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label for="poolid">Pool ID</Label>
          <Input id="poolid" v-model="form.PoolID" :disabled="mode === 'edit'" required class="font-mono" />
        </div>
        <div class="space-y-1.5">
          <Label>Function Type</Label>
          <Select v-model="form.function_type">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="KANTIN">KANTIN</SelectItem>
              <SelectItem value="BUKAN_KANTIN">Bukan KANTIN</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
