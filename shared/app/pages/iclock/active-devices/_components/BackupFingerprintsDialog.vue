<script setup lang="ts">
import { Loader2, HardDriveDownload } from "@lucide/vue"

const props = defineProps<{ sn: string; alias: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const log = ref<string[] | null>(null)
const pinPattern = ref("")

watch(open, (isOpen) => {
  if (!isOpen) {
    error.value = null
    log.value = null
    pinPattern.value = ""
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const result = await request<{ log: string[] }>(`/iclock/active-device/${props.sn}/backup-fingerprints/`, {
      method: "POST", body: JSON.stringify({ pin_pattern: pinPattern.value }),
    })
    log.value = result.log
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal backup fingerprint.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Backup Fingerprint — {{ alias }}</DialogTitle>
        <DialogDescription>
          Ambil semua user + template fingerprint dari device fisik, simpan/perbarui ke database (dipakai sbg sumber utk fitur Transfer Finger di halaman Employee).
        </DialogDescription>
      </DialogHeader>

      <div v-if="log" class="space-y-3">
        <div class="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px]">
          <div v-for="(line, i) in log" :key="i">{{ line }}</div>
        </div>
        <DialogFooter><Button @click="open = false">Selesai</Button></DialogFooter>
      </div>
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label for="pinpattern">Filter PIN (opsional)</Label>
          <Input id="pinpattern" v-model="pinPattern" placeholder="Kosongkan utk backup SEMUA user" class="font-mono" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><HardDriveDownload v-else class="h-3.5 w-3.5" /> Mulai Backup
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
