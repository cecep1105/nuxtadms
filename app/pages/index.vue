<script setup lang="ts">
import { Cpu, Fingerprint, ScrollText, ClipboardList, ArrowUpRight } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { Paginated, Transaction } from "#shared/types/api"

interface StatCardDef { title: string; icon: typeof Cpu; href: string; hint: string; path: string }

const STAT_CARDS: StatCardDef[] = [
  { title: "Active Device", icon: Cpu, href: "/iclock/active-devices", hint: "Device fingerprint terhubung", path: "/iclock/active-device/" },
  { title: "Employee", icon: Fingerprint, href: "/iclock/employees", hint: "Karyawan terdaftar", path: "/iclock/device-user/" },
  { title: "Transaction", icon: ScrollText, href: "/iclock/transactions", hint: "Total riwayat absensi", path: "/iclock/transaction/" },
  { title: "Registered Device", icon: ClipboardList, href: "/iclock/registered-devices", hint: "Menunggu aktivasi Pool", path: "/iclock/registered-device/" },
]

const { request } = useApiClient()

/** Hitung TOTAL 1 endpoint list -- balikin null (BUKAN throw) kalau gagal, supaya 1 kartu gagal TIDAK menggagalkan seluruh dashboard (kartu lain + tabel transaksi terbaru tetap tampil). */
async function safeCount(path: string): Promise<number | null> {
  try {
    const data = await request<Paginated<unknown>>(path)
    return data.count
  } catch (err) {
    if (err instanceof ApiError) return null
    throw err
  }
}

const { data: counts } = await useAsyncData("dashboard-counts", () =>
  Promise.all(STAT_CARDS.map((card) => safeCount(card.path)))
)

const { data: recentTransactions } = await useAsyncData("dashboard-recent-transactions", async () => {
  try {
    const data = await request<Paginated<Transaction>>("/iclock/transaction/?page=1")
    return data.results.slice(0, 8)
  } catch {
    // biarkan kosong -- kartu stat tetap tampil, cuma tabel recent yg tidak muncul
    return [] as Transaction[]
  }
})
</script>

<template>
  <div>
    <div class="mb-5">
      <h1 class="font-display text-lg font-semibold tracking-tight">Dashboard</h1>
      <p class="mt-0.5 text-xs text-muted-foreground">Ringkasan infrastruktur device fingerprint dan aktivitas absensi.</p>
    </div>

    <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
      <NuxtLink v-for="(card, i) in STAT_CARDS" :key="card.title" :to="card.href" class="group">
        <Card class="transition-colors hover:border-primary/40">
          <div class="flex items-center justify-between p-4 pb-1">
            <span class="text-xs font-medium text-muted-foreground">{{ card.title }}</span>
            <div class="flex h-7 w-7 items-center justify-center rounded-md bg-primary/10 text-primary">
              <component :is="card.icon" class="h-3.5 w-3.5" />
            </div>
          </div>
          <div class="p-4 pt-0">
            <div class="flex items-baseline gap-2">
              <span class="font-display font-tabular text-2xl font-semibold tracking-tight">
                {{ counts?.[i] == null ? "—" : counts[i]!.toLocaleString("id-ID") }}
              </span>
              <ArrowUpRight class="h-3.5 w-3.5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
            </div>
            <p class="mt-0.5 text-[11px] text-muted-foreground">{{ card.hint }}</p>
          </div>
        </Card>
      </NuxtLink>
    </div>

    <Card class="mt-4">
      <div class="p-4 pb-0">
        <h2 class="text-sm font-semibold">Transaksi Terbaru</h2>
      </div>
      <div class="p-0">
        <p v-if="!recentTransactions?.length" class="p-4 text-xs text-muted-foreground">Belum ada data transaksi.</p>
        <div v-else class="divide-y divide-border">
          <div v-for="t in recentTransactions" :key="t.id" class="flex items-center justify-between px-4 py-2 text-xs">
            <div class="min-w-0">
              <p class="truncate font-medium">{{ t.EmployeeName || t.EmployeePIN }}</p>
              <p class="font-mono text-[11px] text-muted-foreground">{{ t.SN }}</p>
            </div>
            <div class="text-right text-muted-foreground">
              <p class="font-tabular">{{ new Date(t.TTime).toLocaleString("id-ID") }}</p>
              <p>{{ t.StateDisplay }}</p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  </div>
</template>
