<script setup lang="ts">
import { Loader2, Search, User, Users, CheckCircle2, Wand2 } from "@lucide/vue"
import type { IDCardType, IDCardTemplate, IDCardHolder, IDCardPhotoCandidate, IDCardDetail } from "#shared/types/api"

const CARD_TYPES: { value: IDCardType; label: string }[] = [
  { value: "karyawan", label: "Karyawan" },
  { value: "driver", label: "Driver" },
  { value: "visitor", label: "Visitor" },
  { value: "bhl", label: "BHL (Buruh Harian Lepas)" },
]

/**
 * Alur generate 1 ID Card baru -- SATU halaman, langkahnya beda
 * tergantung cardType (karyawan/driver PAKAI PIN & bisa cari foto FTP,
 * visitor/bhl PILIH holder yang SUDAH diinput di halaman Data
 * Visitor/BHL & foto SELALU shoot/upload manual, TIDAK ada sumber FTP
 * utk mereka).
 */
const { request } = useApiClient()

const cardType = ref<IDCardType>("karyawan")
const templates = ref<IDCardTemplate[]>([])
const templateId = ref("")

// --- Karyawan/Driver ---
const pin = ref("")
const searchingEmployee = ref(false)
const employeeFound = ref<{ pin: string; name: string } | null>(null)
const employeeError = ref<string | null>(null)
const ftpCandidates = ref<IDCardPhotoCandidate[]>([])
const searchingPhotos = ref(false)

// --- Visitor/BHL ---
const holders = ref<IDCardHolder[]>([])
const holderId = ref("")

// --- Foto & extra ---
const photoDataUri = ref<string | null>(null)
const photoSource = ref<"ftp" | "shoot" | "upload">("shoot")
const retouchOpen = ref(false)

function handleRetouched(dataUri: string) {
  photoDataUri.value = dataUri
}
const extraText = ref("")

const generating = ref(false)
const generateError = ref<string | null>(null)
const result = ref<IDCardDetail | null>(null)

const isEmployeeLinked = computed(() => cardType.value === "karyawan" || cardType.value === "driver")

watch(cardType, () => {
  request<IDCardTemplate[]>(`/idcard/templates/?card_type=${cardType.value}`)
    .then((data) => { templates.value = data.filter((t) => t.is_active) })
    .catch(() => { templates.value = [] })
  templateId.value = ""
  employeeFound.value = null
  ftpCandidates.value = []
  photoDataUri.value = null
  holderId.value = ""
  result.value = null

  if (!isEmployeeLinked.value) {
    request<{ results: IDCardHolder[] }>(`/idcard/holders/?card_type=${cardType.value}&_limit=100`)
      .then((data) => { holders.value = data.results })
      .catch(() => { holders.value = [] })
  }
}, { immediate: true })

async function handleSearchEmployee() {
  searchingEmployee.value = true
  employeeError.value = null
  employeeFound.value = null
  ftpCandidates.value = []
  try {
    const data = await request<{ employees: { pin: string; name: string }[] }>(`/iclock/employee-search/?q=${encodeURIComponent(pin.value)}`)
    const exact = data.employees.find((e) => e.pin === pin.value.trim()) ?? data.employees[0]
    if (!exact) {
      employeeError.value = `Employee dengan PIN '${pin.value}' tidak ditemukan.`
      return
    }
    employeeFound.value = exact
  } catch (err) {
    employeeError.value = extractErrorMessage(err, "Gagal mencari employee.")
  } finally {
    searchingEmployee.value = false
  }
}

async function handleSearchFtpPhotos() {
  if (!employeeFound.value) return
  searchingPhotos.value = true
  ftpCandidates.value = []
  try {
    const data = await request<{ results: IDCardPhotoCandidate[] }>(`/idcard/photo-search/?pin=${encodeURIComponent(employeeFound.value.pin)}&card_type=${cardType.value}`)
    ftpCandidates.value = data.results
  } catch (err) {
    employeeError.value = extractErrorMessage(err, "Gagal mencari foto dari FTP.")
  } finally {
    searchingPhotos.value = false
  }
}

function handleSelectFtpPhoto(candidate: IDCardPhotoCandidate) {
  photoDataUri.value = candidate.data
  photoSource.value = "ftp"
}

