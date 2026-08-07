<script setup lang="ts">
import { Plus } from "@lucide/vue"

defineProps<{ zoneDn: string }>()
const open = ref(false)
</script>

<template>
  <Button size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Record</Button>
  <RecordFormDialog mode="add" :zone-dn="zoneDn" v-model:open="open" />
</template>
