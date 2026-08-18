<script setup lang="ts">
import { Loader2, Trash2, RotateCcw } from "@lucide/vue"

/** Aksi per-baris mail queue -- Requeue (coba kirim ulang) & Delete (hapus permanen dari queue Postfix). */
const props = defineProps<{ aliasName: string; mail: string }>()
const { request } = useApiClient()
const busy = ref<"delete" | null>(null)
const deleteOpen = ref(false)
const error = ref<string | null>(null)

async function handleDelete() {
  busy.value = "delete"
  error.value = null
  try {
    await request(`/netmgmt/zentyal/postfix-alias/${props.aliasName}/`, { method: "DELETE", body: JSON.stringify({ mail: props.mail }) })
    deleteOpen.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menghapus pesan.")
  } finally {
    busy.value = null
  }
}
</script>

<template>
  <div class="flex justify-end gap-0.5 h-5">
    <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive h-5" :disabled="busy !== null" aria-label="Hapus" @click="deleteOpen = true">
      <Trash2 class="h-3.5 w-3.5" />
    </Button>

    <Dialog v-model:open="deleteOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus dari {{ aliasName }} ?</DialogTitle>
          <DialogDescription>{{ aliasName }} <span class="font-mono font-medium text-foreground">{{ mail }}</span> akan dihapus PERMANEN.</DialogDescription>
        </DialogHeader>
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <DialogFooter>
          <Button variant="outline" @click="deleteOpen = false">Batal</Button>
          <Button variant="destructive" :disabled="busy !== null" @click="handleDelete">
            <Loader2 v-if="busy === 'delete'" class="h-3.5 w-3.5 animate-spin" /> Hapus
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>