function handleWebcamCapture(dataUri: string) {
  photoDataUri.value = dataUri
  photoSource.value = "shoot"
}

function handleFileUpload(e: Event) {
  const file = (e.target as HTMLInputElement).files?.[0]
  if (!file) return
  const reader = new FileReader()
  reader.onload = () => {
    photoDataUri.value = reader.result as string
    photoSource.value = "upload"
  }
  reader.readAsDataURL(file)
}

const selectedHolder = computed(() => holders.value.find((h) => String(h.id) === holderId.value))
const canGenerate = computed(() => Boolean(templateId.value && photoDataUri.value && (isEmployeeLinked.value ? employeeFound.value : holderId.value)))

async function handleGenerate() {
  generating.value = true
  generateError.value = null
  try {
    const body: Record<string, unknown> = { card_type: cardType.value, template_id: Number(templateId.value), photo_source: photoSource.value, photo_data: photoDataUri.value, extra_text: extraText.value }
    if (isEmployeeLinked.value) body.pin = employeeFound.value!.pin
    else body.holder_id = Number(holderId.value)

    result.value = await request<IDCardDetail>("/idcard/cards/generate/", { method: "POST", body: JSON.stringify(body) })
  } catch (err) {
    generateError.value = extractErrorMessage(err, "Gagal generate kartu.")
  } finally {
    generating.value = false
  }
}
</script>

