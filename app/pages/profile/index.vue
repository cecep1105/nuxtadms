<script setup lang="ts">
import { Loader2, KeyRound } from "@lucide/vue"
import type { DjangoApiUser } from "#shared/types/api"

const { request } = useApiClient()
const { fetch: refreshSession } = useUserSession()

const saving = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

const { data: user, pending } = await useAsyncData("profile-me", () => request<DjangoApiUser>("/me/"))

const form = reactive({ email: "", first_name: "", last_name: "", phone_number: "", department: "", title: "" })

watch(user, (u) => {
  if (!u) return
  form.email = u.email
  form.first_name = u.first_name
  form.last_name = u.last_name
  form.phone_number = u.phone_number ?? ""
  form.department = u.department ?? ""
  form.title = u.title ?? ""
}, { immediate: true })

async function handleSubmit() {
  saving.value = true
  error.value = null
  success.value = false
  try {
    const updated = await request<DjangoApiUser>("/me/", { method: "PATCH", body: JSON.stringify(form) })
    user.value = updated
    success.value = true
    // Sinkronkan sesi Nuxt (Topbar dkk) dgn data BARU -- TANPA ini,
    // nama/avatar di Topbar tetap tampilkan data LAMA sampai login ulang.
    await $fetch("/api/auth/update-session-user", { method: "POST", body: { user: updated } })
    await refreshSession()
    setTimeout(() => { success.value = false }, 2000)
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menyimpan profil.")
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <PageHeader title="Profil Saya">
      <template #action>
        <Button variant="outline" size="sm" as-child>
          <NuxtLink to="/profile/password"><KeyRound class="h-3.5 w-3.5" /> Ganti Password</NuxtLink>
        </Button>
      </template>
    </PageHeader>

    <div v-if="pending" class="flex justify-center py-12"><Loader2 class="h-5 w-5 animate-spin text-muted-foreground" /></div>

    <Card v-else>
      <div class="p-4 pb-0">
        <h2 class="text-sm font-semibold">Informasi Akun</h2>
      </div>
      <div class="p-4">
        <div class="mb-4 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          <span class="font-mono">{{ user?.username }}</span>
          <Badge :variant="user?.auth_source === 'ldap' ? 'default' : 'secondary'">{{ user?.auth_source }}</Badge>
          <Badge v-if="user?.is_staff" variant="default">Staff</Badge>
          <Badge v-if="user?.is_superuser" variant="warning">Superuser</Badge>
        </div>

        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
          <div v-if="success" class="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Profil berhasil disimpan.</div>

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
          <Button type="submit" :disabled="saving"><Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" /> Simpan Perubahan</Button>
        </form>
      </div>
    </Card>
  </div>
</template>
