<script setup lang="ts">
import { Loader2, Plus } from "@lucide/vue"
import type { MikrotikNetwatchItem } from "#shared/types/api"

/**
 * Form Tambah/Edit host netwatch -- pakai endpoint RouterOS GENERIK yang
 * sudah ada (BUKAN endpoint baru), body diteruskan APA ADANYA ke
 * RouterOS `.call()`.
 */
const props = defineProps<{ mode: "add" | "edit"; basePath: string; item?: MikrotikNetwatchItem }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const loading = ref(false)
const error = ref<string | null>(null)

const host = ref("")
const upScript = ref("")
const downScript = ref("")
const comment = ref("")

watch(open, (isOpen) => {
  if (!isOpen) return
  if (props.mode === "edit" && props.item) {
    host.value = props.item.host
    upScript.value = props.item["up-script"] ?? ""
    downScript.value = props.item["down-script"] ?? ""
    comment.value = props.item.comment ?? ""
  } else {
    host.value = ""; upScript.value = ""; downScript.value = ""; comment.value = ""
  }
  error.value = null
})

async function handleSubmit() {
  loading.value = true
  error.value = null
  try {
    const body: Record<string, string> = { host: host.value, "up-script": upScript.value, "down-script": downScript.value, comment: comment.value }
    if (props.mode === "edit" && props.item) body.id = props.item.id

    await request(`${props.basePath}/?postcmd=${props.mode === "add" ? "add" : "set"}`, { method: "POST", body: JSON.stringify(body) })
    open.value = false
    await refreshNuxtData()
  } catch (err) {
    error.value = extractErrorMessage(err, `Gagal ${props.mode === "add" ? "menambah" : "memperbarui"} host netwatch.`)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>{{ mode === "add" ? "Tambah Host Netwatch" : "Edit Host Netwatch" }}</DialogTitle>
        <DialogDescription>Up-script/down-script dijalankan RouterOS sendiri saat status host berubah.</DialogDescription>
      </DialogHeader>

      <form class="space-y-4" @submit.prevent="handleSubmit">
        <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

        <div class="space-y-1.5">
          <Label for="host">Host (IP Address)</Label>
          <Input id="host" v-model="host" required class="font-mono" placeholder="192.168.1.1" />
        </div>
        <div class="space-y-1.5">
          <Label for="comment">Comment</Label>
          <Input id="comment" v-model="comment" placeholder="Server ABC" />
        </div>
        <div class="space-y-1.5">
          <Label for="up-script">Up Script</Label>
          <Textarea id="up-script" v-model="upScript" class="font-mono text-xs" :rows="4" placeholder=':log info &quot;host up&quot;' />
        </div>
        <div class="space-y-1.5">
          <Label for="down-script">Down Script</Label>
          <Textarea id="down-script" v-model="downScript" class="font-mono text-xs" :rows="4" placeholder=':log info &quot;host down&quot;' />
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" @click="open = false">Batal</Button>
          <Button type="submit" :disabled="loading">
            <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><Plus v-else class="h-3.5 w-3.5" /> {{ mode === "add" ? "Tambah" : "Simpan" }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
