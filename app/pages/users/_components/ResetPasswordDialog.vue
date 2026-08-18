<script setup lang="ts">
import { Loader2, KeyRound, Copy, Check } from "@lucide/vue"

const props = defineProps<{ userId: number; username: string }>()

const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)
const newPassword = ref("")
const generatedPassword = ref<string | null>(null)
const copied = ref(false)

watch(open, (isOpen) => {
  if (!isOpen) {
    newPassword.value = ""
    generatedPassword.value = null
    error.value = null
    copied.value = false
  }
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const result = await request<{ detail: string; generated_password?: string }>(
      `/users/${props.userId}/reset-password/`,
      { method: "POST", body: JSON.stringify({ new_password: newPassword.value || undefined }) }
    )
    if (result.generated_password) {
      generatedPassword.value = result.generated_password
    } else {
      open.value = false
      await refreshNuxtData()
    }
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mereset password.")
  } finally {
    loading.value = false
  }
}

function copyPassword() {
  if (!generatedPassword.value) return
  navigator.clipboard.writeText(generatedPassword.value)
  copied.value = true
  setTimeout(() => { copied.value = false }, 1500)
}

async function handleDone() {
  open.value = false
  await refreshNuxtData()
}
</script>

<template>
  <Dialog v-model:open="open">
    <Button variant="ghost" size="icon" aria-label="Reset password" @click="open = true" title="Reset password">
      <KeyRound class="h-3.5 w-3.5" />
    </Button>
    <DialogContent class="max-w-sm">
      <DialogHeader>
        <DialogTitle>Reset Password — {{ username }}</DialogTitle>
        <DialogDescription>Isi password baru, atau kosongkan untuk generate otomatis.</DialogDescription>
      </DialogHeader>

      <div v-if="generatedPassword" class="space-y-3">
        <p class="text-xs text-muted-foreground">Password baru berhasil di-generate -- catat sekarang, tidak akan ditampilkan lagi:</p>
        <div class="flex items-center gap-2 rounded-md border border-border bg-muted p-2">
          <code class="flex-1 font-mono text-sm">{{ generatedPassword }}</code>
          <Button type="button" variant="ghost" size="icon" @click="copyPassword">
            <Check v-if="copied" class="h-3.5 w-3.5 text-success" />
            <Copy v-else class="h-3.5 w-3.5" />
          </Button>
        </div>
        <DialogFooter>
          <Button @click="handleDone">Selesai</Button>
        </DialogFooter>
      </div>

      <form v-else class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>
        <div class="space-y-1.5">
          <Label for="newpw">Password Baru (opsional)</Label>
          <Input id="newpw" v-model="newPassword" placeholder="Kosongkan untuk auto-generate" />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Reset</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
