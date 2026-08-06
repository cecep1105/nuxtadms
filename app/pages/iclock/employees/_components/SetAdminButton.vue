<script setup lang="ts">
import { Loader2, ShieldCheck, Shield } from "@lucide/vue"

/** Privilege 14 = Admin di device fisik -- BEDA numeric-nya dari "Administrator"=6 di dropdown Privilege form, konvensi lama yang dipertahankan apa adanya. */
const PRIVILEGE_ADMIN = 14

const props = defineProps<{ employeeId: number; privilege: number | null }>()
const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)
const isAdmin = computed(() => props.privilege === PRIVILEGE_ADMIN)
const popoverOpen = computed({ get: () => !!error.value, set: (v) => { if (!v) error.value = null } })

async function handleClick() {
  loading.value = true
  error.value = null
  try {
    const result = await request<{ device_synced: boolean; device_error: string | null }>(
      `/iclock/device-user/${props.employeeId}/toggle-privilege/`,
      { method: "POST" }
    )
    if (result.device_error) {
      error.value = `Privilege di database berubah, TAPI gagal sync ke device fisik: ${result.device_error}`
    } else {
      await refreshNuxtData()
    }
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah privilege.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Popover v-model:open="popoverOpen">
    <PopoverTrigger as-child>
      <Button variant="ghost" size="icon" :disabled="loading" :title="isAdmin ? 'Cabut Admin' : 'Set as Admin'" @click="handleClick">
        <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" />
        <ShieldCheck v-else-if="isAdmin" class="h-3.5 w-3.5 text-primary" />
        <Shield v-else class="h-3.5 w-3.5 text-muted-foreground" />
      </Button>
    </PopoverTrigger>
    <PopoverContent v-if="error" class="w-72 text-xs text-warning">{{ error }}</PopoverContent>
  </Popover>
</template>
