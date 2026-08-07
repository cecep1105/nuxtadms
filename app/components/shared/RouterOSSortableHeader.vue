<script setup lang="ts">
import { ChevronUp, ChevronDown, ChevronsUpDown } from "@lucide/vue"

/**
 * Header kolom bisa-diklik KHUSUS halaman yg datanya BUKAN dari
 * Django/database (MSSQL eksternal, RouterOS API, vSphere langsung,
 * dll) -- BEDA dari SortableHeader.vue biasa (1 param gabungan
 * ?ordering=field/-field, konvensi django-filter) -- di sini PAKAI 2
 * param TERPISAH: sortBy (nama field) + sortDir (asc/desc). Toggle
 * 3-tahap: belum aktif -> asc -> desc -> asc lagi.
 */
const props = defineProps<{ label: string; columnKey: string }>()

const route = useRoute()
const router = useRouter()
const currentSort = computed(() => route.query.sortBy as string | undefined)
const currentDir = computed(() => route.query.sortDir as string | undefined)
const isActive = computed(() => currentSort.value === props.columnKey)
const isDesc = computed(() => isActive.value && currentDir.value === "desc")

function handleSort() {
  const query = { ...route.query, page: undefined } as Record<string, string | undefined>
  if (isActive.value && currentDir.value === "asc") {
    query.sortDir = "desc"
  } else {
    query.sortBy = props.columnKey
    query.sortDir = "asc"
  }
  router.push({ query })
}
</script>

<template>
  <button type="button" class="inline-flex items-center gap-1 hover:text-foreground" @click="handleSort">
    {{ label }}
    <ChevronDown v-if="isActive && isDesc" class="h-3 w-3" />
    <ChevronUp v-else-if="isActive" class="h-3 w-3" />
    <ChevronsUpDown v-else class="h-3 w-3 opacity-40" />
  </button>
</template>
