<script setup lang="ts">
import type { MobileAttendanceSource } from "#shared/types/api"

/**
 * Dropdown pilih submenu Mobile Attendance (Karyawan/Driver/Mitra/
 * Kantin/Kantin Mitra Mobile) -- SATU halaman menaungi SEMUA submenu,
 * ganti submenu = ganti sumber data MSSQL yang di-query.
 */
const props = defineProps<{ current: string; sources: MobileAttendanceSource[] }>()
const route = useRoute()
const router = useRouter()

function handleChange(slug: string) {
  router.push({ query: { ...route.query, source: slug, page: undefined, q: undefined } })
}
</script>

<template>
  <Select :model-value="current" @update:model-value="(v) => handleChange(String(v))">
    <SelectTrigger class="w-56"><SelectValue placeholder="Pilih submenu" /></SelectTrigger>
    <SelectContent>
      <SelectItem v-for="s in sources" :key="s.slug" :value="s.slug">{{ s.title }}</SelectItem>
    </SelectContent>
  </Select>
</template>
