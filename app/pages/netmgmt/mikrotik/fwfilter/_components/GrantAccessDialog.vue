<script setup lang="ts">
import { Loader2, ShieldPlus, Search } from "@lucide/vue"
import type { MikrotikDhcpLease } from "#shared/types/api"

type Step = "lookup" | "form"

/**
 * Otomasi alur kerja yang biasa dikerjakan MANUAL: (1) cari MAC address
 * device dari DHCP lease berdasarkan IP, (2) buat firewall filter rule
 * BARU dgn field2 disalin dari rule yang ada PERSIS sebelum rule
 * ber-comment 'BLOCK-ELSE' (template), src-mac-address & comment diganti
 * -- comment format `<hostname>|<WIFI|LAN>|<nama user>`. Logic
 * penyalinan/penyisipan rule SEPENUHNYA di backend -- form ini cuma
 * kumpulkan input & tampilkan hasil lookup DHCP.
 */
const props = defineProps<{ routerHost: string }>()

const { request } = useApiClient()
const open = ref(false)
const step = ref<Step>("lookup")

const ipAddress = ref("")
const searching = ref(false)
const searchError = ref<string | null>(null)
const foundLease = ref<MikrotikDhcpLease | null>(null)

const hostname = ref("")
const interfaceType = ref<"WIFI" | "LAN">("WIFI")
const username = ref("")
const submitting = ref(false)
const submitError = ref<string | null>(null)
const success = ref<string | null>(null)

function resetAll() {
  step.value = "lookup"
  ipAddress.value = ""
  searchError.value = null
  foundLease.value = null
  hostname.value = ""
  interfaceType.value = "WIFI"
  username.value = ""
  submitError.value = null
  success.value = null
}

watch(open, (isOpen) => { if (!isOpen) resetAll() })

async function handleSearch() {
  searching.value = true
  searchError.value = null
  try {
    const data = await request<{ results: MikrotikDhcpLease[] }>(`/netmgmt/routeros/${props.routerHost}/ip-dhcp_server-lease/?_q=${encodeURIComponent(ipAddress.value)}&_search_fields=address&_limit=1`)
    const lease = data.results[0]
    if (!lease) {
      searchError.value = `Tidak ada DHCP lease dengan IP address '${ipAddress.value}'. Pastikan device sudah pernah dapat IP dari DHCP.`
      return
    }
    foundLease.value = lease
    hostname.value = lease["host-name"] || ""
    step.value = "form"
  } catch (err) {
    searchError.value = extractErrorMessage(err, "Gagal mencari DHCP lease.")
  } finally {
    searching.value = false
  }
}

async function handleSubmit() {
  if (!foundLease.value) return
  submitting.value = true
  submitError.value = null
  try {
    const result = await request<{ message: string; comment: string }>(`/netmgmt/routeros/${props.routerHost}/firewall/grant-access/`, {
      method: "POST",
      body: JSON.stringify({ mac_address: foundLease.value["mac-address"], hostname: hostname.value, interface: interfaceType.value, username: username.value }),
    })
    success.value = result.comment
    await refreshNuxtData()
  } catch (err) {
    submitError.value = extractErrorMessage(err, "Gagal membuat rule firewall.")
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <Button size="sm" @click="open = true"><ShieldPlus class="h-3.5 w-3.5" /> Berikan Akses Internet</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Berikan Akses Internet</DialogTitle>
        <DialogDescription>
          {{ step === "lookup"
            ? "Masukkan IP address device -- MAC address-nya akan dicari otomatis dari DHCP lease."
            : "Rule baru akan disisipkan tepat sebelum rule 'BLOCK-ELSE', menyalin pengaturan (chain/action/dst) dari rule yang ada di posisi itu sekarang." }}
        </DialogDescription>
      </DialogHeader>

      <div v-if="success" class="space-y-4">
        <div class="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">
          Rule berhasil ditambahkan dengan comment: <span class="font-mono font-medium">{{ success }}</span>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="resetAll">Tambah Lagi</Button>
          <Button @click="open = false">Selesai</Button>
        </DialogFooter>
      </div>

      <form v-else-if="step === 'lookup'" class="space-y-4" @submit.prevent="handleSearch">
        <div v-if="searchError" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ searchError }}</div>
        <div class="space-y-1.5">
          <Label for="ip">IP Address Device</Label>
          <Input id="ip" v-model="ipAddress" required class="font-mono" placeholder="192.168.1.50" autofocus />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="searching"><Loader2 v-if="searching" class="h-3.5 w-3.5 animate-spin" /><Search v-else class="h-3.5 w-3.5" /> Cari</Button>
        </DialogFooter>
      </form>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="submitError" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ submitError }}</div>

        <div class="rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs">
          <p>MAC Address: <span class="font-mono font-medium">{{ foundLease?.["mac-address"] }}</span></p>
          <p class="text-muted-foreground">IP: {{ foundLease?.address }}</p>
        </div>

        <div class="space-y-1.5">
          <Label for="hostname">Nama Host</Label>
          <Input id="hostname" v-model="hostname" required placeholder="laptop-budi" />
        </div>

        <div class="space-y-1.5">
          <Label>Interface</Label>
          <Select v-model="interfaceType">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="WIFI">WIFI</SelectItem>
              <SelectItem value="LAN">LAN</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label for="username">Nama User</Label>
          <Input id="username" v-model="username" required placeholder="Budi Santoso" />
        </div>

        <div class="rounded-md border border-border px-3 py-2 text-[11px] text-muted-foreground">
          Preview comment: <span class="font-mono">{{ hostname || "..." }}</span>|<span class="font-mono">{{ interfaceType }}</span>|<span class="font-mono">{{ username || "..." }}</span>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="step = 'lookup'">Kembali</Button>
          <Button type="submit" :disabled="submitting"><Loader2 v-if="submitting" class="h-3.5 w-3.5 animate-spin" /><ShieldPlus v-else class="h-3.5 w-3.5" /> Buat Rule</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
