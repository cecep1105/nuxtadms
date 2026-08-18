<script setup lang="ts">
import { MoreVertical, Power, Loader2, MonitorPlay } from "@lucide/vue"
import type { MikrotikDhcpLease } from "#shared/types/api"

const props = defineProps<{ hostdata: MikrotikDhcpLease; basepath: string }>()
const { request } = useApiClient()

const makeStaticConfirmOpen = ref(false)
const removeStaticConfirmOpen = ref(false)
const makeStaticLoading = ref(false)
const removeStaticLoading = ref(false)
const actionResult = ref<{ success: boolean; message: string } | null>(null)
const popoverOpen = computed({ get: () => !!actionResult.value, set: (v) => { if (!v) actionResult.value = null } })

async function handleMakeStatic() {
  makeStaticLoading.value = true
  try {
    const result = await request<{ success: boolean; message: string }>(`${props.basepath}/?postcmd=make-static`, { method: "POST", body: JSON.stringify({ id: props.hostdata.id }) })
    actionResult.value = result
    makeStaticConfirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal membuat static dhcp.") }
  } finally {
    makeStaticLoading.value = false
  }
}

async function handleRemoveStatic() {
  removeStaticLoading.value = true
  try {
    const result = await request<{ success: boolean; message: string }>(`${props.basepath}/?postcmd=remove`, { method: "POST", body: JSON.stringify({ id: props.hostdata.id }) })
    actionResult.value = result
    removeStaticConfirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal menghapus lease dhcp.") }
  } finally {
    removeStaticLoading.value = false
  }
}

const openVnc = (ip: string, port=5900) => {
  window.location.href = `vnc://${ip}:${port}`
}


</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Aksi Dhcp"><MoreVertical class="h-3.5 w-3.5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem v-if="hostdata.dynamic === 'true'" @click="makeStaticConfirmOpen = true">
            <Power class="h-3.5 w-3.5" /> Make Static
          </DropdownMenuItem>
          <DropdownMenuItem v-else class="text-destructive focus:text-destructive" @click="removeStaticConfirmOpen = true">
            <Power class="h-3.5 w-3.5" /> Delete Lease
          </DropdownMenuItem>
          <DropdownMenuItem class="text-muted-foreground focus:text-foreground" @click="openVnc(hostdata.address)">
            <MonitorPlay class="h-3.5 w-3.5" /> Remote VNC
          </DropdownMenuItem>


        </DropdownMenuContent>
      </DropdownMenu>
    </PopoverTrigger>
    <PopoverContent v-if="actionResult" :class="`w-72 text-xs ${actionResult.success ? 'text-success' : 'text-destructive'}`">
      {{ actionResult.message }}
    </PopoverContent>
  </Popover>

  <Dialog v-model:open="makeStaticConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Jadikan Static?</DialogTitle>
        <DialogDescription>Host dengan mac-address <span class="font-mono font-medium text-foreground">{{ hostdata["mac-address"] }}</span> ({{ hostdata["host-name"] }}) akan dijadikan static.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="makeStaticConfirmOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="makeStaticLoading" @click="handleMakeStatic">
          <Loader2 v-if="makeStaticLoading" class="h-3.5 w-3.5 animate-spin" /> Jadikan Static
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog v-model:open="removeStaticConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus Static Lease?</DialogTitle>
        <DialogDescription>Host dengan mac-address <span class="font-mono font-medium text-foreground">{{ hostdata["mac-address"] }}</span> ({{ hostdata["host-name"] }}) akan dihapus dari lease.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="removeStaticConfirmOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="removeStaticLoading" @click="handleRemoveStatic">
          <Loader2 v-if="removeStaticLoading" class="h-3.5 w-3.5 animate-spin" /> Hapus
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
