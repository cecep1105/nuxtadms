<script setup lang="ts">
import { Loader2, MonitorPlay } from "@lucide/vue"

/**
 * Buka konsol VMware Remote Console (VMRC) -- perlu APLIKASI DESKTOP
 * VMRC terinstall (mendaftarkan protocol handler vmrc:// ke OS) --
 * klik tombol ini navigasi browser ke URI itu, OS yg urus buka
 * aplikasinya (browser TIDAK bisa render VMRC sendiri).
 */
const props = defineProps<{ vmId: string }>()
const loading = ref(false)
const error = ref<string | null>(null)

async function handleClick() {
  loading.value = true
  error.value = null
  try {
    const data = await $fetch<{ uri: string }>(`/api/vsphere-vmrc-ticket?vm=${encodeURIComponent(props.vmId)}`)
    window.location.href = data.uri
  } catch (err: any) {
    error.value = err?.data?.statusMessage || err?.statusMessage || err?.message || "Gagal membuka Remote Console."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="flex flex-col items-end gap-1">
    <Button size="sm" variant="outline" :disabled="loading" @click="handleClick">
      <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><MonitorPlay v-else class="h-3.5 w-3.5" /> Remote Guest
    </Button>
    <p v-if="error" class="max-w-64 text-right text-[11px] text-destructive">{{ error }}</p>
  </div>
</template>
