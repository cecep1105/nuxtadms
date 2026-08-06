<script setup lang="ts">
import { Loader2, Pencil, Plus } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"
import type { Department } from "#shared/types/api"

const props = defineProps<{ mode: "create" | "edit"; department?: Department }>()
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const emptyForm = () => ({ DeptID: "", DeptName: "", NetID: "0", DeptRouter: "", DeptSubnet: "" })
const form = ref(emptyForm())

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.department) {
    const d = props.department
    form.value = { DeptID: String(d.DeptID), DeptName: d.DeptName, NetID: String(d.NetID), DeptRouter: d.DeptRouter, DeptSubnet: d.DeptSubnet }
  } else {
    form.value = emptyForm()
  }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  const payload = { ...form.value, DeptID: Number(form.value.DeptID), NetID: Number(form.value.NetID) }
  try {
    if (props.mode === "create") {
      await request("/iclock/department/", { method: "POST", body: JSON.stringify(payload) })
    } else {
      await request(`/iclock/department/${props.department!.DeptID}/`, { method: "PATCH", body: JSON.stringify(payload) })
    }
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as Record<string, string[]> | null
      error.value = body ? Object.values(body).flat().join(" ") : "Gagal menyimpan pool."
    } else {
      error.value = "Gagal menyimpan pool."
    }
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button v-if="mode === 'create'" size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah Pool</Button>
    <Button v-else variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>

    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === "create" ? "Tambah Pool" : `Edit Pool — ${department?.DeptName}` }}</DialogTitle>
        <DialogDescription>Pool/department dipakai sbg pengelompokan device & employee.</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="deptid">Pool ID</Label>
            <Input id="deptid" v-model="form.DeptID" type="number" :disabled="mode === 'edit'" required />
          </div>
          <div class="space-y-1.5">
            <Label for="deptname">Nama Pool</Label>
            <Input id="deptname" v-model="form.DeptName" required />
          </div>
        </div>
        <div class="space-y-1.5">
          <Label for="netid">Net ID</Label>
          <Input id="netid" v-model="form.NetID" type="number" />
        </div>
        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="router">Router</Label>
            <Input id="router" v-model="form.DeptRouter" class="font-mono" />
          </div>
          <div class="space-y-1.5">
            <Label for="subnet">Subnet</Label>
            <Input id="subnet" v-model="form.DeptSubnet" class="font-mono" />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
