<script setup lang="ts">
import { Loader2, Trash2 } from "@lucide/vue"

const props = defineProps<{
  /** Path lengkap endpoint DELETE, mis. `/iclock/device-user/42/` */
  endpoint: string
  /** Deskripsi entitas di dialog konfirmasi, mis. "User 'budi'" */
  label: string
  disabled?: boolean
  disabledReason?: string
}>()

const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

async function handleDelete() {
  loading.value = true
  error.value = null
  try {
    await request(props.endpoint, { method: "DELETE" })
    open.value = false
    await refreshNuxtData() // refresh SEMUA useAsyncData aktif di halaman, TANPA reload penuh -- padanan router.refresh() Next.js
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus data.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button
      variant="ghost" size="icon" aria-label="Hapus" title="Hapus"
      :disabled="disabled" :title="disabled ? disabledReason : undefined"
      class="text-destructive hover:text-destructive disabled:text-muted-foreground"
      @click="open = true"
    >
      <Trash2 class="h-3.5 w-3.5" />
    </Button>
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus data?</DialogTitle>
        <DialogDescription>{{ label }} akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</DialogDescription>
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
