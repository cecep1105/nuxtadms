<script setup lang="ts">
import { MoreVertical, Power, Loader2 } from "@lucide/vue"
import type { MikrotikFirewallFilterRule } from "#shared/types/api"

const props = defineProps<{ hostdata: MikrotikFirewallFilterRule; basepath: string }>()
const { request } = useApiClient()

const enableConfirmOpen = ref(false)
const disableConfirmOpen = ref(false)
const enableLoading = ref(false)
const disableLoading = ref(false)
const actionResult = ref<{ success: boolean; message: string } | null>(null)
const popoverOpen = computed({ get: () => !!actionResult.value, set: (v) => { if (!v) actionResult.value = null } })

async function handleEnable() {
  enableLoading.value = true
  try {
    const result = await request<{ success: boolean; message: string }>(`${props.basepath}/?postcmd=enable`, { method: "POST", body: JSON.stringify({ id: props.hostdata.id }) })
    actionResult.value = result
    enableConfirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal enable firewall filter.") }
  } finally {
    enableLoading.value = false
  }
}

async function handleDisable() {
  disableLoading.value = true
  try {
    const result = await request<{ success: boolean; message: string }>(`${props.basepath}/?postcmd=disable`, { method: "POST", body: JSON.stringify({ id: props.hostdata.id }) })
    actionResult.value = result
    disableConfirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal disable firewall filter.") }
  } finally {
    disableLoading.value = false
  }
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Aksi FwFilter"><MoreVertical class="h-3.5 w-3.5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem v-if="hostdata.disabled === 'true'" @click="enableConfirmOpen = true">
            <Power class="h-3.5 w-3.5" /> Enable
          </DropdownMenuItem>
          <DropdownMenuItem v-else class="text-destructive focus:text-destructive" @click="disableConfirmOpen = true">
            <Power class="h-3.5 w-3.5" /> Disable
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PopoverTrigger>
    <PopoverContent v-if="actionResult" :class="`w-72 text-xs ${actionResult.success ? 'text-success' : 'text-destructive'}`">
      {{ actionResult.message }}
    </PopoverContent>
  </Popover>

  <Dialog v-model:open="enableConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Enable Rule?</DialogTitle>
        <DialogDescription>Rule dengan src-mac-address <span class="font-mono font-medium text-foreground">{{ hostdata["src-mac-address"] }}</span> ({{ hostdata["comment"] }}) akan di-enable.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="enableConfirmOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="enableLoading" @click="handleEnable">
          <Loader2 v-if="enableLoading" class="h-3.5 w-3.5 animate-spin" /> Enable
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog v-model:open="disableConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Disable Rule?</DialogTitle>
        <DialogDescription>Rule dengan src-mac-address <span class="font-mono font-medium text-foreground">{{ hostdata["src-mac-address"] }}</span> ({{ hostdata["comment"] }}) akan disable.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="disableConfirmOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="disableLoading" @click="handleDisable">
          <Loader2 v-if="disableLoading" class="h-3.5 w-3.5 animate-spin" /> Disable
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
