<script setup lang="ts">
import { Loader2, Lock, Unlock } from "@lucide/vue"

const props = defineProps<{ id: number; isLocked: boolean }>()
const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const popoverOpen = computed({ get: () => !!error.value, set: (v) => { if (!v) error.value = null } })

async function handleToggle() {
  loading.value = true
  error.value = null
  try {
    await request(`/mattendance/admin/face-profiles/${props.id}/toggle-lock/`, { method: "POST" })
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah status kunci.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" :disabled="loading" :aria-label="isLocked ? 'Buka kunci' : 'Kunci'" @click="handleToggle">
        <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
        <Lock v-else-if="isLocked" class="h-3.5 w-3.5 text-warning" />
        <Unlock v-else class="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent v-if="error" class="w-64 text-xs text-destructive">{{ error }}</PopoverContent>
  </Popover>
</template>
