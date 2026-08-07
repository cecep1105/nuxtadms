<script setup lang="ts">
import { Loader2, Move, RotateCcw, Check, Cloud } from "@lucide/vue"
import type { PhotoBoxConfig } from "#shared/types/api"

/**
 * Retouch foto (geser posisi/crop) SEBELUM dipakai di ID Card -- Canvas
 * 2D native (BUKAN Wasm/Rust: tugas ini murni transform affine
 * sederhana yg SUDAH dioptimasi habis-habisan oleh Canvas 2D browser,
 * lihat diskusi sebelumnya). Pola interaksi: FRAME crop UKURAN TETAP
 * (rasio PERSIS SAMA dgn kotak foto sungguhan di kartu, lihat
 * fetchAspectRatio()), user GESER & ZOOM fotonya (bukan geser garis
 * crop) -- lebih sederhana scr matematika (cuma 1 set transform:
 * scale+offset) drpd rectangle crop bebas-resize dgn 8 handle, DAN
 * lebih mirip pola "atur foto profil" yang sudah familiar bagi user
 * awam.
 *
 * PENTING rasio TIDAK di-hardcode di sini -- diambil dari
 * /idcard/photo-box-config/ (server), supaya SELALU cocok dgn kotak
 * foto SUNGGUHAN di kartu (settings.IDCARD_PHOTO_BOX bisa beda per
 * deployment lewat .env) -- kalau di-hardcode & beda, foto BISA
 * ke-crop ULANG scr tidak terduga oleh backend stlh staf susah payah
 * atur posisi di sini.
 */
const props = defineProps<{ sourceImage: string; pin?: string }>()
const open = defineModel<boolean>("open", { required: true })
const emit = defineEmits<{ (e: "retouched", dataUri: string): void }>()

const { request } = useApiClient()

const FRAME_WIDTH = 280 // px, ukuran TAMPILAN frame crop di dialog (BUKAN resolusi output akhir)
const frameHeight = ref(FRAME_WIDTH) // disesuaikan begitu rasio server diketahui

const canvasEl = ref<HTMLCanvasElement>()
const containerEl = ref<HTMLDivElement>()
let img: HTMLImageElement | null = null

const imgLoaded = ref(false)
const loadError = ref<string | null>(null)
const baseScale = ref(1) // skala MINIMUM spy foto SELALU menutupi frame penuh (spt CSS object-fit: cover)
const zoomMultiplier = ref(1) // 1 = base (paling zoom-out yg masih menutupi frame penuh), makin besar makin zoom-in
const offsetX = ref(0)
const offsetY = ref(0)

const saveToFtp = ref(true) // default AKTIF kalau `pin` tersedia (karyawan/driver) -- sesuai tujuan "dipakai ulang tanpa crop ulang"
const applying = ref(false)
const applyError = ref<string | null>(null)

let dragState: { startX: number; startY: number; originOffsetX: number; originOffsetY: number } | null = null

function clampOffsets() {
  const scale = baseScale.value * zoomMultiplier.value
  const dispW = (img?.naturalWidth ?? 0) * scale
  const dispH = (img?.naturalHeight ?? 0) * scale
  const maxX = Math.max(0, (dispW - FRAME_WIDTH) / 2)
  const maxY = Math.max(0, (dispH - frameHeight.value) / 2)
  offsetX.value = Math.min(maxX, Math.max(-maxX, offsetX.value))
  offsetY.value = Math.min(maxY, Math.max(-maxY, offsetY.value))
}

function draw() {
  const canvas = canvasEl.value
  if (!canvas || !img) return
  const ctx = canvas.getContext("2d")
  if (!ctx) return
  ctx.clearRect(0, 0, canvas.width, canvas.height)

  const scale = baseScale.value * zoomMultiplier.value
  const dispW = img.naturalWidth * scale
  const dispH = img.naturalHeight * scale
  const x = (FRAME_WIDTH - dispW) / 2 + offsetX.value
  const y = (frameHeight.value - dispH) / 2 + offsetY.value
  ctx.drawImage(img, x, y, dispW, dispH)
}

async function loadImage() {
  imgLoaded.value = false
  loadError.value = null
  const image = new Image()
  image.onload = () => {
    img = image
    baseScale.value = Math.max(FRAME_WIDTH / image.naturalWidth, frameHeight.value / image.naturalHeight)
    zoomMultiplier.value = 1
    offsetX.value = 0
    offsetY.value = 0
    imgLoaded.value = true
    nextTick(draw)
  }
  image.onerror = () => { loadError.value = "Gagal memuat gambar." }
  image.src = props.sourceImage
}

async function fetchAspectRatio() {
  try {
    const cfg = await request<PhotoBoxConfig>("/idcard/photo-box-config/")
    frameHeight.value = Math.round(FRAME_WIDTH * (cfg.height / cfg.width))
  } catch {
    // gagal ambil config -- fallback rasio 3:4.75 (nilai yg DISEBUTKAN
    // di komentar card_generator.py) drpd persegi buta, MASIH bisa
    // salah kalau server benar2 dikonfigurasi beda, tapi lebih dekat
    // drpd tebakan 1:1.
    frameHeight.value = Math.round(FRAME_WIDTH * (4.75 / 3))
  }
}

watch(open, async (isOpen) => {
  if (!isOpen) return
  applyError.value = null
  saveToFtp.value = Boolean(props.pin)
  await fetchAspectRatio()
  await nextTick()
  if (canvasEl.value) { canvasEl.value.width = FRAME_WIDTH; canvasEl.value.height = frameHeight.value }
  await loadImage()
})

