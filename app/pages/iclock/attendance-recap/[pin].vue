<script setup lang="ts">
import { ApiError } from "@/composables/useApiClient"
import type { AttendanceRecapCardResponse } from "#shared/types/api"

const MONTH_NAMES = [
  "Januari", "Februari", "Maret", "April", "Mei", "Juni",
  "Juli", "Agustus", "September", "Oktober", "November", "Desember",
]

const route = useRoute()
const { request } = useApiClient()

const pin = computed(() => decodeURIComponent(route.params.pin as string))
const today = new Date()
const year = computed(() => Number(route.query.year) || today.getFullYear())
const month = computed(() => Number(route.query.month) || today.getMonth() + 1)

const { data: card, error: fetchError } = await useAsyncData(
  () => `recap-card-${pin.value}-${year.value}-${month.value}`,
  () => request<AttendanceRecapCardResponse>(`/iclock/attendance-recap/${encodeURIComponent(pin.value)}/card/?year=${year.value}&month=${month.value}`),
  { watch: [pin, year, month] }
)

const notFound = computed(() => fetchError.value instanceof ApiError && fetchError.value.status === 404)

const prevMonth = computed(() => (month.value === 1 ? { year: year.value - 1, month: 12 } : { year: year.value, month: month.value - 1 }))
const nextMonth = computed(() => (month.value === 12 ? { year: year.value + 1, month: 1 } : { year: year.value, month: month.value + 1 }))
</script>

<template>
  <div>
    <PageHeader
      :title="notFound ? `Employee '${pin}' tidak ditemukan` : (card?.name?.trim() || pin)"
      :description="undefined"
    >
      <template #description>
        <NuxtLink to="/iclock/attendance-recap" class="text-primary hover:underline">← Kembali ke Attendance Recap</NuxtLink>
      </template>
    </PageHeader>

    <Card v-if="notFound" class="p-8 text-center text-sm text-muted-foreground">
      Employee dengan PIN <span class="font-mono">{{ pin }}</span> tidak ditemukan.
    </Card>

    <template v-else-if="card">
      <div class="mb-4 flex items-center justify-between">
        <p class="font-mono text-xs text-muted-foreground">PIN: {{ card.pin }}</p>
        <div class="flex items-center gap-2">
          <Button variant="outline" size="sm" as-child>
            <NuxtLink :to="`/iclock/attendance-recap/${encodeURIComponent(pin)}?year=${prevMonth.year}&month=${prevMonth.month}`">← Sebelumnya</NuxtLink>
          </Button>
          <span class="min-w-[9rem] text-center text-sm font-medium">{{ MONTH_NAMES[month - 1] }} {{ year }}</span>
          <Button variant="outline" size="sm" as-child>
            <NuxtLink :to="`/iclock/attendance-recap/${encodeURIComponent(pin)}?year=${nextMonth.year}&month=${nextMonth.month}`">Selanjutnya →</NuxtLink>
          </Button>
        </div>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Jam</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Device</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow v-if="card.rows.length === 0">
              <TableCell :colspan="4" class="py-8 text-center text-muted-foreground">Tidak ada transaksi bulan ini.</TableCell>
            </TableRow>
            <TableRow v-for="(row, i) in card.rows" :key="i" v-else>
              <TableCell class="font-tabular">{{ new Date(row.date).toLocaleDateString("id-ID", { weekday: "short", day: "2-digit", month: "short" }) }}</TableCell>
              <TableCell class="font-tabular font-medium">{{ new Date(row.time).toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" }) }}</TableCell>
              <TableCell>
                <Badge v-if="row.type === 'IN'" variant="success">Masuk</Badge>
                <Badge v-else variant="destructive">Keluar</Badge>
              </TableCell>
              <TableCell class="font-mono text-muted-foreground">{{ row.device ?? "-" }}</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </Card>
    </template>
  </div>
</template>
