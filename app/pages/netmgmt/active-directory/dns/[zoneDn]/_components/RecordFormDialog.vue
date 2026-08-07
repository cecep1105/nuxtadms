<script setup lang="ts">
import { Loader2, Plus } from "@lucide/vue"
import type { DnsRecordRow } from "#shared/types/api"

// Sesuai desain awal -- CUMA A & CNAME yang ditawarkan (backend JUGA
// menolak tipe lain di endpoint ini).
type SimpleRecordType = "A" | "CNAME"
const RECORD_TYPES: SimpleRecordType[] = ["A", "CNAME"]

const props = defineProps<{ mode: "add" | "edit"; zoneDn: string; record?: DnsRecordRow }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)

const name = ref("")
const type = ref<SimpleRecordType>("A")
const ttl = ref("3600")
const value = ref("")

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.record) {
    const r = props.record
    name.value = r.name
    type.value = r.type as SimpleRecordType
    ttl.value = String(r.ttl_seconds)
    value.value = r.type === "A" ? (r.data.address ?? "") : (r.data.target ?? "")
  } else {
    name.value = ""; type.value = "A"; ttl.value = "3600"; value.value = ""
  }
  error.value = null
})

watch(type, () => { value.value = "" })

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const data = type.value === "A" ? { address: value.value } : { target: value.value }

    if (props.mode === "add") {
      await request("/netmgmt/ad/dns/records/", { method: "POST", body: JSON.stringify({ action: "add", zone_dn: props.zoneDn, name: name.value, type: type.value, data, ttl_seconds: Number(ttl.value) }) })
    } else if (props.record) {
      await request("/netmgmt/ad/dns/records/", { method: "POST", body: JSON.stringify({ action: "edit", node_dn: props.record.node_dn, old_raw_b64: props.record.raw_b64, type: type.value, data, ttl_seconds: Number(ttl.value) }) })
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
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ mode === "add" ? "Tambah Record DNS" : "Edit Record DNS" }}</DialogTitle>
        <DialogDescription>
          {{ mode === "add"
            ? "Kalau nama sudah ada (mis. tambah A record ke-2 utk round-robin), record baru ditambahkan ke node yang sama."
            : "Mengubah record ini TIDAK mempengaruhi record lain di node yang sama (kalau ada, mis. round-robin)." }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div v-if="mode === 'add'" class="space-y-1.5">
          <Label for="name">Nama Host</Label>
          <Input id="name" v-model="name" class="font-mono" placeholder="www (atau @ utk root zone)" required />
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
          <Label>{{ type === "A" ? "Alamat IPv4" : "Target (FQDN)" }}</Label>
          <Input v-model="value" class="font-mono" :placeholder="type === 'A' ? '192.168.1.100' : 'server1.contoso.com'" required />
        </div>

        <div class="space-y-1.5">
          <Label for="ttl">TTL (detik)</Label>
          <Input id="ttl" v-model="ttl" type="number" min="1" required />
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
