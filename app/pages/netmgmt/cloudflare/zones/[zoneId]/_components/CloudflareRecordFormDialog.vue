<script setup lang="ts">
import { Loader2, Plus } from "@lucide/vue"
import type { CloudflareDnsRecord, CloudflareRecordType } from "#shared/types/api"

const RECORD_TYPES: CloudflareRecordType[] = ["A", "AAAA", "CNAME", "MX", "TXT", "NS"]
const PROXIABLE_TYPES: CloudflareRecordType[] = ["A", "AAAA", "CNAME"]
const CONTENT_LABEL: Record<CloudflareRecordType, string> = {
  A: "Alamat IPv4", AAAA: "Alamat IPv6", CNAME: "Target (FQDN)",
  MX: "Mail Server (FQDN)", TXT: "Text", NS: "Nameserver",
}

const props = defineProps<{ mode: "add" | "edit"; zoneId: string; record?: CloudflareDnsRecord }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)

const name = ref("")
const type = ref<CloudflareRecordType>("A")
const content = ref("")
const ttl = ref("1") // 1 = "Auto" di Cloudflare
const proxied = ref(false)
const priority = ref("10")

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.record) {
    const r = props.record
    name.value = r.name
    type.value = r.type as CloudflareRecordType
    content.value = r.content
    ttl.value = String(r.ttl)
    proxied.value = r.proxied
    priority.value = r.priority != null ? String(r.priority) : "10"
  } else {
    name.value = ""; type.value = "A"; content.value = ""; ttl.value = "1"; proxied.value = false; priority.value = "10"
  }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const body: Record<string, unknown> = { type: type.value, name: name.value, content: content.value, ttl: Number(ttl.value) }
    if (PROXIABLE_TYPES.includes(type.value)) body.proxied = proxied.value
    if (type.value === "MX") body.priority = Number(priority.value)

    if (props.mode === "add") {
      await request(`/netmgmt/cloudflare/zones/${props.zoneId}/records/action/`, { method: "POST", body: JSON.stringify({ ...body, action: "add" }) })
    } else if (props.record) {
      await request(`/netmgmt/cloudflare/zones/${props.zoneId}/records/action/`, { method: "POST", body: JSON.stringify({ ...body, action: "edit", record_id: props.record.id }) })
    }
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, `Gagal ${props.mode === "add" ? "menambah" : "memperbarui"} record.`)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === "add" ? "Tambah Record DNS" : "Edit Record DNS" }}</DialogTitle>
        <DialogDescription>Domain: <span class="font-mono">{{ name || "..." }}</span></DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label for="cf-name">Nama Host</Label>
          <Input id="cf-name" v-model="name" required class="font-mono" placeholder="www (atau @ utk root domain)" />
        </div>

        <div class="space-y-1.5">
          <Label>Tipe Record</Label>
          <Select v-model="type" :disabled="mode === 'edit'">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in RECORD_TYPES" :key="t" :value="t">{{ t }}</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="mode === 'edit'" class="text-[11px] text-muted-foreground">Tipe tidak bisa diubah saat edit -- hapus &amp; buat record baru kalau perlu ganti tipe.</p>
        </div>

        <div class="space-y-1.5">
          <Label for="cf-content">{{ CONTENT_LABEL[type] }}</Label>
          <Input id="cf-content" v-model="content" required class="font-mono" />
        </div>

        <div v-if="type === 'MX'" class="space-y-1.5">
          <Label for="cf-priority">Priority</Label>
          <Input id="cf-priority" v-model="priority" type="number" min="0" required />
        </div>

        <div class="space-y-1.5">
          <Label for="cf-ttl">TTL (detik, 1 = Auto)</Label>
          <Input id="cf-ttl" v-model="ttl" type="number" min="1" />
        </div>

        <div v-if="PROXIABLE_TYPES.includes(type)" class="flex items-center justify-between rounded-md border border-border px-3 py-2">
          <div>
            <Label for="cf-proxied" class="cursor-pointer">Proxy lewat Cloudflare</Label>
            <p class="text-[11px] text-muted-foreground">Ikon awan oranye -- lalu lintas dirutekan lewat CDN/proteksi Cloudflare.</p>
          </div>
          <Switch id="cf-proxied" v-model:checked="proxied" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><Plus v-else class="h-3.5 w-3.5" /> {{ mode === "add" ? "Tambah" : "Simpan" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
