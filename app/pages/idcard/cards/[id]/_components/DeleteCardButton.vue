<script setup lang="ts">
import { Loader2, Trash2 } from "@lucide/vue"

/**
 * Hapus kartu PERMANEN -- backend SEKALIAN membersihkan file fisik
 * (foto sumber & hasil kartu) dari storage, TIDAK ada file yatim yang
 * tersisa. STAFF-ONLY (endpoint DELETE-nya ditolak utk portal) --
 * makanya tombol ini CUMA ada di halaman detail staff, TIDAK di portal.
 */
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
    await navigateTo("/idcard/cards")
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus kartu.")
    loading.value = false
  }
}
</script>

<template>
  <Button variant="outline" size="sm" class="text-destructive hover:text-destructive" @click="open = true">
    <Trash2 class="h-3.5 w-3.5" /> Hapus
  </Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus Kartu?</DialogTitle>
        <DialogDescription>Kartu untuk "{{ holderName }}" akan dihapus permanen, termasuk file foto dan gambar kartu di server. Tindakan ini tidak bisa dibatalkan.</DialogDescription>
      </DialogHeader>
      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
      <DialogFooter>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button variant="destructive" :disabled="loading" @click="handleDelete">
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Hapus Permanen
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
