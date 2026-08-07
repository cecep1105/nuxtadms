<script setup lang="ts">
import { Plus } from "@lucide/vue"
const open = ref(false)
</script>
<template>
  <Button size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Data</Button>
  <HolderFormDialog mode="add" v-model:open="open" />
</template>
