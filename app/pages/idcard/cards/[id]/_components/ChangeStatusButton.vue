<script setup lang="ts">
import { Loader2, RefreshCw } from "@lucide/vue"
import type { IDCardStatus } from "#shared/types/api"

const STATUS_OPTIONS: { value: IDCardStatus; label: string }[] = [
  { value: "belum_cetak", label: "Belum Cetak" },
  { value: "sudah_cetak", label: "Sudah Cetak" },
  { value: "hilang", label: "Hilang" },
  { value: "cetak_ulang", label: "Cetak Ulang" },
]

const props = defineProps<{ cardId: number; currentStatus: IDCardStatus }>()
const { request } = useApiClient()
const open = ref(false)
const status = ref<IDCardStatus>(props.currentStatus)
const notes = ref("")
const loading = ref(false)
const error = ref<string | null>(null)

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request(`/idcard/cards/${props.cardId}/status/`, { method: "POST", body: JSON.stringify({ status: status.value, notes: notes.value }) })
    open.value = false
    notes.value = ""
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah status.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" @click="open = true"><RefreshCw class="h-3.5 w-3.5" /> Ubah Status</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Ubah Status Kartu</DialogTitle>
        <DialogDescription>Perubahan akan tercatat di riwayat log kartu ini.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label>Status Baru</Label>
          <Select v-model="status">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="s in STATUS_OPTIONS" :key="s.value" :value="s.value">{{ s.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label for="status-notes">Catatan (opsional)</Label>
          <Textarea id="status-notes" v-model="notes" :rows="3" placeholder="mis. Dilaporkan hilang oleh karyawan" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