<template>
  <div v-if="result">
    <PageHeader title="Generate Kartu" description="Kartu berhasil dibuat." />
    <Card class="flex flex-col items-center gap-4 p-8 text-center">
      <CheckCircle2 class="h-12 w-12 text-success" />
      <div>
        <p class="font-medium">Kartu untuk {{ result.holder_name }} berhasil dibuat.</p>
        <p class="text-sm text-muted-foreground">Status: {{ result.status_label }}</p>
      </div>
      <img :src="resolveMediaUrl(result.card_image)" alt="Hasil kartu" class="w-48 rounded-md border border-border shadow-sm" />
      <div class="flex gap-2">
        <Button variant="outline" as-child><NuxtLink :to="`/idcard/cards/${result.id}`">Lihat Detail</NuxtLink></Button>
        <Button @click="result = null">Generate Kartu Lain</Button>
      </div>
    </Card>
  </div>

  <div v-else>
    <PageHeader title="Generate Kartu" description="Buat ID Card baru -- pilih jenis kartu, data pemegang, foto, dan template." />

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-2">
      <Card class="space-y-4 p-4">
        <div class="space-y-1.5">
          <Label>Jenis Kartu</Label>
          <Select v-model="cardType">
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in CARD_TYPES" :key="t.value" :value="t.value">{{ t.label }}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div v-if="isEmployeeLinked" class="space-y-1.5">
          <Label for="gen-pin">PIN Employee</Label>
          <div class="flex gap-2">
            <Input id="gen-pin" v-model="pin" placeholder="Masukkan PIN" />
            <Button type="button" variant="outline" :disabled="!pin.trim() || searchingEmployee" @click="handleSearchEmployee">
              <Loader2 v-if="searchingEmployee" class="h-3.5 w-3.5 animate-spin" /><Search v-else class="h-3.5 w-3.5" />
            </Button>
          </div>
          <p v-if="employeeError" class="text-xs text-destructive">{{ employeeError }}</p>
          <div v-if="employeeFound" class="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs">
            <User class="h-3.5 w-3.5 text-success" />
            <span class="font-medium">{{ employeeFound.name }}</span>
            <span class="font-mono text-muted-foreground">({{ employeeFound.pin }})</span>
          </div>
        </div>
        <div v-else class="space-y-1.5">
          <Label>Pilih Data {{ cardType === "visitor" ? "Visitor" : "BHL" }}</Label>
          <Select v-model="holderId">
            <SelectTrigger><SelectValue placeholder="Pilih dari data yang sudah diinput" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="h in holders" :key="h.id" :value="String(h.id)">{{ h.full_name }} <template v-if="h.id_number">({{ h.id_number }})</template></SelectItem>
            </SelectContent>
          </Select>
          <p v-if="holders.length === 0" class="text-xs text-muted-foreground">
            Belum ada data. Tambahkan dulu lewat halaman <NuxtLink to="/idcard/holders" class="text-primary hover:underline">Data Visitor/BHL</NuxtLink>.
          </p>
          <div v-if="selectedHolder" class="flex items-center gap-2 rounded-md border border-success/30 bg-success/10 px-3 py-2 text-xs">
            <Users class="h-3.5 w-3.5 text-success" />
            <span class="font-medium">{{ selectedHolder.full_name }}</span>
          </div>
        </div>

        <div class="space-y-1.5">
          <Label>Template</Label>
          <Select v-model="templateId">
            <SelectTrigger><SelectValue placeholder="Pilih template" /></SelectTrigger>
            <SelectContent>
              <SelectItem v-for="t in templates" :key="t.id" :value="String(t.id)">{{ t.name }}</SelectItem>
            </SelectContent>
          </Select>
          <p v-if="templates.length === 0" class="text-xs text-muted-foreground">Belum ada template aktif untuk jenis kartu ini.</p>
        </div>

        <div class="space-y-1.5">
          <Label for="gen-extra">Info Tambahan (opsional)</Label>
          <Input id="gen-extra" v-model="extraText" placeholder="mis. Jabatan / Perusahaan" />
        </div>
      </Card>

      <Card class="space-y-4 p-4">
        <Label>Foto</Label>

        <div v-if="isEmployeeLinked && employeeFound" class="space-y-2">
          <Button type="button" variant="outline" size="sm" :disabled="searchingPhotos" @click="handleSearchFtpPhotos">
            <Loader2 v-if="searchingPhotos" class="h-3.5 w-3.5 animate-spin" /><Search v-else class="h-3.5 w-3.5" /> Cari Foto dari FTP
          </Button>
          <div v-if="ftpCandidates.length > 0" class="grid grid-cols-4 gap-2">
            <button
              v-for="(c, i) in ftpCandidates" :key="i" type="button"
              :class="['overflow-hidden rounded-md border-2', photoDataUri === c.data ? 'border-primary' : 'border-transparent']"
              @click="handleSelectFtpPhoto(c)"
            >
              <img :src="c.data" :alt="c.label ?? c.path" class="aspect-square w-full object-cover" />
            </button>
          </div>
          <p v-else-if="!searchingPhotos" class="text-xs text-muted-foreground">Klik tombol di atas untuk cari foto, atau pakai kamera di bawah.</p>
        </div>

        <div class="space-y-2 border-t border-border pt-3">
          <p class="text-xs font-medium text-muted-foreground">Atau shoot langsung / upload:</p>
          <WebcamCapture @capture="handleWebcamCapture" />
          <div class="space-y-1.5">
            <Label for="gen-upload" class="text-xs">Upload File</Label>
            <Input id="gen-upload" type="file" accept="image/*" @change="handleFileUpload" />
          </div>
        </div>

        <div v-if="photoDataUri" class="border-t border-border pt-3">
          <p class="mb-1 text-xs font-medium text-muted-foreground">Foto terpilih:</p>
          <div class="flex items-center gap-3">
            <img :src="photoDataUri" alt="Foto terpilih" class="w-24 rounded-md border border-border" />
            <Button type="button" variant="outline" size="sm" @click="retouchOpen = true">
              <Wand2 class="h-3.5 w-3.5" /> Retouch
            </Button>
          </div>
          <p class="mt-1 text-[11px] text-muted-foreground">Posisi kurang pas? Geser/zoom foto lewat Retouch sebelum generate kartu.</p>
        </div>

        <PhotoRetouchDialog
          v-model:open="retouchOpen" :source-image="photoDataUri ?? ''"
          :pin="isEmployeeLinked ? employeeFound?.pin : undefined"
          @retouched="handleRetouched"
        />
      </Card>
    </div>

    <div v-if="generateError" class="mt-4 rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">{{ generateError }}</div>

    <div class="mt-4 flex justify-end">
      <Button size="lg" :disabled="!canGenerate || generating" @click="handleGenerate">
        <Loader2 v-if="generating" class="h-4 w-4 animate-spin" /> Generate Kartu
      </Button>
    </div>
  </div>
</template>
