<script setup lang="ts">
import { Pencil, Trash2, Loader2 } from "@lucide/vue"
import type { ITInfraCategory, ITInfraEntrySummary } from "#shared/types/api"

const props = defineProps<{ entry: ITInfraEntrySummary; categories: ITInfraCategory[] }>()
const { request } = useApiClient()
const editOpen = ref(false)
const deleteOpen = ref(false)
const deleting = ref(false)
const error = ref<string | null>(null)

async function handleDelete() {
  deleting.value = true
  error.value = null
  try {
    await request("/netmgmt/itinfra/entries/action/", { method: "POST", body: JSON.stringify({ action: "delete", entry_id: props.entry.id }) })
    deleteOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus data.")
  } finally {
    deleting.value = false
  }
}
</script>

<template>
  <div class="flex justify-end gap-0.5">
    <Button variant="ghost" size="icon" aria-label="Edit" @click="editOpen = true"><Pencil class="h-3.5 w-3.5" /></Button>
    <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" aria-label="Hapus" @click="deleteOpen = true"><Trash2 class="h-3.5 w-3.5" /></Button>
  </div>

  <ItInfraFormDialog mode="edit" :entry-id="entry.id" :categories="categories" v-model:open="editOpen" />

  <Dialog v-model:open="deleteOpen">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus Data?</DialogTitle>
        <DialogDescription>Data <span class="font-medium text-foreground">{{ entry.name }}</span> ({{ entry.category_name }}) akan dihapus permanen.</DialogDescription>
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
