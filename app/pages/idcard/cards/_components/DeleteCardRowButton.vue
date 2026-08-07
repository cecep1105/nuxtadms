<script setup lang="ts">
import { Loader2, Trash2 } from "@lucide/vue"

/** Versi ICON-ONLY dari DeleteCardButton (halaman detail) -- dipakai di baris tabel Daftar Kartu, cukup refresh list SETELAH hapus. */
const props = defineProps<{ cardId: number; holderName: string }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

async function handleDelete() {
  loading.value = true
  error.value = null
  try {
    await request(`/idcard/cards/${props.cardId}/`, { method: "DELETE" })
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus kartu.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button variant="ghost" size="icon" aria-label="Hapus" @click="open = true"><Trash2 class="h-3.5 w-3.5 text-destructive" /></Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus Kartu?</DialogTitle>
        <DialogDescription>Kartu untuk "{{ holderName }}" akan dihapus permanen, termasuk file foto dan gambar kartu di server.</DialogDescription>
      </DialogHeader>
      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button variant="destructive" :disabled="loading" @click="handleDelete">
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Hapus
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
