<script setup lang="ts">
import { Pencil, Trash2, Loader2 } from "@lucide/vue"
import type { DnsRecordRow } from "#shared/types/api"

const props = defineProps<{ zoneDn: string; record: DnsRecordRow }>()
const { request } = useApiClient()
const editOpen = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)

async function handleDelete() {
  deleting.value = true
  error.value = null
  try {
    await request("/netmgmt/ad/dns/records/", { method: "POST", body: JSON.stringify({ action: "delete", node_dn: props.record.node_dn, old_raw_b64: props.record.raw_b64 }) })
    deleteOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus record.")
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <span v-if="!record.editable" class="text-[11px] text-muted-foreground">Read-only</span>
  <template v-else>
    <div class="flex justify-end gap-0.5">
      <Button variant="ghost" size="icon" aria-label="Edit" @click="editOpen = true"><Pencil class="h-3.5 w-3.5" /></Button>
      <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" aria-label="Hapus" @click="deleteOpen = true"><Trash2 class="h-3.5 w-3.5" /></Button>
    </div>

    <RecordFormDialog mode="edit" :zone-dn="zoneDn" :record="record" v-model:open="editOpen" />

    <Dialog v-model:open="deleteOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Record?</DialogTitle>
          <DialogDescription>
            Record <span class="font-mono font-medium text-foreground">{{ record.name }} ({{ record.type }})</span> akan dihapus permanen.
            <template v-if="record.type === 'A'"> Kalau ada record lain (mis. round-robin) di nama yang sama, itu TIDAK akan ikut terhapus.</template>
          </DialogDescription>
        </DialogHeader>
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <DialogFooter>
          <Button variant="outline" @click="deleteOpen = false">Batal</Button>
          <Button variant="destructive" :disabled="deleting" @click="handleDelete">
            <Loader2 v-if="deleting" class="h-3.5 w-3.5 animate-spin" /> Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </template>
</template>
