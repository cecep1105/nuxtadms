/**
 * Ubah URL media (foto/gambar) dari API Django jadi URL yang PASTI bisa
 * diakses browser -- Django SEHARUSNYA sudah balikin URL ABSOLUTE lewat
 * context={'request': request} di serializer, TAPI itu BERGANTUNG pada
 * Django bisa BENAR baca header Host dari request yang masuk --
 * `runserver` (server development bawaan Django) TERBUKTI py
 * keterbatasan soal ini kalau diakses lewat topologi jaringan yang
 * tidak sederhana (mis. port-forwarding Docker), BISA balikin
 * '127.0.0.1:8000' (perspektif INTERNAL container) drpd host yang
 * SEBENARNYA dipakai browser.
 *
 * Fungsi ini jadi LAPISAN AMAN TAMBAHAN yang TIDAK BERGANTUNG pada
 * Django benar/salah baca Host-nya sendiri: ekstrak PATH-nya saja dari
 * URL yang dikembalikan Django (APAPUN host-nya), gabung ulang dgn
 * NUXT_PUBLIC_MEDIA_URL (diisi manual di .env, TIDAK bergantung sama
 * sekali pada Django).
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return ""
  const config = useRuntimeConfig()
  const mediaBaseUrl = (config.public.mediaUrl || "").replace(/\/+$/, "")
  if (!mediaBaseUrl) return url
  try {
    const path = new URL(url).pathname
    return `${mediaBaseUrl}${path}`
  } catch {
    // url ternyata BUKAN URL absolute (path relative spt "/media/...") --
    // gabung langsung apa adanya, best-effort terakhir.
    return `${mediaBaseUrl}${url.startsWith("/") ? url : `/${url}`}`
  }
}
