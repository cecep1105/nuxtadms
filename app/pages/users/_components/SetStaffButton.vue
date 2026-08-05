<script setup lang="ts">
import { Loader2, ShieldCheck, Shield } from "@lucide/vue"

const props = defineProps<{ userId: number; isStaff: boolean; disabled?: boolean; disabledReason?: string }>()

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const popoverOpen = computed({ get: () => !!error.value, set: (v) => { if (!v) error.value = null } })

async function handleClick() {
  loading.value = true
  error.value = null
  try {
    await request(`/users/${props.userId}/set-staff/`, { method: "POST", body: JSON.stringify({ is_staff: !props.isStaff }) })
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah role.")
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
        :title="disabled ? disabledReason : (isStaff ? 'Cabut akses Staff' : 'Jadikan Staff')"
        @click="handleClick"
      >
        <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
        <ShieldCheck v-else-if="isStaff" class="h-3.5 w-3.5 text-primary" />
        <Shield v-else class="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent v-if="error" class="w-64 text-xs text-destructive">{{ error }}</PopoverContent>
  </Popover>
</template>
