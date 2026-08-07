<script setup lang="ts">
import { Loader2, MapPin } from "@lucide/vue"
import { ApiError } from "@/composables/useApiClient"

/**
 * Editor visual polygon geofence -- klik di peta utk tambah titik
 * (urutan klik = urutan keliling polygon). Pakai Google Maps
 * JavaScript API LANGSUNG (window.google.maps.*, BUKAN library
 * wrapper Vue) -- API-nya framework-agnostic, jadi portingan dari
 * versi Next.js (yg JUGA pakai window.google.maps.* langsung, cuma
 * beda cara muat skripnya: next/script vs manual <script> tag di
 * sini) hampir 1:1.
 */
const JAKARTA_CENTER = { lat: -6.2, lng: 106.8166 }

const props = defineProps<{
  poolId: string
  existingPoints: { Latitude: string; Longitude: string }[]
  knownPoolIds: string[]
}>()

const config = useRuntimeConfig()
const googleMapsApiKey = config.public.googleMapsApiKey
const { request } = useApiClient()

const mapEl = ref<HTMLDivElement>()
let mapObj: google.maps.Map | null = null
let polygonObj: google.maps.Polygon | null = null
let markers: google.maps.Marker[] = []

const mapReady = ref(false)
const poolId = ref(props.poolId)
const points = ref<{ lat: number; lng: number }[]>([])
const saving = ref(false)
const status = ref<{ type: "success" | "error"; message: string } | null>(null)

function updatePolygon() {
  if (!polygonObj) return
  const path = markers.map((m) => m.getPosition()!)
  polygonObj.setPath(path)
  points.value = markers.map((m) => ({ lat: m.getPosition()!.lat(), lng: m.getPosition()!.lng() }))
}

function addPoint(lat: number, lng: number) {
  if (!mapObj) return
  const marker = new window.google.maps.Marker({
    position: { lat, lng }, map: mapObj, label: String(markers.length + 1), draggable: true,
  })
  marker.addListener("dragend", updatePolygon)
  markers.push(marker)
  updatePolygon()
}

function initMap() {
  if (!mapEl.value) return
  const initialCenter = props.existingPoints.length > 0
    ? { lat: parseFloat(props.existingPoints[0]!.Latitude), lng: parseFloat(props.existingPoints[0]!.Longitude) }
    : JAKARTA_CENTER

  const map = new window.google.maps.Map(mapEl.value, { center: initialCenter, zoom: 18, mapTypeId: "satellite" })
  mapObj = map

  const polygon = new window.google.maps.Polygon({
    paths: [], strokeColor: "#2DD4BF", strokeOpacity: 0.9, strokeWeight: 2, fillColor: "#2DD4BF", fillOpacity: 0.2,
  })
  polygon.setMap(map)
  polygonObj = polygon

  map.addListener("click", (e: google.maps.MapMouseEvent) => {
    if (e.latLng) addPoint(e.latLng.lat(), e.latLng.lng())
  })

  props.existingPoints.forEach((p) => addPoint(parseFloat(p.Latitude), parseFloat(p.Longitude)))
  mapReady.value = true
}

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.google?.maps) { resolve(); return }
    const script = document.createElement("script")
    script.src = `https://maps.googleapis.com/maps/api/js?key=${googleMapsApiKey}`
    script.async = true
    script.onload = () => resolve()
    script.onerror = () => reject(new Error("Gagal memuat skrip Google Maps."))
    document.head.appendChild(script)
  })
}

onMounted(() => {
  if (!googleMapsApiKey) return
  loadGoogleMapsScript().then(initMap).catch((err) => {
    status.value = { type: "error", message: err.message }
  })
})

function handleUndo() {
  const last = markers.pop()
  last?.setMap(null)
  markers.forEach((m, i) => m.setLabel(String(i + 1)))
  updatePolygon()
}

