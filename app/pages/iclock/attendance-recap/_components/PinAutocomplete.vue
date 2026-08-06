<script setup lang="ts">
import { Search } from "@lucide/vue"
import type { EmployeeSearchResult } from "#shared/types/api"

/**
 * Autocomplete PIN/nama employee -- kalau admin KLIK salah satu hasil,
 * langsung navigasi ke kartu rekap bulanan 1 employee itu (BUKAN
 * sekadar mengisi filter PIN pada matrix utama). Mengetik tanpa klik
 * hasil (tekan Enter/klik tombol Filter) TETAP bisa dipakai sbg filter
 * regex biasa di matrix.
 */
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: "update:modelValue", v: string): void }>()

const { request } = useApiClient()
const results = ref<EmployeeSearchResult[]>([])
const open = ref(false)
const containerRef = ref<HTMLDivElement>()

let debounceHandle: ReturnType<typeof setTimeout> | undefined
watch(() => props.modelValue, (v) => {
  if (debounceHandle) clearTimeout(debounceHandle)
  if (v.trim().length < 2) {
    results.value = []
    return
  }
  debounceHandle = setTimeout(() => {
    request<{ employees: EmployeeSearchResult[] }>(`/iclock/employee-search/?q=${encodeURIComponent(v.trim())}`)
      .then((data) => { results.value = data.employees; open.value = data.employees.length > 0 })
      .catch(() => { results.value = [] })
  }, 300)
})

function handleSelect(emp: EmployeeSearchResult) {
  navigateTo(`/iclock/attendance-recap/${encodeURIComponent(emp.pin)}`)
}

onClickOutside(containerRef, () => { open.value = false })
</script>

<template>
  <div ref="containerRef" class="relative">
    <div class="relative">
      <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        :model-value="modelValue" placeholder="Ketik PIN / nama..." autocomplete="off" class="pl-8"
        @update:model-value="(v) => emit('update:modelValue', String(v))"
        @focus="results.length > 0 && (open = true)"
      />
    </div>
    <div v-if="open && results.length > 0" class="absolute z-20 mt-1 w-full min-w-[16rem] rounded-md border border-border bg-popover p-1 shadow-lg">
      <button
        v-for="emp in results" :key="emp.pin" type="button"
        class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
        @click="handleSelect(emp)"
      >
        <span class="font-medium">{{ emp.name || "-" }}</span>
        <span class="font-mono text-muted-foreground">{{ emp.pin }}</span>
      </button>
    </div>
  </div>
</template>
