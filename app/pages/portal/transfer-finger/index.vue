<script setup lang="ts">
import { Loader2, Fingerprint, ArrowLeft, Search, Check } from "@lucide/vue"
import type { EmployeeSearchResult, PoolDeviceChoicesResponse } from "#shared/types/api"

definePageMeta({ layout: "portal" })

const { request } = useApiClient()

const pinQuery = ref("")
const searchResults = ref<EmployeeSearchResult[]>([])
const selectedEmployee = ref<EmployeeSearchResult | null>(null)

const pools = ref<PoolDeviceChoicesResponse["pools"]>([])
const devices = ref<PoolDeviceChoicesResponse["devices"]>([])
const toPool = ref("")
const targetDevice = ref("")

const loading = ref(false)
const error = ref<string | null>(null)
const log = ref<string[] | null>(null)

// Muat daftar Pool sekali di awal.
request<PoolDeviceChoicesResponse>("/iclock/pool-device-choices/")
  .then((data) => { pools.value = data.pools })
  .catch(() => { pools.value = [] })

// Cari employee by PIN (debounce ringan).
let searchTimer: ReturnType<typeof setTimeout> | undefined
watch(pinQuery, (q) => {
  if (searchTimer) clearTimeout(searchTimer)
  if (q.trim().length < 2) {
    searchResults.value = []
    return
  }
  searchTimer = setTimeout(async () => {
    try {
      const data = await request<{ employees: EmployeeSearchResult[] }>(`/iclock/employee-search/?q=${encodeURIComponent(q.trim())}`)
      searchResults.value = data.employees
    } catch {
      searchResults.value = []
    }
  }, 300)
})

// Device tujuan menyesuaikan Pool yang dipilih.
watch(toPool, async (poolId) => {
  if (!poolId) {
    devices.value = []
    return
  }
  const data = await request<PoolDeviceChoicesResponse>(`/iclock/pool-device-choices/?pool_id=${poolId}`)
  devices.value = data.devices ?? []
})

function handleSelectEmployee(emp: EmployeeSearchResult) {
  selectedEmployee.value = emp
  searchResults.value = []
}

async function handleSubmit() {
  if (!selectedEmployee.value || !toPool.value) return
  loading.value = true
  error.value = null
  log.value = null
  try {
    const result = await request<{ log: string[] }>(
      `/iclock/device-user/${selectedEmployee.value.id}/transfer-finger/`,
      { method: "POST", body: JSON.stringify({ to_pool: toPool.value, target_device: targetDevice.value || undefined }) }
    )
    log.value = result.log
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal transfer fingerprint.")
  } finally {
    loading.value = false
  }
}

function resetForm() {
  selectedEmployee.value = null
  pinQuery.value = ""
  searchResults.value = []
  toPool.value = ""
  targetDevice.value = ""
  log.value = null
  error.value = null
}
</script>

<template>
  <div>
    <PageHeader title="Transfer Data Finger">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>

    <Card>
      <div class="p-4 pb-0">
        <h2 class="text-sm font-semibold">Kirim Fingerprint ke Pool/Device Tujuan</h2>
      </div>
      <div class="p-4">
        <div v-if="log" class="space-y-3">
          <div class="max-h-64 space-y-1 overflow-y-auto rounded-md border border-border bg-muted p-3 font-mono text-[11px]">
            <div v-for="(line, i) in log" :key="i">{{ line }}</div>
          </div>
          <Button @click="resetForm">Transfer Lagi</Button>
        </div>

        <form v-else class="space-y-4" @submit.prevent="handleSubmit">
          <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

          <div class="space-y-1.5">
            <Label>Cari Employee (PIN / Nama)</Label>
            <div v-if="selectedEmployee" class="flex items-center justify-between rounded-md border border-success/30 bg-success/10 px-3 py-2 text-sm">
              <span class="flex items-center gap-2">
                <Check class="h-3.5 w-3.5 text-success" />
                <span class="font-mono">{{ selectedEmployee.pin }}</span> — {{ selectedEmployee.name || "Tanpa nama" }}
              </span>
              <Button type="button" variant="ghost" size="sm" @click="selectedEmployee = null">Ganti</Button>
            </div>
            <div v-else class="relative">
              <Search class="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input v-model="pinQuery" placeholder="Ketik PIN atau nama..." class="pl-8" />
              <div v-if="searchResults.length > 0" class="absolute z-10 mt-1 w-full rounded-md border border-border bg-popover p-1 shadow-lg">
                <button
                  v-for="emp in searchResults" :key="emp.id" type="button"
                  class="flex w-full items-center justify-between rounded-sm px-2 py-1.5 text-left text-xs hover:bg-accent"
                  @click="handleSelectEmployee(emp)"
                >
                  <span class="font-medium">{{ emp.name || "-" }}</span>
                  <span class="font-mono text-muted-foreground">{{ emp.pin }}</span>
                </button>
              </div>
            </div>
          </div>

          <div class="space-y-1.5">
            <Label>Pool Tujuan</Label>
            <Select v-model="toPool" @update:model-value="targetDevice = ''">
              <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="p in pools" :key="p.id" :value="String(p.id)">{{ p.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div class="space-y-1.5">
            <Label>Device Spesifik (opsional)</Label>
            <Select v-model="targetDevice" :disabled="!toPool">
              <SelectTrigger><SelectValue placeholder="Semua device di pool ini" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="d in devices ?? []" :key="d.sn" :value="d.sn">{{ d.name }}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button type="submit" :disabled="loading || !selectedEmployee || !toPool">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><Fingerprint v-else class="h-3.5 w-3.5" /> Transfer
          </Button>
        </form>
      </div>
    </Card>
  </div>
</template>
