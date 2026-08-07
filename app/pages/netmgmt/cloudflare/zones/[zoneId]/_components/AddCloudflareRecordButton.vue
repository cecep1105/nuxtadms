<script setup lang="ts">
import { Plus } from "@lucide/vue"

defineProps<{ zoneId: string }>()
const open = ref(false)
</script>

<template>
  <Button size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Record</Button>
  <CloudflareRecordFormDialog mode="add" :zone-id="zoneId" v-model:open="open" />
</template>
