<script setup lang="ts">
import { Loader2, FileText } from "@lucide/vue"
import type { ITInfraEntryDetail } from "#shared/types/api"

/**
 * View-only detail Data IT-Infra utk portal -- SENGAJA TIDAK ADA form
 * edit (cakupan portal cuma lihat). Detail-nya PENUH (termasuk field
 * `data`) beda dari list (yg cuma summary tanpa `data`) -- lazy-fetch
 * saat dialog dibuka.
 */
const props = defineProps<{ entryId: number; entryName: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const detail = ref<ITInfraEntryDetail | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) return
  loading.value = true
  error.value = null
  detail.value = null
  request<ITInfraEntryDetail>(`/netmgmt/itinfra/entries/${props.entryId}/`)
    .then((d) => { detail.value = d })
    .catch((err) => { error.value = extractErrorMessage(err, "Gagal mengambil detail data.") })
    .finally(() => { loading.value = false })
})

const entries = computed(() => (detail.value ? Object.entries(detail.value.data) : []))
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2"><FileText class="h-4 w-4" /> {{ entryName }}</DialogTitle>
        <DialogDescription v-if="detail?.category_name">
          Kategori: <span class="font-medium text-foreground">{{ detail.category_name }}</span>
        </DialogDescription>
      </DialogHeader>

      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

      <div v-if="loading" class="flex items-center justify-center py-8"><Loader2 class="h-5 w-5 animate-spin text-muted-foreground" /></div>
      <div v-else-if="detail">
        <p v-if="entries.length === 0" class="py-4 text-center text-sm text-muted-foreground">Tidak ada data tersimpan.</p>
        <div v-else>
          <ItInfraValueRow v-for="[key, value] in entries" :key="key" :label="key" :value="value" />
        </div>
        <div v-if="detail.notes" class="mt-3 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs text-muted-foreground">{{ detail.notes }}</div>
      </div>
    </DialogContent>
  </Dialog>
</template>
