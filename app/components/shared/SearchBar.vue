<script setup lang="ts">
import { Search, Loader2 } from "@lucide/vue"

/**
 * Padanan search-bar.tsx versi Next.js -- debounce 400ms, tulis ke
 * query param ?q= (reset ?page= ke 1 tiap kali berubah). SEMUA state
 * ada di URL (bukan di komponen ini) supaya bookmark/refresh/back-
 * forward browser tetap konsisten -- SAMA prinsip dgn Next.js.
 */
const props = defineProps<{ placeholder?: string }>()

const route = useRoute()
const router = useRouter()
const value = ref((route.query.q as string) ?? "")
const pending = ref(false)

let debounceHandle: ReturnType<typeof setTimeout> | undefined
watch(value, (v) => {
  if (debounceHandle) clearTimeout(debounceHandle)
  pending.value = true
  debounceHandle = setTimeout(() => {
    const query = { ...route.query, q: v || undefined, page: undefined }
    router.push({ query }).finally(() => { pending.value = false })
  }, 400)
})
</script>

<template>
  <div class="relative w-full sm:w-64">
    <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
    <Input v-model="value" :placeholder="placeholder ?? 'Cari...'" class="pl-8" />
    <Loader2 v-if="pending" class="absolute right-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 animate-spin text-muted-foreground" />
  </div>
</template>
