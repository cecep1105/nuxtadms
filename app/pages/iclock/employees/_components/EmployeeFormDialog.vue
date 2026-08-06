<script setup lang="ts">
import { Loader2, Pencil, Plus } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { Employee, Department } from "#shared/types/api"

const GENDER_OPTIONS = [{ value: "M", label: "Laki-laki" }, { value: "F", label: "Perempuan" }]
const PRIVILEGE_OPTIONS = [
  { value: "0", label: "Normal" }, { value: "2", label: "Registrar" },
  { value: "6", label: "Administrator" }, { value: "14", label: "Supervisor" },
]

const props = defineProps<{ mode: "create" | "edit"; employee?: Employee; departments: Department[] }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const emptyForm = () => ({ PIN: "", EName: "", DeptID: "", Gender: "", Title: "", Card: "", Privilege: "0", Tele: "", Mobile: "", Password: "" })
const form = ref(emptyForm())

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.employee) {
    const e = props.employee
    form.value = {
      PIN: e.PIN, EName: e.EName ?? "", DeptID: e.DeptID ? String(e.DeptID) : "",
      Gender: e.Gender ?? "", Title: e.Title ?? "", Card: e.Card ?? "",
      Privilege: e.Privilege !== null ? String(e.Privilege) : "0",
      Tele: e.Tele ?? "", Mobile: e.Mobile ?? "", Password: "",
    }
  } else {
    form.value = emptyForm()
  }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  const payload: Record<string, unknown> = {
    ...form.value,
    DeptID: form.value.DeptID ? Number(form.value.DeptID) : null,
    Privilege: form.value.Privilege ? Number(form.value.Privilege) : null,
  }
  if (!payload.Password) delete payload.Password // jangan timpa password kalau dikosongkan saat edit
  try {
    if (props.mode === "create") {
      await request("/iclock/device-user/", { method: "POST", body: JSON.stringify(payload) })
    } else {
      await request(`/iclock/device-user/${props.employee!.id}/`, { method: "PATCH", body: JSON.stringify(payload) })
    }
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as Record<string, string[]> | null
      error.value = body ? Object.values(body).flat().join(" ") : "Gagal menyimpan employee."
    } else {
      error.value = "Gagal menyimpan employee."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button v-if="mode === 'create'" size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Employee</Button>
    <Button v-else variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>

    <DialogContent class="max-h-[85vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ mode === "create" ? "Tambah Employee" : `Edit Employee — ${employee?.PIN}` }}</DialogTitle>
        <DialogDescription>Data karyawan/pengguna yang terdaftar di mesin fingerprint.</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="pin">PIN</Label>
            <Input id="pin" v-model="form.PIN" :disabled="mode === 'edit'" required class="font-mono" />
          </div>
          <div class="space-y-1.5">
            <Label for="ename">Nama</Label>
            <Input id="ename" v-model="form.EName" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label>Pool</Label>
            <Select v-model="form.DeptID">
              <SelectTrigger><SelectValue placeholder="Pilih pool" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="d in departments" :key="d.DeptID" :value="String(d.DeptID)">{{ d.DeptName }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label>Privilege</Label>
            <Select v-model="form.Privilege">
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="o in PRIVILEGE_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label>Gender</Label>
            <Select v-model="form.Gender">
              <SelectTrigger><SelectValue placeholder="Pilih gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem v-for="o in GENDER_OPTIONS" :key="o.value" :value="o.value">{{ o.label }}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-1.5">
            <Label for="title">Title</Label>
            <Input id="title" v-model="form.Title" />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="tele">Telepon Kantor</Label>
            <Input id="tele" v-model="form.Tele" />
          </div>
          <div class="space-y-1.5">
            <Label for="mobile">Mobile</Label>
            <Input id="mobile" v-model="form.Mobile" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="card">Card ID</Label>
          <Input id="card" v-model="form.Card" class="font-mono" />
        </div>

        <div class="space-y-1.5">
          <Label for="password">
            Password Mesin
            <span v-if="mode === 'edit'" class="text-muted-foreground">(kosongkan jika tidak diubah)</span>
          </Label>
          <Input id="password" v-model="form.Password" />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
