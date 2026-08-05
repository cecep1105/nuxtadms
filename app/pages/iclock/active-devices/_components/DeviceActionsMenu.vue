<script setup lang="ts">
import {
  MoreVertical, Power, Clock, HardDriveDownload, Users, Loader2,
  Network, Settings2, Fingerprint, ScrollText,
} from "@lucide/vue"
import type { Department, ActiveDevice } from "#shared/types/api"

const props = defineProps<{ sn: string; alias: string; departments: Department[]; devices: ActiveDevice[] }>()

const { request } = useApiClient()

const rebootConfirmOpen = ref(false)
const rebootLoading = ref(false)
const syncTimeLoading = ref(false)
const actionResult = ref<{ success: boolean; message: string } | null>(null)
const backupOpen = ref(false)
const liveUsersOpen = ref(false)
const liveLogsOpen = ref(false)
const networkParamsOpen = ref(false)
const genericParamOpen = ref(false)
const transferFingerOpen = ref(false)

const popoverOpen = computed({ get: () => !!actionResult.value, set: (v) => { if (!v) actionResult.value = null } })

async function handleReboot() {
  rebootLoading.value = true
  try {
    const result = await request<{ success: boolean; message: string }>(`/iclock/active-device/${props.sn}/reboot/`, { method: "POST" })
    actionResult.value = result
    rebootConfirmOpen.value = false
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal reboot device.") }
  } finally {
    rebootLoading.value = false
  }
}

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
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Aksi Device"><MoreVertical class="h-3.5 w-3.5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem :disabled="syncTimeLoading" @click="handleSyncTime">
            <Loader2 v-if="syncTimeLoading" class="h-3.5 w-3.5 animate-spin" /><Clock v-else class="h-3.5 w-3.5" /> Sync Waktu Device
          </DropdownMenuItem>
          <DropdownMenuItem @click="liveUsersOpen = true"><Users class="h-3.5 w-3.5" /> Lihat Live Users</DropdownMenuItem>
          <DropdownMenuItem @click="liveLogsOpen = true"><ScrollText class="h-3.5 w-3.5" /> Lihat Live Logs</DropdownMenuItem>
          <DropdownMenuItem @click="backupOpen = true"><HardDriveDownload class="h-3.5 w-3.5" /> Backup Fingerprint</DropdownMenuItem>
          <DropdownMenuItem @click="transferFingerOpen = true"><Fingerprint class="h-3.5 w-3.5" /> Transfer Finger dari Device Ini</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem @click="networkParamsOpen = true"><Network class="h-3.5 w-3.5" /> Network Params</DropdownMenuItem>
          <DropdownMenuItem @click="genericParamOpen = true"><Settings2 class="h-3.5 w-3.5" /> Generic Param</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive focus:text-destructive" @click="rebootConfirmOpen = true">
            <Power class="h-3.5 w-3.5" /> Reboot Device
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PopoverTrigger>
    <PopoverContent v-if="actionResult" :class="`w-72 text-xs ${actionResult.success ? 'text-success' : 'text-destructive'}`">
      {{ actionResult.message }}
    </PopoverContent>
  </Popover>

  <Dialog v-model:open="rebootConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Reboot Device?</DialogTitle>
        <DialogDescription>
          Device <span class="font-mono font-medium text-foreground">{{ sn }}</span> ({{ alias }}) akan restart. Absensi via device ini TIDAK BISA diproses selama proses reboot berlangsung (biasanya 30-60 detik).
        </DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="rebootConfirmOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="rebootLoading" @click="handleReboot">
          <Loader2 v-if="rebootLoading" class="h-3.5 w-3.5 animate-spin" /> Reboot
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <BackupFingerprintsDialog :sn="sn" :alias="alias" v-model:open="backupOpen" />
  <LiveUsersDialog :sn="sn" :alias="alias" v-model:open="liveUsersOpen" />
  <LiveLogsDialog :sn="sn" :alias="alias" v-model:open="liveLogsOpen" />
  <NetworkParamsDialog :sn="sn" :alias="alias" v-model:open="networkParamsOpen" />
  <GenericParamDialog :sn="sn" :alias="alias" v-model:open="genericParamOpen" />
  <DeviceTransferFingerDialog :sn="sn" :alias="alias" :departments="departments" :devices="devices" v-model:open="transferFingerOpen" />
</template>
