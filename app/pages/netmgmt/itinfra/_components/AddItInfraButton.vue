<script setup lang="ts">
import { Plus } from "@lucide/vue"
import type { ITInfraCategory } from "#shared/types/api"

defineProps<{ categories: ITInfraCategory[] }>()
const open = ref(false)
</script>

<template>
  <Button size="sm" :disabled="categories.length === 0" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Data</Button>
  <ItInfraFormDialog mode="add" :categories="categories" v-model:open="open" />
</template>
