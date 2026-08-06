<script setup lang="ts">
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
const props = defineProps<{ pageSize: number }>()

const route = useRoute()
const router = useRouter()

function handleChange(value: string) {
  // Ganti ukuran halaman -> baris yg SAMA bisa jatuh di halaman beda,
  // balik ke halaman 1 supaya tidak bingung.
  router.push({ query: { ...route.query, page_size: value, page: "1" } })
}
</script>

<template>
  <div class="flex items-center gap-1.5">
    <span class="whitespace-nowrap">Baris/halaman:</span>
    <Select :model-value="String(pageSize)" @update:model-value="(v) => handleChange(String(v))">
      <SelectTrigger class="h-7 w-[4.5rem] text-xs"><SelectValue /></SelectTrigger>
      <SelectContent>
        <SelectItem v-for="size in PAGE_SIZE_OPTIONS" :key="size" :value="String(size)">{{ size }}</SelectItem>
      </SelectContent>
    </Select>
  </div>
</template>
