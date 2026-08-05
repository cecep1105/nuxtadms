<script setup lang="ts">
import { Loader2, Fingerprint } from "@lucide/vue"
import type { Department, ActiveDevice } from "#shared/types/api"

import {  Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const props = defineProps<{ sn: string; alias: string; departments: Department[]; devices: ActiveDevice[] }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const log = ref<string[] | null>(null)
const pins = ref("")
const toPool = ref("")
const targetDevice = ref("")

const devicesInPool = computed(() => props.devices.filter((d) => String(d.DeptID) === toPool.value && d.SN !== props.sn))

watch(open, (isOpen) => {
  if (!isOpen) {
    error.value = null; log.value = null; pins.value = ""; toPool.value = ""; targetDevice.value = ""
  }
})
watch(toPool, () => { targetDevice.value = "" })

async function handleSubmit() {
  loading.value = true
  error.value = null
  log.value = null
  try {
    const result = await request<{ log: string[] }>(`/iclock/active-device/${props.sn}/user-transfer-finger/`, {
      method: "POST",
      body: JSON.stringify({ pins: pins.value, from_device: props.sn, to_pool: toPool.value, target_device: targetDevice.value || undefined }),
    })
    log.value = result.log
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal transfer fingerprint.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Transfer Finger dari {{ alias }}</DialogTitle>
        <DialogDescription>
          Ambil fingerprint LANGSUNG dari device ini (koneksi live, HARUS online) & kirim ke device tujuan -- bisa transfer banyak PIN sekaligus.
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
          <Label for="pins">PIN (satu atau lebih)</Label>
          <Input id="pins" v-model="pins" placeholder="8113009, 8113010 atau pisah baris baru" class="font-mono" required />
        </div>
        <div class="space-y-1.5">
          <Label>Pool Tujuan</Label>
          <Select v-model="toPool">
            <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="d in departments" :key="d.DeptID" :value="String(d.DeptID)">{{ d.DeptName }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1.5">
          <Label>Device Spesifik (opsional)</Label>
          <Select v-model="targetDevice" :disabled="!toPool">
            <SelectTrigger><SelectValue placeholder="Semua device di pool ini" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="d in devicesInPool" :key="d.SN" :value="d.SN">{{ d.Alias }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading || !toPool || !pins">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><Fingerprint v-else class="h-3.5 w-3.5" /> Transfer
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
