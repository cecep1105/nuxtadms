<script setup lang="ts">
import { Loader2, Network } from "@lucide/vue"

interface NetworkParams { ip: string; mask: string; gateway: string }
const props = defineProps<{ sn: string; alias: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loadingCurrent = ref(false)
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref<string | null>(null)
const current = ref<NetworkParams | null>(null)
const form = ref({ new_ip: "", new_netmask: "", new_gateway: "" })

async function loadCurrent() {
  loadingCurrent.value = true
  error.value = null
  try {
    const data = await request<NetworkParams>(`/iclock/active-device/${props.sn}/network-params/`)
    current.value = data
    form.value = { new_ip: data.ip, new_netmask: data.mask, new_gateway: data.gateway }
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal membaca parameter jaringan device.")
  } finally {
    loadingCurrent.value = false
  }
}

watch(open, (isOpen) => {
  if (isOpen) { loadCurrent(); success.value = null }
})

async function handleSubmit() {
  saving.value = true
  error.value = null
  success.value = null
  try {
    const result = await request<{ success: boolean; message: string }>(`/iclock/active-device/${props.sn}/network-params/`, {
      method: "POST", body: JSON.stringify(form.value),
    })
    if (result.success) { success.value = result.message; loadCurrent() }
    else error.value = result.message
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah parameter jaringan.")
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Network Params — {{ alias }}</DialogTitle>
        <DialogDescription>
          ⚠️ Mengubah IP/Netmask/Gateway bisa membuat device TIDAK TERJANGKAU lagi kalau salah input -- pastikan IP baru masih dalam jaringan yang sama & bisa diakses server ini.
        </DialogDescription>
      </DialogHeader>

      <div v-if="loadingCurrent" class="flex justify-center py-8"><Loader2 class="h-5 w-5 animate-spin text-muted-foreground" /></div>
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div v-if="success" class="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">{{ success }}</div>
        <div v-if="current" class="rounded-md border border-border bg-muted p-3 font-mono text-[11px] text-muted-foreground">
          Saat ini: {{ current.ip }} / {{ current.mask }} / gw {{ current.gateway }}
        </div>
        <div class="space-y-1.5">
          <Label for="new_ip">IP Address Baru</Label>
          <Input id="new_ip" v-model="form.new_ip" class="font-mono" />
        </div>
        <div class="space-y-1.5">
          <Label for="new_netmask">Netmask Baru</Label>
          <Input id="new_netmask" v-model="form.new_netmask" class="font-mono" />
        </div>
        <div class="space-y-1.5">
          <Label for="new_gateway">Gateway Baru</Label>
          <Input id="new_gateway" v-model="form.new_gateway" class="font-mono" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Tutup</Button>
          <Button type="submit" :disabled="saving">
            <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" /><Network v-else class="h-3.5 w-3.5" /> Terapkan
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
