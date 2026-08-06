<script setup lang="ts">
import { Loader2, Pencil } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { RegisteredDevice, Department } from "#shared/types/api"

const props = defineProps<{ device: RegisteredDevice; departments: Department[] }>()
const { request } = useApiClient()
const { choices: functionChoices } = useDeviceFunctionChoices()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)

const emptyForm = () => ({
  DeviceName: props.device.DeviceName ?? "",
  DeptID: props.device.DeptID ? String(props.device.DeptID) : "0",
  Function: props.device.Function ?? "0",
  IPRouter: props.device.IPRouter ?? "",
})
const form = ref(emptyForm())

watch(open, (isOpen) => {
  if (!isOpen) return
  form.value = emptyForm()
  error.value = null
  success.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  success.value = null
  try {
    const result = await request<{ activated_to_active_device: boolean }>(
      `/iclock/registered-device/${props.device.id}/`,
      { method: "PATCH", body: JSON.stringify({ ...form.value, DeptID: Number(form.value.DeptID) }) }
    )
    if (result.activated_to_active_device) {
      success.value = "Device diaktivasi ke Active Device (Pool ID berubah dari 0). Cek halaman Active Device."
      await refreshNuxtData()
    } else {
      open.value = false
      await refreshNuxtData()
    }
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
    <Button variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Konfigurasi Registered Device — {{ device.SN }}</DialogTitle>
        <DialogDescription>
          Set Pool &amp; Function device ini. Mengubah Pool dari 0 (guest) ke pool lain akan
          OTOMATIS mengaktivasi device ke Active Device.
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div v-if="success" class="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">{{ success }}</div>

        <div class="space-y-1.5">
          <Label for="devicename">Nama Device</Label>
          <Input id="devicename" v-model="form.DeviceName" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label>Pool</Label>
            <Select v-model="form.DeptID">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="0">0 — Belum diaktivasi (guest)</SelectItem>
                <SelectItem v-for="d in departments.filter((d) => d.DeptID !== 0)" :key="d.DeptID" :value="String(d.DeptID)">{{ d.DeptName }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label for="function">Function Code</Label>
            <Select v-model="form.Function">
              <SelectTrigger id="function"><SelectValue placeholder="Pilih function" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in functionChoices" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div class="space-y-1.5">
          <Label for="iprouter">IP Router</Label>
          <Input id="iprouter" v-model="form.IPRouter" class="font-mono" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Tutup</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
