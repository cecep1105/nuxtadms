<script setup lang="ts">
import { Eye } from "@lucide/vue"

defineProps<{ entryId: number; entryName: string }>()
const open = ref(false)
</script>

<template>
  <Button variant="ghost" size="sm" @click="open = true"><Eye class="h-3.5 w-3.5" /> Lihat</Button>
  <ItInfraViewDetailDialog :entry-id="entryId" :entry-name="entryName" v-model:open="open" />
</template>
