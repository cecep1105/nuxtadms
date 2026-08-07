<script setup lang="ts">
import { Loader2 } from "@lucide/vue"

definePageMeta({ layout: "portal" })

const { request } = useApiClient()
const form = reactive({ old_password: "", new_password: "", confirm_password: "" })
const loading = ref(false)
const error = ref<string | null>(null)
const success = ref(false)

async function handleSubmit() {
  error.value = null
  success.value = false
  if (form.new_password !== form.confirm_password) {
    error.value = "Konfirmasi password baru tidak cocok."
    return
  }
  loading.value = true
  try {
    await request("/me/change-password/", { method: "POST", body: JSON.stringify({ old_password: form.old_password, new_password: form.new_password }) })
    success.value = true
    form.old_password = ""; form.new_password = ""; form.confirm_password = ""
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah password.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="max-w-md">
    <PageHeader title="Ganti Password">
      <template #description>
        <NuxtLink to="/portal/profile" class="text-primary hover:underline">← Kembali ke Profil Saya</NuxtLink>
      </template>
    </PageHeader>
    <Card>
      <div class="p-4 pb-0">
        <h2 class="text-sm font-semibold">Password Baru</h2>
      </div>
      <div class="p-4">
        <form class="space-y-4" @submit.prevent="handleSubmit">
          <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
          <div v-if="success" class="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">Password berhasil diubah.</div>

          <div class="space-y-1.5">
            <Label for="old_password">Password Saat Ini</Label>
            <Input id="old_password" v-model="form.old_password" type="password" required />
          </div>
          <div class="space-y-1.5">
            <Label for="new_password">Password Baru</Label>
            <Input id="new_password" v-model="form.new_password" type="password" required />
          </div>
          <div class="space-y-1.5">
            <Label for="confirm_password">Konfirmasi Password Baru</Label>
            <Input id="confirm_password" v-model="form.confirm_password" type="password" required />
          </div>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Ubah Password</Button>
        </form>
      </div>
    </Card>
  </div>
</template>
