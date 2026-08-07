<script setup lang="ts">
import { Mail, WifiOff, Lock } from "@lucide/vue"
import { cn } from "@/lib/utils"
import type { WsMessage } from "@/composables/createWsConnection"

/**
 * Indikator GLOBAL (tampil di Topbar, SEMUA halaman dashboard staff --
 * BEDA dari badge serupa di halaman Mail Queue/Netwatch sendiri, yang
 * cuma tampil saat halaman ITU lagi dibuka) -- sejajar tombol dark/
 * light theme.
 *
 * Alur data: (1) fetch NILAI AWAL sekali saat komponen ini mount
 * (SEBELUM broadcast WebSocket pertama masuk, supaya angka tidak
 * kosong nunggu event pertama -- mail queue di-check tiap 1 menit,
 * netwatch cuma saat status BERUBAH, bisa lama kalau kebetulan semua
 * host stabil), (2) SETELAHNYA murni ikut broadcast WebSocket
 * (section 'mailq'/'netwatch'/'ad_locked_users') -- TIDAK polling ulang.
 */
const { request } = useApiClient()

const activeQueueCount = ref<number | null>(null)
const downHostCount = ref<number | null>(null)
const lockedUserCount = ref<number | null>(null)

request<{ active_count: number }>("/netmgmt/zentyal-mail/queue/?_limit=1")
  .then((data) => { activeQueueCount.value = data.active_count })
  .catch(() => { /* server mail mungkin belum dikonfigurasi -- biarkan badge tersembunyi, jangan tampilkan error di topbar */ })
request<{ down_count: number }>("/netmgmt/netwatch-summary/")
  .then((data) => { downHostCount.value = data.down_count })
  .catch(() => { /* router netwatch mungkin belum dikonfigurasi -- sama, diamkan saja */ })
request<{ count: number }>("/netmgmt/ad/users/locked/?_limit=1")
  .then((data) => { lockedUserCount.value = data.count })
  .catch(() => { /* AD mungkin belum dikonfigurasi -- sama, diamkan saja */ })

useNetmgmtWsMessage((msg: WsMessage) => {
  if (msg.section === "mailq") {
    const active = (msg.message as { active_count?: number }).active_count
    if (typeof active === "number") activeQueueCount.value = active
  }
  if (msg.section === "netwatch") {
    const results = (msg.message as { results?: { status: string }[] }).results
    if (Array.isArray(results)) downHostCount.value = results.filter((r) => r.status === "down").length
  }
  if (msg.section === "ad_locked_users") {
    const count = (msg.message as { count?: number }).count
    if (typeof count === "number") lockedUserCount.value = count
  }
})
</script>

<template>
  <div class="flex items-center gap-1">
    <NuxtLink
      v-if="activeQueueCount !== null" to="/netmgmt/zentyal/mail-queue"
      class="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      :title="`${activeQueueCount} mail queue active`"
    >
      <Mail class="h-4 w-4" />
      <span v-if="activeQueueCount > 0" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 font-tabular text-[10px] font-semibold text-primary-foreground">
        {{ activeQueueCount > 99 ? "99+" : activeQueueCount }}
      </span>
    </NuxtLink>

    <NuxtLink
      v-if="downHostCount !== null" to="/netmgmt/mikrotik/netwatch"
      class="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      :title="`${downHostCount} host netwatch down`"
    >
      <WifiOff :class="cn('h-4 w-4', downHostCount > 0 && 'text-destructive')" />
      <span v-if="downHostCount > 0" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-tabular text-[10px] font-semibold text-destructive-foreground">
        {{ downHostCount > 99 ? "99+" : downHostCount }}
      </span>
    </NuxtLink>

    <NuxtLink
      v-if="lockedUserCount !== null" to="/netmgmt/active-directory/locked-users"
      class="relative inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
      :title="`${lockedUserCount} user AD terkunci (2 menit terakhir)`"
    >
      <Lock :class="cn('h-4 w-4', lockedUserCount > 0 && 'text-destructive')" />
      <span v-if="lockedUserCount > 0" class="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 font-tabular text-[10px] font-semibold text-destructive-foreground">
        {{ lockedUserCount > 99 ? "99+" : lockedUserCount }}
      </span>
    </NuxtLink>
  </div>
</template>
