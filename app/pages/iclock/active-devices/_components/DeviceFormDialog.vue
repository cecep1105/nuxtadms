<script setup lang="ts">
import { Loader2, Pencil, Plus } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { ActiveDevice, Department } from "#shared/types/api"

const props = defineProps<{ mode: "create" | "edit"; device?: ActiveDevice; departments: Department[] }>()

const { request } = useApiClient()
const { choices: functionChoices } = useDeviceFunctionChoices()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const emptyForm = () => ({
  SN: "", Alias: "", DeviceName: "", DeptID: "", Function: "0", IPAddress: "", MAC: "", TZAdj: "7",
  ErrorDelay: "60", Delay: "30", TransTimes: "00:00;14:05", TransInterval: "1",
  UpdateDB: "1111111100", Realtime: true, Encrypt: false,
})
const form = ref(emptyForm())

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.device) {
    const d = props.device
    form.value = {
      SN: d.SN, Alias: d.Alias ?? "", DeviceName: d.DeviceName ?? "", DeptID: d.DeptID ? String(d.DeptID) : "",
      Function: d.Function ?? "0", IPAddress: d.IPAddress ?? "", MAC: d.MAC ?? "",
      TZAdj: d.TZAdj !== null ? String(d.TZAdj) : "7",
      ErrorDelay: String(d.ErrorDelay), Delay: String(d.Delay),
      TransTimes: d.TransTimes ?? "00:00;14:05", TransInterval: String(d.TransInterval),
      UpdateDB: d.UpdateDB, Realtime: d.Realtime, Encrypt: d.Encrypt,
    }
  } else {
    form.value = emptyForm()
  }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  const payload = {
    ...form.value,
    DeptID: form.value.DeptID ? Number(form.value.DeptID) : null,
    TZAdj: form.value.TZAdj ? Number(form.value.TZAdj) : null,
    ErrorDelay: Number(form.value.ErrorDelay),
    Delay: Number(form.value.Delay),
    TransInterval: Number(form.value.TransInterval),
  }
  try {
    if (props.mode === "create") {
      await request("/iclock/active-device/", { method: "POST", body: JSON.stringify(payload) })
    } else {
      await request(`/iclock/active-device/${props.device!.SN}/`, { method: "PATCH", body: JSON.stringify(payload) })
    }
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as Record<string, string[]> | null
      error.value = body ? Object.values(body).flat().join(" ") : "Gagal menyimpan device."
    } else {
      error.value = "Gagal menyimpan device."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button v-if="mode === 'create'" size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Device</Button>
    <Button v-else variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>

    <DialogContent class="max-h-[85vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ mode === "create" ? "Tambah Active Device" : `Edit Device — ${device?.SN}` }}</DialogTitle>
        <DialogDescription>Konfigurasi device fingerprint, termasuk parameter PUSH SDK yang dikirim ke device.</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="sn">Serial Number</Label>
            <Input id="sn" v-model="form.SN" :disabled="mode === 'edit'" required />
          </div>
          <div class="space-y-1.5">
            <Label for="devicename">Device Name</Label>
            <Input id="devicename" v-model="form.DeviceName" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label>Pool</Label>
            <Select v-model="form.DeptID">
              <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="d in departments" :key="d.DeptID" :value="String(d.DeptID)">{{ d.DeptName }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Function Code</Label>
            <Select v-model="form.Function">
              <SelectTrigger><SelectValue placeholder="Pilih function" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="c in functionChoices" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="ip">IP Address</Label>
            <Input id="ip" v-model="form.IPAddress" placeholder="192.168.1.100" class="font-mono" />
          </div>
          <div class="space-y-1.5">
            <Label for="mac">MAC Address</Label>
            <Input id="mac" v-model="form.MAC" placeholder="00:11:22:33:44:55" class="font-mono" />
          </div>
        </div>

        <Separator />
        <p class="text-xs font-medium text-muted-foreground">Konfigurasi PUSH SDK</p>

        <div class="grid grid-cols-3 gap-3">
          <div class="space-y-1.5">
            <Label for="errordelay">Error Delay</Label>
            <Input id="errordelay" v-model="form.ErrorDelay" type="number" />
          </div>
          <div class="space-y-1.5">
            <Label for="delay">Delay</Label>
            <Input id="delay" v-model="form.Delay" type="number" />
          </div>
          <div class="space-y-1.5">
            <Label for="transinterval">Trans Interval</Label>
            <Input id="transinterval" v-model="form.TransInterval" type="number" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="transtimes">Trans Times</Label>
          <Input id="transtimes" v-model="form.TransTimes" />
        </div>

        <div class="space-y-1.5">
          <Label for="updatedb">Trans Flag (UpdateDB)</Label>
          <Input id="updatedb" v-model="form.UpdateDB" class="font-mono" />
        </div>

        <div class="flex gap-6">
          <label class="flex items-center gap-2 text-xs">
            <Switch v-model:checked="form.Realtime" /> Realtime
          </label>
          <label class="flex items-center gap-2 text-xs">
            <Switch v-model:checked="form.Encrypt" /> Encrypt
          </label>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
