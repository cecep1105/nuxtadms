<script setup lang="ts">
import { Loader2, UserPlus } from "@lucide/vue"

/**
 * Tambah user Zentyal (mail server) -- uidNumber dihitung OTOMATIS
 * server-side (MAX+1 dari user yang ada), gidNumber pakai default yang
 * dikonfigurasi admin -- tidak perlu diisi di form ini.
 */
const { request } = useApiClient()
const open = ref(false)
const loading = ref(false)
const error = ref<string | null>(null)

const mail = ref("")
const maildrop = ref("")

const props = defineProps<{
  aliasName: string,
  currentAliasList: string[];
}>()



function reset() {
  mail.value = ""; 
  error.value = null
}
watch(open, (isOpen) => { if (!isOpen) reset() })

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    await request(`/netmgmt/zentyal/postfix-alias/${props.aliasName}/`, { method: "POST", body: JSON.stringify({mail: mail.value, maildrop: maildrop.value }) })
    open.value = false
    reset()
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal menambah email bcc.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Button size="sm" @click="open = true"><UserPlus class="h-3.5 w-3.5" /> Tambah Alias</Button>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Alias: <span class="px-3 border">{{ aliasName }}</span></DialogTitle>
        <DialogDescription>uid dibuat otomatis.</DialogDescription>
      </DialogHeader>
      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label for="zt-mail">Email Alias</Label>
          <!-- <Input id="zt-username" v-model="username" required class="font-mono" placeholder="budi" /> -->
         <EmailAutoComplete v-model="mail" source="zentyal" :exclude-filter="currentAliasList" />
        </div>

        <div class="space-y-1.5">
          <Label for="zt-mail-drop">Email Asli</Label>
         <EmailAutoComplete v-model="maildrop" source="zentyal" :exclude-filter="currentAliasList"/>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Tambah Bcc</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
