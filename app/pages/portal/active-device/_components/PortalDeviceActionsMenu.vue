<script setup lang="ts">
import { Clock, Fingerprint, Loader2, ScrollText } from "@lucide/vue"
import type { Department, ActiveDevice } from "#shared/types/api"

/**
 * Versi PORTAL dari DeviceActionsMenu (staff) -- CUMA 3 tombol (Sync
 * Waktu, Live Logs, Transfer Finger dari Device Ini), TIDAK ADA Live
 * Users/Backup Fingerprint/Network Params/Generic Param/Reboot (SEMUA
 * itu di luar cakupan izin portal can_view_active_device, endpoint-nya
 * SENGAJA TETAP staff-only).
 *
 * LiveLogsDialog & DeviceTransferFingerDialog DIPAKAI ULANG apa
 * adanya dari staff (sudah auto-terdaftar global) -- generik, tidak
 * ada logic khusus staff di dalamnya.
 */
const props = defineProps<{ sn: string; alias: string; departments: Department[]; devices: ActiveDevice[] }>()

const { request } = useApiClient()

const syncTimeLoading = ref(false)
const actionResult = ref<{ success: boolean; message: string } | null>(null)
const popoverOpen = computed({ get: () => !!actionResult.value, set: (v) => { if (!v) actionResult.value = null } })

const liveLogsOpen = ref(false)
const transferFingerOpen = ref(false)

async function handleSyncTime() {
  syncTimeLoading.value = true
  actionResult.value = null
  try {
    const result = await request<{ success: boolean; message: string }>(`/iclock/active-device/${props.sn}/sync-time/`, { method: "POST" })
    actionResult.value = result
    if (result.success) await refreshNuxtData()
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal sinkronisasi waktu.") }
  } finally {
    syncTimeLoading.value = false
  }
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <div class="flex items-center gap-1">
        <Button variant="ghost" size="icon" :disabled="syncTimeLoading" aria-label="Sync Waktu Device" @click="handleSyncTime">
          <Loader2 v-if="syncTimeLoading" class="h-3.5 w-3.5 animate-spin" /><Clock v-else class="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Lihat Live Logs" @click="liveLogsOpen = true">
          <ScrollText class="h-3.5 w-3.5" />
        </Button>
        <Button variant="ghost" size="icon" aria-label="Transfer Finger" @click="transferFingerOpen = true">
          <Fingerprint class="h-3.5 w-3.5" />
        </Button>
      </div>
    </PopoverTrigger>
    <PopoverContent v-if="actionResult" :class="`w-72 text-xs ${actionResult.success ? 'text-success' : 'text-destructive'}`">
      {{ actionResult.message }}
    </PopoverContent>
  </Popover>

  <LiveLogsDialog :sn="sn" :alias="alias" v-model:open="liveLogsOpen" />
  <DeviceTransferFingerDialog :sn="sn" :alias="alias" :departments="departments" :devices="devices" v-model:open="transferFingerOpen" />
</template>
