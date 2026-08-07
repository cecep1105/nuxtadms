<script setup lang="ts">
import { Pencil } from "@lucide/vue"
import type { IDCardHolder } from "#shared/types/api"
defineProps<{ holder: IDCardHolder }>()
const open = ref(false)
</script>
<template>
  <Button variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>
  <HolderFormDialog mode="edit" :holder="holder" v-model:open="open" />
</template>
