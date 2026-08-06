<script setup lang="ts">
import { ChevronLeft, ChevronRight } from "@lucide/vue"

const props = defineProps<{ count: number; pageSize: number; currentPage: number }>()

const route = useRoute()
const totalPages = computed(() => Math.max(1, Math.ceil(props.count / props.pageSize)))
const from = computed(() => (props.count === 0 ? 0 : (props.currentPage - 1) * props.pageSize + 1))
const to = computed(() => Math.min(props.currentPage * props.pageSize, props.count))
const isFirstPage = computed(() => props.currentPage <= 1)
const isLastPage = computed(() => props.currentPage >= totalPages.value)

function queryFor(page: number) {
  return { ...route.query, page: String(page) }
}
</script>

<template>
  <div class="flex flex-col gap-2 border-t border-border px-3 py-2.5 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
    <div class="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <span>
        Menampilkan <span class="font-medium text-foreground">{{ from }}</span>–<span class="font-medium text-foreground">{{ to }}</span>
        dari <span class="font-medium text-foreground">{{ count }}</span> data
      </span>
      <PageSizeSelect :page-size="pageSize" />
    </div>
    <div class="flex items-center gap-1.5">
      <!-- PENTING: atribut disabled TIDAK BERLAKU utk <a>/NuxtLink -- kalau
           SEHARUSNYA disabled, render <Button disabled> NATIVE (tanpa
           as-child+NuxtLink sama sekali), BUKAN cuma styling abu-abu yg
           TETAP bisa diklik -- SAMA catatan dgn versi Next.js. -->
      <Button v-if="isFirstPage" variant="outline" size="sm" disabled>
        <ChevronLeft class="h-3.5 w-3.5" /> Sebelumnya
      </Button>
      <Button v-else variant="outline" size="sm" as-child>
        <NuxtLink :to="{ query: queryFor(currentPage - 1) }"><ChevronLeft class="h-3.5 w-3.5" /> Sebelumnya</NuxtLink>
      </Button>
      <span class="px-2 font-tabular">{{ currentPage }} / {{ totalPages }}</span>
      <Button v-if="isLastPage" variant="outline" size="sm" disabled>
        Selanjutnya <ChevronRight class="h-3.5 w-3.5" />
      </Button>
      <Button v-else variant="outline" size="sm" as-child>
        <NuxtLink :to="{ query: queryFor(currentPage + 1) }">Selanjutnya <ChevronRight class="h-3.5 w-3.5" /></NuxtLink>
      </Button>
    </div>
  </div>
</template>
