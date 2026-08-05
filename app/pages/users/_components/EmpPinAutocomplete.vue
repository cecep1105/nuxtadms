<script setup lang="ts">
import { Search, X } from "@lucide/vue"
import type { EmployeeSearchResult } from "#shared/types/api"

/**
 * Autocomplete PIN utk kaitkan user ke data Employee (form Kelola
 * User). Klik hasil cuma MEMILIH PIN itu ke dalam form (tidak pindah
 * halaman), reuse endpoint pencarian yang sama (/iclock/employee-search/).
 */
const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: "update:modelValue", pin: string, name?: string): void }>()

const { request } = useApiClient()
const query = ref(props.modelValue)
const results = ref<EmployeeSearchResult[]>([])
const open = ref(false)
const containerRef = ref<HTMLDivElement>()

watch(() => props.modelValue, (v) => { query.value = v })

let debounceHandle: ReturnType<typeof setTimeout> | undefined
watch(query, (q) => {
  if (debounceHandle) clearTimeout(debounceHandle)
  if (q.trim().length < 2 || q === props.modelValue) {
    results.value = []
    return
  }
  debounceHandle = setTimeout(() => {
    request<{ employees: EmployeeSearchResult[] }>(`/iclock/employee-search/?q=${encodeURIComponent(q)}`)
      .then((data) => { results.value = data.employees; open.value = true })
      .catch(() => { results.value = [] })
  }, 300)
})

function handleSelect(emp: EmployeeSearchResult) {
  query.value = emp.pin
  emit("update:modelValue", emp.pin, emp.name)
  open.value = false
}

function handleClear() {
  query.value = ""
  emit("update:modelValue", "")
  results.value = []
}

function handleInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  query.value = v
  emit("update:modelValue", v)
}

onClickOutside(containerRef, () => { open.value = false })
</script>

<template>
  <div ref="containerRef" class="relative">
    <div class="relative">
      <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        :model-value="query"
        placeholder="Ketik PIN atau nama..."
        class="pl-8 pr-8"
        @input="handleInput"
        @focus="results.length > 0 && (open = true)"
      />
      <button v-if="query" type="button" class="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" aria-label="Hapus" @click="handleClear">
        <X class="h-3.5 w-3.5" />
      </button>
    </div>
    <div v-if="open && results.length > 0" class="absolute z-30 mt-1 w-full rounded-md border border-border bg-card shadow-lg">
      <button
        v-for="emp in results" :key="emp.pin" type="button"
        class="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-secondary"
        @click="handleSelect(emp)"
      >
        <span class="font-medium">{{ emp.name || "-" }}</span>
        <span class="font-mono text-muted-foreground">{{ emp.pin }}</span>
      </button>
    </div>
  </div>
</template>
