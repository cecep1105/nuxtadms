import type { DeviceFunctionChoice } from "#shared/types/api"

/**
 * Ambil daftar Function code (settings.DEVICEFUNCTION Django) utk isi
 * dropdown -- lihat iclock/api_views.py::DeviceFunctionChoicesAPIView.
 * TIDAK ada masalah "tunggu session dulu" spt versi Next.js (session
 * race condition) -- useApiClient() di sini SELALU baca session
 * TERBARU (reactive, computed dari useUserSession()), dan komponen
 * yang MEMANGGIL ini (DeviceFormDialog) baru fetch saat dialog
 * BENAR-BENAR dibuka (watch(open)), bukan saat komponen mount --
 * pada titik itu sesi PASTI sudah termuat.
 */
export function useDeviceFunctionChoices() {
  const { request } = useApiClient()
  const choices = ref<DeviceFunctionChoice[]>([])
  const loading = ref(true)

  request<{ choices: DeviceFunctionChoice[] }>("/iclock/device-function-choices/")
    .then((data) => { choices.value = data.choices })
    .catch(() => { choices.value = [] })
    .finally(() => { loading.value = false })

  return { choices, loading }
}
