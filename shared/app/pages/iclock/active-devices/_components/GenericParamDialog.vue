<script setup lang="ts">
import { Loader2, Settings2 } from "@lucide/vue"

const props = defineProps<{ sn: string; alias: string }>()
const open = defineModel<boolean>("open", { required: true })

const { request } = useApiClient()
const mode = ref<"get" | "set">("get")
const loading = ref(false)
const error = ref<string | null>(null)
const getResult = ref<string | null>(null)
const setResult = ref<string | null>(null)

const getParamName = ref("")
const setParamName = ref("")
const setParamValue = ref("")
const doRefresh = ref(true)

watch(open, (isOpen) => {
  if (!isOpen) {
    error.value = null; getResult.value = null; setResult.value = null
    getParamName.value = ""; setParamName.value = ""; setParamValue.value = ""
  }
})

async function handleGet() {
  loading.value = true
  error.value = null
  getResult.value = null
  try {
    const result = await request<{ success: boolean; value?: string; message?: string }>(`/iclock/active-device/${props.sn}/generic-param/`, {
      method: "POST", body: JSON.stringify({ action: "get", param_name: getParamName.value }),
    })
    if (result.success) getResult.value = result.value ?? ""
    else error.value = result.message ?? "Gagal membaca parameter."
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal membaca parameter.")
  } finally {
    loading.value = false
  }
}

async function handleSet() {
  loading.value = true
  error.value = null
  setResult.value = null
  try {
    const result = await request<{ success: boolean; message: string }>(`/iclock/active-device/${props.sn}/generic-param/`, {
      method: "POST",
      body: JSON.stringify({ action: "set", param_name: setParamName.value, param_value: setParamValue.value, do_refresh: doRefresh.value }),
    })
    if (result.success) setResult.value = result.message
    else error.value = result.message
  } catch (err) {
    error.value = extractErrorMessage(err, "Gagal mengubah parameter.")
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Generic Param — {{ alias }}</DialogTitle>
        <DialogDescription>
          Baca/ubah parameter konfigurasi apapun di device (lihat dokumentasi PUSH SDK utk daftar nama item, mis. <code>VOLUME</code>, <code>WorkCode</code>, <code>DHCP</code>).
        </DialogDescription>
      </DialogHeader>

      <div v-if="error" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ error }}</div>

      <Tabs v-model="mode">
        <TabsList class="grid w-full grid-cols-2">
          <TabsTrigger value="get">Baca (Get)</TabsTrigger>
          <TabsTrigger value="set">Ubah (Set)</TabsTrigger>
        </TabsList>

        <TabsContent value="get">
          <form class="space-y-4" @submit.prevent="handleGet">
            <div class="space-y-1.5">
              <Label for="get_param">Nama Parameter</Label>
              <Input id="get_param" v-model="getParamName" placeholder="mis. VOLUME" class="font-mono" required />
            </div>
            <div v-if="getResult !== null" class="rounded-md border border-success/30 bg-success/10 px-3 py-2 font-mono text-xs text-success">
              {{ getParamName }} = {{ getResult || "(kosong)" }}
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" @click="open = false">Tutup</Button>
              <Button type="submit" :disabled="loading"><Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /> Baca</Button>
            </DialogFooter>
          </form>
        </TabsContent>

        <TabsContent value="set">
          <form class="space-y-4" @submit.prevent="handleSet">
            <div class="space-y-1.5">
              <Label for="set_param">Nama Parameter</Label>
              <Input id="set_param" v-model="setParamName" placeholder="mis. VOLUME" class="font-mono" required />
            </div>
            <div class="space-y-1.5">
              <Label for="set_value">Nilai Baru</Label>
              <Input id="set_value" v-model="setParamValue" class="font-mono" />
            </div>
            <label class="flex items-center gap-2 text-xs">
              <Checkbox v-model:checked="doRefresh" /> Refresh konfigurasi device setelah diubah
            </label>
            <div v-if="setResult" class="rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs text-success">{{ setResult }}</div>
            <DialogFooter>
              <Button type="button" variant="outline" @click="open = false">Tutup</Button>
              <Button type="submit" :disabled="loading">
                <Loader2 v-if="loading" class="h-3.5 w-3.5 animate-spin" /><Settings2 v-else class="h-3.5 w-3.5" /> Terapkan
              </Button>
            </DialogFooter>
          </form>
        </TabsContent>
      </Tabs>
    </DialogContent>
  </Dialog>
</template>
