<script setup lang="ts">
import { Plus, Trash2, Eye, EyeOff } from "@lucide/vue"

export interface KeyValueRow { key: string; value: string }

/**
 * Editor field BEBAS (tambah/hapus baris key-value sendiri) -- dipakai
 * utk `data` di Data IT-Infra, krn field-nya TIDAK PUNYA skema tetap
 * per kategori -- pendekatan PALING FLEKSIBEL, admin bebas isi field
 * APA PUN sesuai kebutuhan tiap entry.
 */
const rows = defineModel<KeyValueRow[]>({ required: true })
const revealed = ref<Set<number>>(new Set())

function updateRow(index: number, patch: Partial<KeyValueRow>) {
  rows.value = rows.value.map((r, i) => (i === index ? { ...r, ...patch } : r))
}

function removeRow(index: number) {
  rows.value = rows.value.filter((_, i) => i !== index)
}

function addRow() {
  const last = rows.value.at(-1)
  if (last?.key || rows.value.length === 0) {
    rows.value = [...rows.value, { key: "", value: "" }]
  }
}

function toggleReveal(index: number) {
  const next = new Set(revealed.value)
  if (next.has(index)) next.delete(index)
  else next.add(index)
  revealed.value = next
}

// Field yg NAMANYA mengandung "password"/"secret" DIANGGAP sensitif --
// disamarkan (type="password") sampai tombol mata diklik, MURNI supaya
// tidak nampang di layar -- BUKAN keamanan tambahan.
function isSensitive(key: string): boolean {
  const lower = key.toLowerCase()
  return lower.includes("password") || lower.includes("secret") || lower.includes("pass")
}
</script>

<template>
  <div class="space-y-2">
    <Label>Data (field bebas)</Label>
    <div class="max-h-40 space-y-1.5 overflow-y-auto">
      <p v-if="rows.length === 0" class="text-xs text-muted-foreground">Belum ada field -- klik "Tambah Field" di bawah.</p>
      <div v-for="(row, i) in rows" :key="i" class="flex items-center gap-1.5">
        <Input :model-value="row.key" placeholder="nama field, mis. username" class="w-40 font-mono text-xs" @update:model-value="(v) => updateRow(i, { key: String(v) })" />
        <Input
          :model-value="row.value" placeholder="isi" :type="isSensitive(row.key) && !revealed.has(i) ? 'password' : 'text'"
          class="flex-1 font-mono text-xs" @update:model-value="(v) => updateRow(i, { value: String(v) })"
        />
        <Button v-if="isSensitive(row.key)" type="button" variant="ghost" size="icon" aria-label="Tampilkan/sembunyikan" @click="toggleReveal(i)">
          <EyeOff v-if="revealed.has(i)" class="h-3.5 w-3.5" /><Eye v-else class="h-3.5 w-3.5" />
        </Button>
        <Button type="button" variant="ghost" size="icon" class="text-destructive hover:text-destructive" aria-label="Hapus field" @click="removeRow(i)">
          <Trash2 class="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
    <Button type="button" variant="outline" size="sm" @click="addRow"><Plus class="h-3.5 w-3.5" /> Tambah Field</Button>
  </div>
</template>
