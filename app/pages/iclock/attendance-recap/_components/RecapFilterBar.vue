<script setup lang="ts">
import { Search } from "@lucide/vue"
import { cn } from "@/lib/utils"
import type { Department, ActiveDevice } from "#shared/types/api"

// Reka-ui Select TIDAK MENGIZINKAN SelectItem dgn value="" (dipakai
// internal utk representasi "belum ada pilihan") -- sentinel value INI
// dipakai sbg opsi "Semua X" yang BISA DIKLIK utk reset filter balik ke
// kosong. Tanpa ini, setelah pilih 1 Pool, TIDAK ADA CARA balik ke
// "Semua Pool" lagi lewat dropdown.
const ALL_VALUE = "__all__"

function todayIso() {
  return new Date().toISOString().slice(0, 10)
}
function daysAgoIso(n: number) {
  const d = new Date()
  d.setDate(d.getDate() - n)
  return d.toISOString().slice(0, 10)
}

const props = defineProps<{
  departments: Department[]
  devices: ActiveDevice[]
  recapType: string
  permissions: { can_view_attendance_recap_kantin: boolean; can_view_attendance_recap_driver: boolean }
}>()

const route = useRoute()
const { choices: functionChoices } = useDeviceFunctionChoices()

// Kode Function KANTIN/DRIVER-* disembunyikan dari dropdown ini kalau
// user TIDAK punya izin granular yang sesuai -- MESKI dia punya akses
// ke tab "All" itu sendiri. Staff/superuser TIDAK PERNAH kefilter.
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

function handleSubmit() {
  const query: Record<string, string> = { recap_type: props.recapType, date_from: dateFrom.value, date_to: dateTo.value }
  if (pin.value) query.pin = pin.value
  // Function code CUMA relevan/dikirim utk "Rekap All" -- utk Kantin/Driver,
  // jenis fungsinya SUDAH ditentukan oleh tab yg dipilih.
  if (func.value && props.recapType === "all") query.function = func.value
  if (pool.value) query.pool = pool.value
  if (device.value) query.device = device.value
  navigateTo({ query })
}
</script>

<template>
  <form class="grid grid-cols-1 gap-3 rounded-lg border border-border bg-card p-3 sm:grid-cols-2 lg:grid-cols-3" @submit.prevent="handleSubmit">
    <div :class="cn('space-y-1.5', recapType === 'all' ? 'lg:col-span-2' : 'lg:col-span-3')">
      <Label>PIN / Nama</Label>
      <PinAutocomplete v-model="pin" />
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
      <Select :model-value="pool || ALL_VALUE" @update:model-value="(v) => (pool = v === ALL_VALUE ? '' : String(v))">
        <SelectTrigger><SelectValue placeholder="Semua Pool" /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL_VALUE">Semua Pool</SelectItem>
          <SelectItem v-for="d in departments" :key="d.DeptID" :value="String(d.DeptID)">{{ d.DeptName }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="space-y-1.5">
      <Label>Device</Label>
      <Select :model-value="device || ALL_VALUE" @update:model-value="(v) => (device = v === ALL_VALUE ? '' : String(v))">
        <SelectTrigger><SelectValue placeholder="Semua Device" /></SelectTrigger>
        <SelectContent>
          <SelectItem :value="ALL_VALUE">Semua Device</SelectItem>
          <SelectItem v-for="d in devices" :key="d.SN" :value="d.SN">{{ d.Alias }}</SelectItem>
        </SelectContent>
      </Select>
    </div>
    <div class="grid grid-cols-2 gap-2 lg:col-span-1">
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
