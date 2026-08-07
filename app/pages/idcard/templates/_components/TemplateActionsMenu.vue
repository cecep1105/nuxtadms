<script setup lang="ts">
import { Loader2, ToggleLeft, ToggleRight, Trash2 } from "@lucide/vue"
import type { IDCardTemplate } from "#shared/types/api"

const props = defineProps<{ template: IDCardTemplate }>()
const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const confirmDeleteOpen = ref(false)

async function handleToggleActive() {
  loading.value = true
  try {
    await request(`/idcard/templates/${props.template.id}/`, { method: "PATCH", body: JSON.stringify({ is_active: !props.template.is_active }) })
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah status template.")
  } finally {
    loading.value = false
  }
}

async function handleDelete() {
  loading.value = true
  error.value = null
  try {
    await request(`/idcard/templates/${props.template.id}/`, { method: "DELETE" })
    confirmDeleteOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus template.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex items-center gap-1">
    <span v-if="error" class="text-[11px] text-destructive">{{ error }}</span>
    <Button variant="ghost" size="icon" :disabled="loading" :aria-label="template.is_active ? 'Nonaktifkan' : 'Aktifkan'" @click="handleToggleActive">
      <ToggleRight v-if="template.is_active" class="h-4 w-4 text-success" /><ToggleLeft v-else class="h-4 w-4 text-muted-foreground" />
    </Button>
    <Button variant="ghost" size="icon" :disabled="loading" aria-label="Hapus" @click="confirmDeleteOpen = true">
      <Trash2 class="h-3.5 w-3.5 text-destructive" />
    </Button>

    <Dialog v-model:open="confirmDeleteOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus Template?</DialogTitle>
          <DialogDescription>Template "{{ template.name }}" akan dihapus permanen. Kalau template ini sudah pernah dipakai generate kartu, penghapusan akan ditolak (nonaktifkan saja).</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" @click="confirmDeleteOpen = false">Batal</Button>
          <Button variant="destructive" :disabled="loading" @click="handleDelete">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
