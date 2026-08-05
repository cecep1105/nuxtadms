<script setup lang="ts">
import { Loader2, ShieldCheck } from "@lucide/vue"
import type { FeaturePermissionsResponse } from "#shared/types/api"

/**
 * "Kelola Izin" -- beri/cabut izin fitur terbatas ke user NON-STAFF
 * tertentu, TANPA perlu jadikan mereka staff/admin penuh. HANYA
 * relevan utk user non-staff -- staff/superuser otomatis punya akses
 * ke SEMUA fitur, pengaturan di sini baru berpengaruh kalau status
 * staff-nya diturunkan jadi user biasa.
 */
const props = defineProps<{ userId: number; username: string; isStaff: boolean }>()

const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const fetching = ref(false)
const error = ref<string | null>(null)
const permissions = ref<FeaturePermissionsResponse["permissions"]>([])

watch(open, (isOpen) => {
  if (!isOpen) return
  fetching.value = true
  error.value = null
  request<FeaturePermissionsResponse>(`/users/${props.userId}/feature-permissions/`)
    .then((data) => { permissions.value = data.permissions })
    .catch((err) => { error.value = extractErrorMessage(err, "Gagal mengambil data izin.") })
    .finally(() => { fetching.value = false })
})

function toggle(codename: string) {
  const item = permissions.value.find((p) => p.codename === codename)
  if (item) item.granted = !item.granted
}

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const granted = permissions.value.filter((p) => p.granted).map((p) => p.codename)
    await request(`/users/${props.userId}/manage-permissions/`, {
      method: "POST",
      body: JSON.stringify({ permissions: granted }),
    })
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menyimpan izin.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button variant="ghost" size="icon" aria-label="Kelola Izin" @click="open = true">
      <ShieldCheck class="h-3.5 w-3.5" />
    </Button>
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Kelola Izin: {{ username }}</DialogTitle>
        <DialogDescription>Centang fitur yang boleh diakses user ini tanpa perlu jadi staff/admin penuh.</DialogDescription>
      </DialogHeader>

      <div v-if="isStaff" class="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
        ⚠️ User ini sudah staff/admin, jadi otomatis punya akses ke SEMUA fitur -- pengaturan di bawah ini baru akan berpengaruh kalau status staff-nya diturunkan jadi user biasa.
      </div>
      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

      <div v-if="fetching" class="flex items-center justify-center py-6">
        <Loader2 class="h-5 w-5 animate-spin text-muted-foreground" />
      </div>
      <div v-else class="max-h-80 space-y-3 overflow-y-auto">
        <label v-for="p in permissions" :key="p.codename" class="flex cursor-pointer items-center gap-2 text-sm">
          <Checkbox :checked="p.granted" @update:checked="toggle(p.codename)" />
          <Label class="cursor-pointer font-normal">{{ p.label }}</Label>
        </label>
      </div>

      <DialogFooter>
        <Button variant="outline" @click="open = false">Batal</Button>
        <Button :disabled="loading || fetching" @click="handleSubmit">
          <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