function handleClear() {
  markers.forEach((m) => m.setMap(null))
  markers = []
  updatePolygon()
}

async function handleSave() {
  status.value = null
  if (!poolId.value.trim()) {
    status.value = { type: "error", message: "PoolID wajib diisi." }
    return
  }
  if (points.value.length < 3) {
    status.value = { type: "error", message: `Minimal 3 titik untuk jadi polygon valid (sekarang ${points.value.length}).` }
    return
  }
  saving.value = true
  try {
    const result = await request<{ detail: string }>(
      `/mclock/mobile-pool-loc/bulk-save/${encodeURIComponent(poolId.value.trim())}/`,
      { method: "POST", body: JSON.stringify({ points: points.value }) }
    )
    status.value = { type: "success", message: result.detail }
    setTimeout(() => { navigateTo("/mclock/mobile-pool-locations") }, 1200)
  } catch (err) {
    if (err instanceof ApiError) {
      const body = err.body as { detail?: string } | null
      status.value = { type: "error", message: body?.detail ?? "Gagal menyimpan polygon." }
    } else {
      status.value = { type: "error", message: "Gagal menghubungi server." }
    }
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Card v-if="!googleMapsApiKey" class="border-warning/30 bg-warning/5 p-4 text-sm text-warning">
    ⚠️ <code>NUXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> belum diisi di <code>.env</code> — peta tidak bisa dimuat.
    Buat API key dari Google Cloud Console (aktifkan "Maps JavaScript API"), lalu restart server.
  </Card>

  <template v-else>
    <div class="mb-3 rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
      🧪 Data ini murni untuk <strong>testing</strong> geofence — akan hilang/tertimpa begitu
      <code class="mx-1">sync_mobile_pool_loc</code> dijalankan lagi. Klik di peta untuk tambah titik
      (urutan klik = urutan keliling polygon), minimal 3 titik. Menyimpan akan
      <strong>mengganti seluruh titik lama</strong> milik PoolID ini.
    </div>

    <div class="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <div class="lg:col-span-2">
        <div ref="mapEl" class="h-[520px] w-full rounded-xl border border-border bg-muted" />
        <p v-if="!mapReady" class="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 class="h-3 w-3 animate-spin" /> Memuat peta...
        </p>
      </div>

      <Card class="h-fit space-y-4 p-4">
        <div class="space-y-1.5">
          <Label for="poolid">PoolID</Label>
          <Input id="poolid" v-model="poolId" list="poolid-list" placeholder="mis. TEST1 — sama dengan PoolID di Mobile Pool" class="font-mono" />
          <datalist id="poolid-list">
            <option v-for="id in knownPoolIds" :key="id" :value="id" />
          </datalist>
        </div>

        <div>
          <p class="mb-1 flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
            <MapPin class="h-3.5 w-3.5" /> Titik Polygon ({{ points.length }})
          </p>
          <ol class="max-h-40 space-y-0.5 overflow-y-auto font-mono text-[11px] text-muted-foreground">
            <li v-for="(p, i) in points" :key="i">#{{ i + 1 }}: {{ p.lat.toFixed(6) }}, {{ p.lng.toFixed(6) }}</li>
          </ol>
        </div>

        <div class="flex gap-2">
          <Button variant="outline" size="sm" class="flex-1" :disabled="!mapReady" @click="handleUndo">Hapus Terakhir</Button>
          <Button variant="outline" size="sm" class="flex-1" :disabled="!mapReady" @click="handleClear">Hapus Semua</Button>
        </div>

        <div v-if="status" :class="['rounded-md px-3 py-2 text-xs', status.type === 'success' ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive']">
          {{ status.message }}
        </div>

        <Button class="w-full" :disabled="saving || !mapReady" @click="handleSave">
          <Loader2 v-if="saving" class="h-3.5 w-3.5 animate-spin" /> Simpan Polygon
        </Button>
      </Card>
    </div>
  </template>
</template>
