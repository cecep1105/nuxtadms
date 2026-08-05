<script setup lang="ts">
import { Loader2, UserCheck, UserX } from "@lucide/vue"

const props = defineProps<{ userId: number; isActive: boolean; disabled?: boolean; disabledReason?: string }>()

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const popoverOpen = computed({ get: () => !!error.value, set: (v) => { if (!v) error.value = null } })

async function handleClick() {
  loading.value = true
  error.value = null
  try {
    await request(`/users/${props.userId}/toggle-active/`, { method: "POST" })
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah status.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <Button
        variant="ghost" size="icon" :disabled="disabled || loading"
        :title="disabled ? disabledReason : (isActive ? 'Nonaktifkan user' : 'Aktifkan user')"
        @click="handleClick"
      >
        <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
        <UserCheck v-else-if="isActive" class="h-3.5 w-3.5 text-success" />
        <UserX v-else class="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent v-if="error" class="w-64 text-xs text-destructive">{{ error }}</PopoverContent>
  </Popover>
</template>
