<script setup lang="ts">
import { Loader2, Trash2, RotateCcw } from "@lucide/vue"

/** Aksi per-baris mail queue -- Requeue (coba kirim ulang) & Delete (hapus permanen dari queue Postfix). */
const props = defineProps<{ qid: string }>()
const { request } = useApiClient()
const busy = ref<"requeue" | "delete" | null>(null)
const deleteOpen = ref(false)
const error = ref<string | null>(null)

async function handleRequeue() {
  busy.value = "requeue"
  error.value = null
  try {
    await request("/netmgmt/zentyal-mail/queue/", { method: "POST", body: JSON.stringify({ command: "REQUEUE", qids: [props.qid] }) })
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal requeue pesan.")
  } finally {
    busy.value = null
  }
}

async function handleDelete() {
  busy.value = "delete"
  error.value = null
  try {
    await request("/netmgmt/zentyal-mail/queue/", { method: "POST", body: JSON.stringify({ command: "DELETE", qids: [props.qid] }) })
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
  <div class="flex justify-end gap-0.5">
    <Button variant="ghost" size="icon" :disabled="busy !== null" aria-label="Requeue" @click="handleRequeue">
      <Loader2 v-if="busy === 'requeue'" class="h-3.5 w-3.5 animate-spin" /><RotateCcw v-else class="h-3.5 w-3.5" />
    </Button>
    <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" :disabled="busy !== null" aria-label="Hapus" @click="deleteOpen = true">
      <Trash2 class="h-3.5 w-3.5" />
    </Button>

    <Dialog v-model:open="deleteOpen">
      <DialogContent class="max-w-sm">
        <DialogHeader>
          <DialogTitle>Hapus dari Queue?</DialogTitle>
          <DialogDescription>Pesan dgn Queue ID <span class="font-mono font-medium text-foreground">{{ qid }}</span> akan dihapus PERMANEN dari mail queue.</DialogDescription>
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
