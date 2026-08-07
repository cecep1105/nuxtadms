<script setup lang="ts">
import { Router } from "@lucide/vue"
import type { RouterChoice } from "#shared/types/api"

/**
 * Dropdown pilih router -- opsi dari `iclock.RegisteredDevice.IPRouter`,
 * label "<nama dept> - <IP>". Pilihan ditulis ke URL param `?router=<ip>`
 * (halaman yang baca param ini query ulang ke router yang dipilih) --
 * SAMA pola dgn komponen RouterOS* lain (baca/tulis URL, bukan state lokal).
 */
const props = defineProps<{ currentRouterIp: string }>()
const route = useRoute()
const router = useRouter()
const { request } = useApiClient()
const choices = ref<RouterChoice[]>([])

request<{ results: RouterChoice[] }>("/netmgmt/router-choices/")
  .then((data) => { choices.value = data.results })
  .catch(() => { /* gagal ambil daftar pilihan -- dropdown cukup kosong, tidak ganggu halaman utama */ })

function handleChange(ip: string) {
  router.push({ query: { ...route.query, router: ip, page: undefined } })
}

// Kalau router SAAT INI (dari default/.env) belum ada di daftar pilihan
// (mis. IP belum terdaftar sbg IPRouter device mana pun), tetap
// tampilkan sbg opsi TAMBAHAN supaya dropdown tidak "kosong"/membingungkan.
const hasCurrent = computed(() => choices.value.some((c) => c.ip_router === props.currentRouterIp))
</script>

<template>
  <Select :model-value="currentRouterIp" @update:model-value="(v) => handleChange(String(v))">
    <SelectTrigger class="w-64">
      <Router class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
      <SelectValue placeholder="Pilih router" />
    </SelectTrigger>
    <SelectContent>
      <SelectItem v-if="!hasCurrent" :value="currentRouterIp">{{ currentRouterIp }} (saat ini)</SelectItem>
      <SelectItem v-for="c in choices" :key="c.ip_router" :value="c.ip_router">{{ c.dept_name }} - {{ c.ip_router }}</SelectItem>
    </SelectContent>
  </Select>
</template>
