<script setup lang="ts">
import { Search } from "@lucide/vue"
import type { PoolDeviceChoicesResponse } from "#shared/types/api"

/**
 * Versi Portal dari RecapFilterBar (staff) -- PIN (input teks polos,
 * BUKAN PinAutocomplete -- itu query ke endpoint staff-only) + Function
 * (khusus tab "All") + Pool + Device + rentang tanggal. Pool/Device &
 * Function diambil dari endpoint RINGAN & READ-ONLY
 * (/iclock/pool-device-choices/, /iclock/device-function-choices/,
 * KEDUANYA diizinkan utk non-staff dgn izin recap) -- BUKAN endpoint
 * Department/ActiveDevice staff-only yang expose detail device
 * selengkapnya (IP/MAC/dst), TIDAK cocok utk user portal.
 */
const ALL_VALUE = "__all__"

function todayIso() { return new Date().toISOString().slice(0, 10) }
function daysAgoIso(n: number) { const d = new Date(); d.setDate(d.getDate() - n); return d.toISOString().slice(0, 10) }

const props = defineProps<{
  recapType: string
  permissions: { can_view_attendance_recap_kantin: boolean; can_view_attendance_recap_driver: boolean }
}>()

const route = useRoute()
const { request } = useApiClient()
const { choices: functionChoices } = useDeviceFunctionChoices()

const visibleFunctionChoices = computed(() => functionChoices.value.filter((c) => {
  const desc = c.label.split(" — ")[1] ?? ""
  if (desc === "KANTIN") return props.permissions.can_view_attendance_recap_kantin
  if (desc.startsWith("DRIVER")) return props.permissions.can_view_attendance_recap_driver
  return true
}))

const pin = ref((route.query.pin as string) ?? "")
const func = ref((route.query.function as string) ?? "")
const pool = ref((route.query.pool as string) ?? "")
const device = ref((route.query.device as string) ?? "")
const dateFrom = ref((route.query.date_from as string) ?? daysAgoIso(6))
const dateTo = ref((route.query.date_to as string) ?? todayIso())

const pools = ref<{ id: number; name: string }[]>([])
const devices = ref<{ sn: string; name: string }[]>([])

request<PoolDeviceChoicesResponse>("/iclock/pool-device-choices/")
  .then((data) => { pools.value = data.pools })
  .catch(() => { /* gagal ambil daftar pool -- dropdown cukup kosong, tidak ganggu filter lain */ })

watch(pool, async (poolId) => {
  if (!poolId) { devices.value = []; return }
  try {
    const data = await request<PoolDeviceChoicesResponse>(`/iclock/pool-device-choices/?pool_id=${poolId}`)
    devices.value = data.devices ?? []
  } catch {
    devices.value = []
  }
})

function handleSubmit() {
  const query: Record<string, string> = { recap_type: props.recapType, date_from: dateFrom.value, date_to: dateTo.value }
  if (pin.value) query.pin = pin.value
  if (func.value && props.recapType === "all") query.function = func.value
  if (pool.value) query.pool = pool.value
  if (device.value) query.device = device.value
  navigateTo({ query })
}
</script>

<template>
  <form class="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-6" @submit.prevent="handleSubmit">
    <div class="space-y-1.5 lg:col-span-1">
      <Label>PIN / Nama</Label>
      <Input v-model="pin" placeholder="Semua PIN" />
    </div>
    <div v-if="recapType === 'all'" class="space-y-1.5">
      <Label>Function Code</Label>
      <Select :model-value="func || ALL_VALUE" @update:model-value="(v) => (func = v === ALL_VALUE ? '' : String(v))">
        <SelectTrigger><SelectValue placeholder="Semua Function" /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL_VALUE">Semua Function</SelectItem>
          <SelectItem v-for="c in visibleFunctionChoices" :key="c.value" :value="c.value">{{ c.label }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="space-y-1.5">
      <Label>Pool</Label>
      <Select :model-value="pool || ALL_VALUE" @update:model-value="(v) => { pool = v === ALL_VALUE ? '' : String(v); device = '' }">
        <SelectTrigger><SelectValue placeholder="Semua Pool" /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL_VALUE">Semua Pool</SelectItem>
          <SelectItem v-for="p in pools" :key="p.id" :value="String(p.id)">{{ p.name }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="space-y-1.5">
      <Label>Device</Label>
      <Select :model-value="device || ALL_VALUE" @update:model-value="(v) => (device = v === ALL_VALUE ? '' : String(v))" :disabled="!pool">
        <SelectTrigger><SelectValue :placeholder="pool ? 'Semua Device' : 'Pilih Pool dulu'" /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL_VALUE">Semua Device</SelectItem>
          <SelectItem v-for="d in devices" :key="d.sn" :value="d.sn">{{ d.name }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="grid grid-cols-2 gap-2 lg:col-span-2">
      <div class="space-y-1.5">
        <Label>Dari</Label>
        <Input v-model="dateFrom" type="date" />
      </div>
      <div class="space-y-1.5">
        <Label>Sampai</Label>
        <Input v-model="dateTo" type="date" />
      </div>
    </div>
    <div class="flex items-end lg:col-span-6">
      <Button type="submit" size="sm"><Search class="h-3.5 w-3.5" /> Terapkan Filter</Button>
    </div>
  </form>
</template>
