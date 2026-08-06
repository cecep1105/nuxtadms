<script setup lang="ts">
import { cn } from "@/lib/utils"

const TABS = [
  { value: "all", label: "Rekap All", permKey: "can_view_attendance_recap" as const },
  { value: "kantin", label: "Rekap Kantin", permKey: "can_view_attendance_recap_kantin" as const },
  { value: "driver", label: "Rekap Driver", permKey: "can_view_attendance_recap_driver" as const },
]

/**
 * Tab pilih jenis Rekap Absensi (All/Kantin/Driver) -- CUMA tampilkan
 * tab yang user PUNYA izinnya (backend JUGA menegakkan ini scr
 * independen, tab yg disembunyikan di sini BUKAN satu-satunya
 * proteksi, cuma UX supaya user tidak lihat tab yg toh akan ditolak
 * backend).
 */
const props = defineProps<{
  current: string
  permissions: { can_view_attendance_recap: boolean; can_view_attendance_recap_kantin: boolean; can_view_attendance_recap_driver: boolean }
}>()

const route = useRoute()
const visibleTabs = computed(() => TABS.filter((t) => props.permissions[t.permKey]))

function handleClick(value: string) {
  const query = { ...route.query, recap_type: value, page: undefined, function: undefined }
  navigateTo({ query })
}
</script>

<template>
  <div v-if="visibleTabs.length > 1" class="mb-4 flex gap-1 border-b border-border">
    <button
      v-for="tab in visibleTabs" :key="tab.value" type="button"
      :class="cn(
        'border-b-2 px-4 py-2 text-sm font-medium transition-colors',
        current === tab.value ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
      )"
      @click="handleClick(tab.value)"
    >
      {{ tab.label }}
    </button>
  </div>
</template>
