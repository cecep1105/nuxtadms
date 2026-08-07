<script setup lang="ts">
import { Loader2, Plus, Trash2, Save } from "@lucide/vue"
import type { MailTransportRow } from "#shared/types/api"

/**
 * Transport map Postfix (domain -> target relay) -- diedit sbg SATU
 * TABEL UTUH (tambah/hapus/ubah baris lokal dulu, baru "Simpan Semua"
 * kirim SELURUH isi tabel ke backend) -- BEDA dari pola CRUD per-baris
 * di tabel lain, krn Flask API-nya menulis ULANG SELURUH file
 * transport tiap kali dipanggil (bukan modify 1 baris).
 */
const props = defineProps<{ initialRows: MailTransportRow[] }>()
const { request } = useApiClient()

const rows = ref<MailTransportRow[]>([...props.initialRows])
const saving = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

function updateRow(index: number, patch: Partial<MailTransportRow>) {
  rows.value = rows.value.map((r, i) => (i === index ? { ...r, ...patch } : r))
  success.value = false
}

function removeRow(index: number) {
  rows.value = rows.value.filter((_, i) => i !== index)
  success.value = false
}

function addRow() {
  rows.value = [...rows.value, { domain: "", target: "", status: "1" }]
  success.value = false
}

async function handleSave() {
  saving.value = true
  error.value = null
  try {
    await request("/netmgmt/zentyal-mail/transport/", {
      method: "POST",
      body: JSON.stringify({ transport_data: rows.value.map((r) => ({ domain: r.domain, target: r.target, status: r.status === "1" })) }),
    })
    success.value = true
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menyimpan transport map.")
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div>
    <div class="flex items-center justify-between border-b border-border p-3">
      <Button variant="outline" size="sm" @click="addRow"><Plus class="h-3.5 w-3.5" /> Tambah Baris</Button>
      <Button size="sm" :disabled="saving" @click="handleSave">
        <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" /><Save v-else class="h-3.5 w-3.5" /> Simpan Semua
      </Button>
    </div>

    <div v-if="error" class="m-3 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
    <div v-if="success" class="m-3 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Transport map berhasil disimpan &amp; Postfix di-reload.</div>

    <Table>
      <TableHeader>
        <TableRow><TableHead>Domain</TableHead><TableHead>Target</TableHead><TableHead>Aktif?</TableHead><TableHead class="text-right">Aksi</TableHead></TableRow>
      </TableHeader>
      <TableBody>
        <TableRow v-if="rows.length === 0">
          <TableCell :colspan="4" class="py-8 text-center text-muted-foreground">Belum ada baris transport map.</TableCell>
        </TableRow>
        <TableRow v-for="(row, i) in rows" :key="i" v-else>
          <TableCell><Input :model-value="row.domain" class="font-mono" placeholder="contoso.com" @update:model-value="(v) => updateRow(i, { domain: String(v) })" /></TableCell>
          <TableCell><Input :model-value="row.target" class="font-mono" placeholder="smtp:[mail.contoso.com]" @update:model-value="(v) => updateRow(i, { target: String(v) })" /></TableCell>
          <TableCell><Switch :checked="row.status === '1'" @update:checked="(checked: boolean) => updateRow(i, { status: checked ? '1' : '0' })" /></TableCell>
          <TableCell>
            <div class="flex justify-end">
              <Button variant="ghost" size="icon" class="text-destructive hover:text-destructive" @click="removeRow(i)"><Trash2 class="h-3.5 w-3.5" /></Button>
            </div>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  </div>
</template>
