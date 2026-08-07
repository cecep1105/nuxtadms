<script setup lang="ts">
import { Loader2 } from "@lucide/vue"
import type { IDCardHolder } from "#shared/types/api"

// ⚠️ SAMA CATATAN dgn AddTemplateButton.vue: upload FormData PAKAI
// fetch() manual, BUKAN useApiClient() (hardcode Content-Type json).
const props = defineProps<{ mode: "add" | "edit"; holder?: IDCardHolder }>()
const open = defineModel<boolean>("open", { required: true })

const { session } = useUserSession()
const config = useRuntimeConfig()
const loading = ref(false)
const error = ref<string | null>(null)

const cardType = ref<"visitor" | "bhl">("visitor")
const fullName = ref("")
const idNumber = ref("")
const company = ref("")
const purpose = ref("")
const validUntil = ref("")
const photoFile = ref<File | null>(null)

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.holder) {
    cardType.value = props.holder.card_type
    fullName.value = props.holder.full_name
    idNumber.value = props.holder.id_number
    company.value = props.holder.company
    purpose.value = props.holder.purpose
    validUntil.value = props.holder.valid_until ?? ""
  } else {
    cardType.value = "visitor"; fullName.value = ""; idNumber.value = ""; company.value = ""; purpose.value = ""; validUntil.value = ""
  }
  photoFile.value = null
  error.value = null
})

function handlePhotoChange(e: Event) {
  photoFile.value = (e.target as HTMLInputElement).files?.[0] ?? null
}

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const formData = new FormData()
    formData.append("card_type", cardType.value)
    formData.append("full_name", fullName.value)
    formData.append("id_number", idNumber.value)
    formData.append("company", company.value)
    formData.append("purpose", purpose.value)
    if (validUntil.value) formData.append("valid_until", validUntil.value)
    if (photoFile.value) formData.append("photo", photoFile.value)

    const apiBaseUrl = config.public.apiBaseUrl || "/api/v1"
    const url = props.mode === "add" ? `${apiBaseUrl}/idcard/holders/` : `${apiBaseUrl}/idcard/holders/${props.holder!.id}/`
    const res = await fetch(url, {
      method: props.mode === "add" ? "POST" : "PATCH",
      headers: session.value?.accessToken ? { Authorization: `Bearer ${session.value.accessToken}` } : {},
      body: formData,
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw { body }
    }
    open.value = false
    await refreshNuxtData()
  } catch (err: any) {
    error.value = err?.body?.detail || err?.body?.message || (err?.body ? Object.values(err.body).flat().join(" ") : null) || "Gagal menyimpan data."
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[85vh] max-w-md overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ mode === "add" ? "Tambah Data Visitor/BHL" : `Edit — ${holder?.full_name}` }}</DialogTitle>
        <DialogDescription>Data ini dipakai saat generate ID Card jenis Visitor/BHL.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label>Jenis</Label>
          <Select v-model="cardType">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="visitor">Visitor</SelectItem>
              <SelectItem value="bhl">BHL (Buruh Harian Lepas)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label for="h-name">Nama Lengkap</Label>
          <Input id="h-name" v-model="fullName" required />
        </div>

        <div class="space-y-1.5">
          <Label for="h-idnum">No. KTP/Identitas</Label>
          <Input id="h-idnum" v-model="idNumber" />
        </div>

        <template v-if="cardType === 'visitor'">
          <div class="space-y-1.5">
            <Label for="h-company">Perusahaan Asal</Label>
            <Input id="h-company" v-model="company" />
          </div>
          <div class="space-y-1.5">
            <Label for="h-purpose">Keperluan/Sponsor</Label>
            <Input id="h-purpose" v-model="purpose" placeholder="Tujuan kunjungan / nama yang dituju" />
          </div>
        </template>

        <div class="space-y-1.5">
          <Label for="h-valid">Berlaku Sampai (opsional)</Label>
          <Input id="h-valid" v-model="validUntil" type="date" />
        </div>

        <div class="space-y-1.5">
          <Label for="h-photo">Foto <template v-if="mode === 'edit'">(kosongkan kalau tidak ganti)</template></Label>
          <Input id="h-photo" type="file" accept="image/*" @change="handlePhotoChange" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
