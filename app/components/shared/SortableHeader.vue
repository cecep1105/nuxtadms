<script setup lang="ts">
import { ChevronUp, ChevronDown, ChevronsUpDown } from "@lucide/vue"

/**
 * Header kolom tabel yang bisa diklik utk sorting -- toggle asc -> desc
 * -> asc tiap diklik, dipetakan ke param ?ordering=field /
 * ?ordering=-field (standar DRF OrderingFilter). Cuma link biasa
 * (TIDAK ada state/interaktivitas di luar navigasi), SAMA persis
 * versi Next.js.
 */
const props = defineProps<{ label: string; sortKey: string }>()

const route = useRoute()
const currentSort = computed(() => (route.query.ordering as string) ?? "")
const isActive = computed(() => currentSort.value === props.sortKey || currentSort.value === `-${props.sortKey}`)
const isDesc = computed(() => currentSort.value === `-${props.sortKey}`)
const nextSort = computed(() => (isActive.value && !isDesc.value ? `-${props.sortKey}` : props.sortKey))
const targetQuery = computed(() => ({ ...route.query, ordering: nextSort.value, page: undefined }))
</script>

<template>
  <NuxtLink :to="{ query: targetQuery }" class="inline-flex items-center gap-1 hover:text-foreground">
    {{ label }}
    <ChevronDown v-if="isActive && isDesc" class="h-3 w-3" />
    <ChevronUp v-else-if="isActive" class="h-3 w-3" />
    <ChevronsUpDown v-else class="h-3 w-3 opacity-40" />
  </NuxtLink>
</template>
