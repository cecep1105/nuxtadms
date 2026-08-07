<script setup lang="ts">
import { ArrowLeft, ChevronLeft, ChevronRight } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { AttendanceRecapCardResponse, AttendanceRecapCardRow } from "#shared/types/api"

const MONTH_NAMES = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"]

definePageMeta({ layout: "portal" })

/** Kelompokkan baris transaksi flat jadi per-tanggal, URUT tanggal TERBARU dulu. */
function groupByDate(rows: AttendanceRecapCardRow[]): { date: string; rows: AttendanceRecapCardRow[] }[] {
  const map = new Map<string, AttendanceRecapCardRow[]>()
  for (const row of rows) {
    const list = map.get(row.date) ?? []
    list.push(row)
    map.set(row.date, list)
  }
  return Array.from(map.entries())
    .sort((a, b) => b[0].localeCompare(a[0]))
    .map(([date, dateRows]) => ({ date, rows: dateRows }))
}

const route = useRoute()
const today = new Date()
const year = computed(() => Number(route.query.year) || today.getFullYear())
const month = computed(() => Number(route.query.month) || today.getMonth() + 1)

const { request } = useApiClient()
const notLinked = ref(false)
const { data: card } = await useAsyncData(
  () => `portal-my-attendance-${year.value}-${month.value}`,
  async () => {
    notLinked.value = false
    try {
      return await request<AttendanceRecapCardResponse>(`/iclock/my-attendance/?year=${year.value}&month=${month.value}`)
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        notLinked.value = true
        return null
      }
      throw err
    }
  },
  { watch: [year, month] }
)

const prevMonth = computed(() => (month.value === 1 ? { year: year.value - 1, month: 12 } : { year: year.value, month: month.value - 1 }))
const nextMonth = computed(() => (month.value === 12 ? { year: year.value + 1, month: 1 } : { year: year.value, month: month.value + 1 }))
const days = computed(() => (card.value ? groupByDate(card.value.rows) : []))
</script>

<template>
  <div>
    <PageHeader title="My Attendance">
      <template #description>
        <NuxtLink to="/portal" class="inline-flex items-center gap-1 text-primary hover:underline">
          <ArrowLeft class="h-3 w-3" /> Kembali ke Menu
        </NuxtLink>
      </template>
    </PageHeader>

    <Card v-if="notLinked" class="p-8 text-center text-sm text-muted-foreground">
      Akun Anda belum terkait dengan data Employee (PIN absensi). Hubungi admin untuk mengaitkan akun Anda.
    </Card>

    <template v-else-if="card">
      <div class="mb-4 flex items-center justify-between">
        <p class="text-xs text-muted-foreground">
          {{ card.name?.trim() || card.pin }} <span class="font-mono">({{ card.pin }})</span>
        </p>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" as-child>
            <NuxtLink :to="`/portal/my-attendance?year=${prevMonth.year}&month=${prevMonth.month}`">
              <ChevronLeft class="h-3.5 w-3.5" /> Sebelumnya
            </NuxtLink>
          </Button>
          <span class="min-w-[9rem] text-center text-sm font-medium">{{ MONTH_NAMES[month - 1] }} {{ year }}</span>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink :to="`/portal/my-attendance?year=${nextMonth.year}&month=${nextMonth.month}`">
              Selanjutnya <ChevronRight class="h-3.5 w-3.5" />
            </NuxtLink>
          </Button>
        </div>
      </div>

      <Card v-if="days.length === 0" class="p-8 text-center text-sm text-muted-foreground">Tidak ada transaksi absensi bulan ini.</Card>
      <div v-else class="space-y-3">
        <Card v-for="day in days" :key="day.date" class="overflow-hidden p-0">
          <div class="flex items-baseline justify-between border-b border-border bg-secondary/50 px-4 py-2">
            <span class="text-sm font-semibold">{{ new Date(day.date).toLocaleDateString("id-ID", { weekday: "long" }) }}</span>
            <span class="font-tabular text-xs text-muted-foreground">{{ new Date(day.date).toLocaleDateString("id-ID", { day: "2-digit", month: "2-digit", year: "numeric" }) }}</span>
          </div>
          <div class="divide-y divide-border">
            <div v-for="(row, i) in day.rows" :key="i" class="flex items-center justify-between px-4 py-2 text-sm">
              <span class="font-mono text-muted-foreground">{{ row.device ?? "-" }}</span>
              <div class="flex items-center gap-3">
                <span class="font-tabular text-muted-foreground">{{ new Date(row.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }) }}</span>
                <Badge v-if="row.type === 'IN'" variant="success">IN</Badge>
                <Badge v-else variant="destructive">OUT</Badge>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </template>
  </div>
</template>
