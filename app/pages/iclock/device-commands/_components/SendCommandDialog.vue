<script setup lang="ts">
import { Loader2, Send } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { ActiveDevice } from "#shared/types/api"

const COMMON_COMMANDS = [
  { value: "CHECK", label: "CHECK -- cek data baru & upload instan" },
  { value: "REBOOT", label: "REBOOT -- restart device" },
  { value: "LOG", label: "LOG -- cek & upload data baru" },
  { value: "RELOAD OPTIONS", label: "RELOAD OPTIONS -- muat ulang konfigurasi" },
  { value: "custom", label: "Custom..." },
]

const props = defineProps<{ devices: ActiveDevice[] }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const sn = ref("")
const preset = ref("CHECK")
const customContent = ref("")

const cmdContent = computed(() => (preset.value === "custom" ? customContent.value : preset.value))

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request("/iclock/device-command/", { method: "POST", body: JSON.stringify({ SN: sn.value, CmdContent: cmdContent.value }) })
    open.value = false
    sn.value = ""
    preset.value = "CHECK"
    customContent.value = ""
    await refreshNuxtData()
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as Record<string, string[]> | null
      error.value = body ? Object.values(body).flat().join(" ") : "Gagal mengirim command."
    } else {
      error.value = "Gagal mengirim command."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button size="sm" @click="open = true"><Send class="h-3.5 w-3.5" /> Kirim Command</Button>
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Kirim Command ke Device</DialogTitle>
        <DialogDescription>
          Command masuk antrean, device akan mengambilnya di polling <code>getrequest</code> berikutnya (tidak instan).
        </DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label>Device</Label>
          <Select v-model="sn">
            <SelectTrigger><SelectValue placeholder="Pilih device" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="d in devices" :key="d.SN" :value="d.SN">{{ d.Alias }} ({{ d.SN }})</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div class="space-y-1.5">
          <Label>Command</Label>
          <Select v-model="preset">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in COMMON_COMMANDS" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div v-if="preset === 'custom'" class="space-y-1.5">
          <Label for="custom">Isi Command</Label>
          <Input id="custom" v-model="customContent" class="font-mono" required />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading || !sn || !cmdContent">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Kirim
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
