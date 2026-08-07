<script setup lang="ts">
import { MoreVertical, Power, Loader2, Pencil, Trash2 } from "@lucide/vue"
import type { MikrotikNetwatchItem } from "#shared/types/api"

const props = defineProps<{ hostdata: MikrotikNetwatchItem; basepath: string }>()
const { request } = useApiClient()

const disableConfirmOpen = ref(false)
const enableConfirmOpen = ref(false)
const disableLoading = ref(false)
const enableLoading = ref(false)
const actionResult = ref<{ success: boolean; message: string } | null>(null)
const popoverOpen = computed({ get: () => !!actionResult.value, set: (v) => { if (!v) actionResult.value = null } })

const editOpen = ref(false)
const deleteOpen = ref(false)
const deleteLoading = ref(false)
const deleteError = ref<string | null>(null)

async function handleDisableHost() {
  disableLoading.value = true
  try {
    const result = await request<{ success: boolean; message: string }>(`${props.basepath}/?postcmd=disable`, { method: "POST", body: JSON.stringify({ id: props.hostdata.id }) })
    actionResult.value = result
    disableConfirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal disable host.") }
  } finally {
    disableLoading.value = false
  }
}

async function handleEnableHost() {
  enableLoading.value = true
  try {
    const result = await request<{ success: boolean; message: string }>(`${props.basepath}/?postcmd=enable`, { method: "POST", body: JSON.stringify({ id: props.hostdata.id }) })
    actionResult.value = result
    enableConfirmOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    actionResult.value = { success: false, message: extractErrorMessage(err, "Gagal enable host.") }
  } finally {
    enableLoading.value = false
  }
}

async function handleDelete() {
  deleteLoading.value = true
  deleteError.value = null
  try {
    await request(`${props.basepath}/?postcmd=remove`, { method: "POST", body: JSON.stringify({ id: props.hostdata.id }) })
    deleteOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    deleteError.value = extractErrorMessage(err, "Gagal menghapus host netwatch.")
  } finally {
    deleteLoading.value = false
  }
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <DropdownMenu>
        <DropdownMenuTrigger as-child>
          <Button variant="ghost" size="icon" aria-label="Aksi Netwatch"><MoreVertical class="h-3.5 w-3.5" /></Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="editOpen = true"><Pencil class="h-3.5 w-3.5" /> Edit</DropdownMenuItem>
          <DropdownMenuItem v-if="hostdata.disabled === 'true'" @click="enableConfirmOpen = true"><Power class="h-3.5 w-3.5" /> Enable Host</DropdownMenuItem>
          <DropdownMenuItem v-else @click="disableConfirmOpen = true"><Power class="h-3.5 w-3.5" /> Disable Host</DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem class="text-destructive focus:text-destructive" @click="deleteOpen = true"><Trash2 class="h-3.5 w-3.5" /> Hapus</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </PopoverTrigger>
    <PopoverContent v-if="actionResult" :class="`w-72 text-xs ${actionResult.success ? 'text-success' : 'text-destructive'}`">{{ actionResult.message }}</PopoverContent>
  </Popover>

  <NetwatchFormDialog mode="edit" :base-path="basepath" :item="hostdata" v-model:open="editOpen" />

  <Dialog v-model:open="disableConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Disable this host?</DialogTitle>
        <DialogDescription>Host dengan ip-address <span class="font-mono font-medium text-foreground">{{ hostdata["host"] }}</span> ({{ hostdata["comment"] }}) akan di-disable.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="disableConfirmOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="disableLoading" @click="handleDisableHost">
          <Loader2 v-if="disableLoading" class="h-3.5 w-3.5 animate-spin" /> Disable Host
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
  <Dialog v-model:open="enableConfirmOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Enable this host</DialogTitle>
        <DialogDescription>Host dengan ip address <span class="font-mono font-medium text-foreground">{{ hostdata["host"] }}</span> ({{ hostdata["comment"] }}) akan di-enable.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="enableConfirmOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="enableLoading" @click="handleEnableHost">
          <Loader2 v-if="enableLoading" class="h-3.5 w-3.5 animate-spin" /> Enable Host
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>

  <Dialog v-model:open="deleteOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus Host Netwatch?</DialogTitle>
        <DialogDescription>Host <span class="font-mono font-medium text-foreground">{{ hostdata.host }}</span> ({{ hostdata.comment || "tanpa comment" }}) akan dihapus permanen dari monitoring netwatch.</DialogDescription>
      </DialogHeader>
      <div v-if="deleteError" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ deleteError }}</div>
      <DialogFooter>
        <Button variant="outline" @click="deleteOpen = false">Batal</Button>
        <Button variant="destructive" :disabled="deleteLoading" @click="handleDelete">
          <Loader2 v-if="deleteLoading" class="h-3.5 w-3.5 animate-spin" /> Hapus
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
