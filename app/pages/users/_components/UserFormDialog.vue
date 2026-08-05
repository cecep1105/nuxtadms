<script setup lang="ts">
import { Loader2, Pencil, Plus } from "@lucide/vue"
import type { DjangoApiUser } from "#shared/types/api"

const props = defineProps<{ mode: "create" | "edit"; user?: DjangoApiUser; isSuperuser?: boolean }>()

const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const emptyForm = () => ({
  username: "", email: "", first_name: "", last_name: "",
  phone_number: "", department: "", title: "", password: "", is_staff: false, emp_id: "",
})
const form = ref(emptyForm())

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.user) {
    form.value = {
      username: props.user.username, email: props.user.email, first_name: props.user.first_name, last_name: props.user.last_name,
      phone_number: props.user.phone_number ?? "", department: props.user.department ?? "", title: props.user.title ?? "",
      password: "", is_staff: props.user.is_staff, emp_id: props.user.emp_pin ?? "",
    }
  } else {
    form.value = emptyForm()
  }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    if (props.mode === "create") {
      await request("/users/", {
        method: "POST",
        body: JSON.stringify({
          username: form.value.username, email: form.value.email, first_name: form.value.first_name,
          last_name: form.value.last_name, password: form.value.password, is_staff: form.value.is_staff, emp_id: form.value.emp_id,
        }),
      })
    } else {
      await request(`/users/${props.user!.id}/`, {
        method: "PATCH",
        body: JSON.stringify({
          email: form.value.email, first_name: form.value.first_name, last_name: form.value.last_name,
          phone_number: form.value.phone_number, department: form.value.department, title: form.value.title, emp_id: form.value.emp_id,
        }),
      })
    }
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menyimpan user.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button v-if="mode === 'create'" size="sm" @click="open = true"><Plus class="h-3.5 w-3.5" /> Tambah User</Button>
    <Button v-else variant="ghost" size="icon" aria-label="Edit" @click="open = true"><Pencil class="h-3.5 w-3.5" /></Button>

    <DialogContent class="max-h-[85vh] max-w-lg overflow-y-auto">
      <DialogHeader>
        <DialogTitle>{{ mode === "create" ? "Tambah User Lokal" : `Edit User — ${user?.username}` }}</DialogTitle>
        <DialogDescription>
          {{ mode === "create" ? "User baru dibuat sebagai akun lokal (bukan LDAP)." : "Username & password tidak bisa diubah di sini -- gunakan aksi Reset Password terpisah." }}
        </DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div v-if="mode === 'create'" class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="username">Username</Label>
            <Input id="username" v-model="form.username" required />
          </div>
          <div class="space-y-1.5">
            <Label for="password">Password</Label>
            <Input id="password" v-model="form.password" type="password" required />
          </div>
        </div>

        <div class="grid grid-cols-2 gap-3">
          <div class="space-y-1.5">
            <Label for="first_name">Nama Depan</Label>
            <Input id="first_name" v-model="form.first_name" />
          </div>
          <div class="space-y-1.5">
            <Label for="last_name">Nama Belakang</Label>
            <Input id="last_name" v-model="form.last_name" />
          </div>
        </div>

        <div class="space-y-1.5">
          <Label for="email">Email</Label>
          <Input id="email" v-model="form.email" type="email" />
        </div>

        <div class="space-y-1.5">
          <Label>Kaitkan ke PIN Employee (opsional)</Label>
          <EmpPinAutocomplete v-model="form.emp_id" />
          <p class="text-[11px] text-muted-foreground">
            Menautkan akun ini ke data karyawan (PIN absensi) -- dipakai fitur "My Attendance" di portal. Kosongkan untuk melepas tautan.
          </p>
        </div>

        <template v-if="mode === 'edit'">
          <div class="grid grid-cols-2 gap-3">
            <div class="space-y-1.5">
              <Label for="phone">Telepon</Label>
              <Input id="phone" v-model="form.phone_number" />
            </div>
            <div class="space-y-1.5">
              <Label for="department">Departemen</Label>
              <Input id="department" v-model="form.department" />
            </div>
          </div>
          <div class="space-y-1.5">
            <Label for="title">Jabatan</Label>
            <Input id="title" v-model="form.title" />
          </div>
        </template>

        <label v-if="mode === 'create' && isSuperuser" class="flex items-center gap-2 text-xs">
          <Switch v-model:checked="form.is_staff" />
          Jadikan Staff (akses dashboard admin)
        </label>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Simpan</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
