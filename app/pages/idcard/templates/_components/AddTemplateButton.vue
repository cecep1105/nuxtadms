<script setup lang="ts">
import { Loader2, Plus } from "@lucide/vue"
import type { IDCardType } from "#shared/types/api"

const CARD_TYPES: { value: IDCardType; label: string }[] = [
  { value: "karyawan", label: "Karyawan" },
  { value: "driver", label: "Driver" },
  { value: "visitor", label: "Visitor" },
  { value: "bhl", label: "BHL (Buruh Harian Lepas)" },
]

/**
 * ⚠️ Upload template PAKAI fetch() MANUAL LANGSUNG (BUKAN
 * useApiClient().request()) -- useApiClient() HARDCODE header
 * `Content-Type: application/json` sbg default, TIDAK cocok utk
 * FormData (berisi file gambar) yang BUTUH Content-Type
 * multipart/form-data DENGAN boundary yang di-generate browser
 * OTOMATIS -- kalau Content-Type di-set manual (walau ke nilai lain),
 * boundary itu TIDAK ikut ter-generate, upload rusak.
 */
const { session } = useUserSession()
const config = useRuntimeConfig()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const cardType = ref<IDCardType>("karyawan")
const name = ref("")
const file = ref<File | null>(null)

function resetForm() {
  cardType.value = "karyawan"; name.value = ""; file.value = null; error.value = null
}
watch(open, (isOpen) => { if (!isOpen) resetForm() })

function handleFileChange(e: Event) {
  file.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function handleSubmit() {
  if (!file.value) {
    error.value = "Gambar background wajib dipilih."
    return
  }
  loading.value = true
  error.value = null
  try {
    const formData = new FormData()
    formData.append("card_type", cardType.value)
    formData.append("name", name.value)
    formData.append("background_image", file.value)

    const apiBaseUrl = config.public.apiBaseUrl || "/api/v1"
    const res = await fetch(`${apiBaseUrl}/idcard/templates/`, {
      method: "POST",
      headers: session.value?.accessToken ? { Authorization: `Bearer ${session.value.accessToken}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw { status: res.status, body }
    }
    open.value = false
    resetForm()
    await refreshNuxtData()
  } catch (err: any) {
    error.value = err?.body?.detail || err?.body?.message || (err?.body ? Object.values(err.body).flat().join(" ") : null) || "Gagal menambahkan template."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Template</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Template ID Card</DialogTitle>
        <DialogDescription>Upload gambar background -- posisi foto & teks di atasnya sudah ditentukan otomatis.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label>Jenis Kartu</Label>
          <Select v-model="cardType">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in CARD_TYPES" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label for="tmpl-name">Nama Template</Label>
          <Input id="tmpl-name" v-model="name" required placeholder='mis. "Karyawan - Biru 2026"' />
        </div>

        <div class="space-y-1.5">
          <Label for="tmpl-file">Gambar Background</Label>
          <Input id="tmpl-file" type="file" accept="image/*" required @change="handleFileChange" />
          <p class="text-[11px] text-muted-foreground">Resolusi apa pun diterima -- otomatis diskalakan mengisi penuh ukuran kartu.</p>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