watch([zoomMultiplier, offsetX, offsetY], () => { clampOffsets(); draw() })

function handlePointerDown(e: PointerEvent) {
  if (!imgLoaded.value) return
  ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
  dragState = { startX: e.clientX, startY: e.clientY, originOffsetX: offsetX.value, originOffsetY: offsetY.value }
}
function handlePointerMove(e: PointerEvent) {
  if (!dragState) return
  offsetX.value = dragState.originOffsetX + (e.clientX - dragState.startX)
  offsetY.value = dragState.originOffsetY + (e.clientY - dragState.startY)
}
function handlePointerUp() { dragState = null }

function handleReset() {
  zoomMultiplier.value = 1
  offsetX.value = 0
  offsetY.value = 0
}

async function handleApply() {
  if (!img) return
  applying.value = true
  applyError.value = null
  try {
    const scale = baseScale.value * zoomMultiplier.value
    const dispW = img.naturalWidth * scale
    const dispH = img.naturalHeight * scale
    const imgX = (FRAME_WIDTH - dispW) / 2 + offsetX.value
    const imgY = (frameHeight.value - dispH) / 2 + offsetY.value

    // Konversi area frame (koordinat TAMPILAN) balik ke koordinat PIXEL
    // ASLI gambar (bagi dgn scale) -- ini yg akan di-`drawImage` sbg
    // source rectangle.
    const sx = -imgX / scale
    const sy = -imgY / scale
    const sW = FRAME_WIDTH / scale
    const sH = frameHeight.value / scale

    // Output 2x resolusi frame TAMPILAN utk kualitas cetak yg lebih baik
    // (bukan cuma preview-resolution) -- dibatasi maksimal wajar.
    const outW = Math.min(1200, FRAME_WIDTH * 2)
    const outH = Math.round(outW * (frameHeight.value / FRAME_WIDTH))

    const outputCanvas = document.createElement("canvas")
    outputCanvas.width = outW
    outputCanvas.height = outH
    const ctx = outputCanvas.getContext("2d")!
    ctx.drawImage(img, sx, sy, sW, sH, 0, 0, outW, outH)
    const dataUri = outputCanvas.toDataURL("image/jpeg", 0.92)

    if (saveToFtp.value && props.pin) {
      await request("/idcard/photo-retouch-save/", { method: "POST", body: JSON.stringify({ pin: props.pin, photo_data: dataUri }) })
    }

    emit("retouched", dataUri)
    open.value = false
  } catch (err) {
    applyError.value = extractErrorMessage(err, "Gagal menyimpan hasil retouch ke FTP -- foto TETAP dipakai utk kartu ini, cuma tidak tersimpan utk dipakai ulang.")
  } finally {
    applying.value = false
  }
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-w-md">
      <DialogHeader>
        <DialogTitle>Retouch Foto</DialogTitle>
        <DialogDescription>Geser foto untuk atur posisi, gunakan slider untuk zoom. Area di dalam bingkai adalah yang akan tampil di kartu.</DialogDescription>
      </DialogHeader>

      <div v-if="loadError" class="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs text-destructive">{{ loadError }}</div>

      <div class="flex flex-col items-center gap-3">
        <div
          ref="containerEl"
          class="touch-none overflow-hidden rounded-md border-2 border-primary bg-secondary/50"
          :style="{ width: `${FRAME_WIDTH}px`, height: `${frameHeight}px` }"
        >
          <canvas
            ref="canvasEl" :width="FRAME_WIDTH" :height="frameHeight"
            class="cursor-move"
            @pointerdown="handlePointerDown" @pointermove="handlePointerMove" @pointerup="handlePointerUp" @pointercancel="handlePointerUp"
          />
        </div>

        <div v-if="!imgLoaded && !loadError" class="flex items-center gap-2 text-xs text-muted-foreground">
          <Loader2 class="h-3.5 w-3.5 animate-spin" /> Memuat gambar...
        </div>

        <div v-if="imgLoaded" class="w-full space-y-3">
          <div class="flex items-center gap-2">
            <Move class="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <input v-model.number="zoomMultiplier" type="range" min="1" max="3" step="0.05" class="w-full" />
            <Button variant="ghost" size="icon" class="h-7 w-7 shrink-0" aria-label="Reset posisi & zoom" @click="handleReset">
              <RotateCcw class="h-3.5 w-3.5" />
            </Button>
          </div>

          <label v-if="pin" class="flex cursor-pointer items-start gap-2 rounded-md border border-border bg-secondary/50 px-3 py-2 text-xs">
            <Checkbox v-model:checked="saveToFtp" class="mt-0.5" />
            <span>
              <span class="flex items-center gap-1 font-medium"><Cloud class="h-3 w-3" /> Simpan ke FTP untuk dipakai ulang</span>
              <span class="block text-[11px] text-muted-foreground">Begitu disimpan, pencarian foto FTP berikutnya utk PIN ini akan menampilkan hasil retouch ini duluan -- tidak perlu atur ulang posisi tiap generate kartu baru.</span>
            </span>
          </label>
        </div>
      </div>

      <div v-if="applyError" class="rounded-md border border-warning/30 bg-warning/10 px-3 py-2 text-xs text-warning">{{ applyError }}</div>

      <DialogFooter>
        <Button type="button" variant="outline" @click="open = false">Batal</Button>
        <Button type="button" :disabled="!imgLoaded || applying" @click="handleApply">
          <Loader2 v-if="applying" class="h-3.5 w-3.5 animate-spin" /><Check v-else class="h-3.5 w-3.5" /> Terapkan
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
