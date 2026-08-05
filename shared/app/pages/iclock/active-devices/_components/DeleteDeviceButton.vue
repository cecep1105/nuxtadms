<script setup lang="ts">
import { Loader2, Trash2 } from "@lucide/vue"

const props = defineProps<{ sn: string; alias: string }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)

async function handleDelete() {
  loading.value = true
  try {
    await request(`/iclock/active-device/${props.sn}/`, { method: "DELETE" })
    open.value = false
    await refreshNuxtData()
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button variant="ghost" size="icon" aria-label="Hapus" class="text-destructive hover:text-destructive" @click="open = true">
      <Trash2 class="h-3.5 w-3.5" />
    </Button>
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Hapus Device?</DialogTitle>
        <DialogDescription>Device <span class="font-mono font-medium text-foreground">{{ sn }}</span> ({{ alias }}) akan dihapus permanen. Tindakan ini tidak bisa dibatalkan.</DialogDescription>
      </DialogHeader>
      <DialogFooter>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button variant="destructive" :disabled="loading" @click="handleDelete"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Hapus</Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
