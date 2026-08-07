<script setup lang="ts">
import { Plus } from "@lucide/vue"

defineProps<{ basePath: string }>()
const open = ref(false)
</script>

<template>
  <Button size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Host</Button>
  <NetwatchFormDialog mode="add" :base-path="basePath" v-model:open="open" />
</template>
