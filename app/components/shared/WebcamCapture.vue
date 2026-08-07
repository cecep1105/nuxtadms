<script setup lang="ts">
import { Camera, RefreshCw, Video, VideoOff } from "@lucide/vue"

/**
 * Ambil foto LANGSUNG dari webcam (getUserMedia + canvas) -- dipakai di
 * alur Generate Kartu sbg alternatif dari cari foto FTP. Hasil akhir
 * SELALU data URI base64 (SAMA format dgn foto FTP) -- API generate-kartu
 * backend cuma py 1 jalur decode utk KETIGA sumber foto (ftp/shoot/
 * upload), TIDAK perlu tahu bedanya lagi setelah sampai di sana.
 */
const emit = defineEmits<{ (e: "capture", dataUri: string): void }>()

const videoEl = ref<HTMLVideoElement>()
const canvasEl = ref<HTMLCanvasElement>()
let stream: MediaStream | null = null

const cameraActive = ref(false)
const error = ref<string | null>(null)
const capturedPreview = ref<string | null>(null)

function stopCamera() {
  stream?.getTracks().forEach((track) => track.stop())
  stream = null
  cameraActive.value = false
}

// Matikan kamera saat komponen dilepas -- JANGAN biarkan lampu kamera
// tetap menyala di background.
onBeforeUnmount(stopCamera)

async function startCamera() {
  error.value = null
  try {
    stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 960 } } })
    if (videoEl.value) {
      videoEl.value.srcObject = stream
      await videoEl.value.play()
    }
    cameraActive.value = true
    capturedPreview.value = null
  } catch {
    error.value = "Tidak bisa mengakses kamera -- pastikan browser diizinkan akses kamera, dan tidak ada aplikasi lain yang sedang memakainya."
  }
}

function handleCapture() {
  const video = videoEl.value
  const canvas = canvasEl.value
  if (!video || !canvas) return
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
  const dataUri = canvas.toDataURL("image/jpeg", 0.92)
  capturedPreview.value = dataUri
  emit("capture", dataUri)
  stopCamera()
}

function handleRetake() {
  capturedPreview.value = null
  startCamera()
}
</script>

<template>
  <div class="space-y-2">
    <div class="relative aspect-[4/3] w-full overflow-hidden rounded-md border border-border bg-secondary/50">
      <img v-if="capturedPreview" :src="capturedPreview" alt="Foto hasil shoot" class="h-full w-full object-cover" />
      <video v-else ref="videoEl" muted playsinline :class="['h-full w-full object-cover', !cameraActive && 'hidden']" />
      <div v-if="!cameraActive && !capturedPreview" class="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
        <VideoOff class="h-8 w-8" />
        <span class="text-xs">Kamera belum aktif</span>
      </div>
    </div>
    <canvas ref="canvasEl" class="hidden" />

    <p v-if="error" class="text-xs text-destructive">{{ error }}</p>

    <div class="flex gap-2">
      <Button v-if="capturedPreview" type="button" variant="outline" size="sm" @click="handleRetake">
        <RefreshCw class="h-3.5 w-3.5" /> Ambil Ulang
      </Button>
      <Button v-else-if="cameraActive" type="button" size="sm" @click="handleCapture">
        <Camera class="h-3.5 w-3.5" /> Jepret
      </Button>
      <Button v-else type="button" variant="outline" size="sm" @click="startCamera">
        <Video class="h-3.5 w-3.5" /> Aktifkan Kamera
      </Button>
    </div>
  </div>
</template>
