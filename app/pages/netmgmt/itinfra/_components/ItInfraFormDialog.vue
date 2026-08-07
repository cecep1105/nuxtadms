<script setup lang="ts">
import { Loader2, Plus } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { ITInfraCategory, ITInfraEntryDetail } from "#shared/types/api"
import type { KeyValueRow } from "./KeyValueEditor.vue"

const props = defineProps<{ mode: "add" | "edit"; entryId?: number; categories: ITInfraCategory[] }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const fetchingDetail = ref(false)
const error = ref<string | null>(null)

const categoryId = ref("")
const name = ref("")
const notes = ref("")
const isStaffOnly = ref(false)
const rows = ref<KeyValueRow[]>([])

watch(open, (isOpen) => {
  if (!isOpen) return
  error.value = null

  if (props.mode === "edit" && props.entryId) {
    fetchingDetail.value = true
    request<ITInfraEntryDetail>(`/netmgmt/itinfra/entries/${props.entryId}/`)
      .then((detail) => {
        categoryId.value = String(detail.category_id)
        name.value = detail.name
        notes.value = detail.notes
        isStaffOnly.value = detail.is_staff_only
        rows.value = Object.entries(detail.data).map(([key, value]) => ({ key, value: String(value) }))
      })
      .catch((err) => { error.value = extractErrorMessage(err, "Gagal mengambil detail data.") })
      .finally(() => { fetchingDetail.value = false })
  } else {
    categoryId.value = props.categories[0] ? String(props.categories[0].id) : ""
    name.value = ""; notes.value = ""; isStaffOnly.value = false; rows.value = []
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const dataObj: Record<string, string> = {}
    for (const row of rows.value) {
      if (row.key.trim()) dataObj[row.key.trim()] = row.value
    }

    const body: Record<string, unknown> = { category_id: Number(categoryId.value), name: name.value, data: dataObj, notes: notes.value, is_staff_only: isStaffOnly.value }
    if (props.mode === "add") {
      await request("/netmgmt/itinfra/entries/action/", { method: "POST", body: JSON.stringify({ ...body, action: "add" }) })
    } else {
      await request("/netmgmt/itinfra/entries/action/", { method: "POST", body: JSON.stringify({ ...body, action: "edit", entry_id: props.entryId }) })
    }
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    if (err instanceof ApiError) {
      error.value = extractErrorMessage(err, `Gagal ${props.mode === "add" ? "menambah" : "memperbarui"} data.`)
    } else {
      error.value = `Gagal ${props.mode === "add" ? "menambah" : "memperbarui"} data.`
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-lg">
      <DialogHeader>
        <DialogTitle>{{ mode === "add" ? "Tambah Data IT-Infra" : "Edit Data IT-Infra" }}</DialogTitle>
        <DialogDescription>Field "Data" bebas -- isi apa pun sesuai kebutuhan (mis. username, password, IP, dll).</DialogDescription>
      </DialogHeader>

      <div v-if="fetchingDetail" class="flex items-center justify-center py-8"><Loader2 class="h-5 w-5 animate-spin text-muted-foreground" /></div>
      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label>Kategori</Label>
          <Select v-model="categoryId">
            <SelectTrigger><SelectValue placeholder="Pilih kategori" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="c in categories" :key="c.id" :value="String(c.id)">{{ c.name }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div class="space-y-1.5">
          <Label for="itinfra-name">Nama</Label>
          <Input id="itinfra-name" v-model="name" required placeholder="Internet Kantor Pusat - Biznet" />
        </div>

        <KeyValueEditor v-model="rows" />

        <label class="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm">
          <Checkbox v-model:checked="isStaffOnly" class="mt-0.5" />
          <span>
            <span class="font-medium">Staff Only</span>
            <span class="block text-xs text-muted-foreground">Kalau dicentang, entry ini HANYA bisa dilihat staff/admin -- tersembunyi dari user portal non-staff meski mereka punya izin akses fitur ini.</span>
          </span>
        </label>

        <div class="space-y-1.5">
          <Label for="itinfra-notes">Catatan (opsional)</Label>
          <Textarea id="itinfra-notes" v-model="notes" :rows="2" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading || !categoryId">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><Plus v-else class="h-3.5 w-3.5" /> {{ mode === "add" ? "Tambah" : "Simpan" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
