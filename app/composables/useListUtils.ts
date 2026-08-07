/**
 * Utility pagination/sort/filter GENERIK -- versi Vue, dipakai utk data
 * yang diambil LANGSUNG oleh Nuxt server route (BUKAN lewat Django),
 * mis. VMware Host/VM Guest (REST API vCenter langsung, lihat
 * server/utils/vsphere.ts) -- TIDAK ADA proxy Django utk pagination/
 * sort/filter, jadi dikerjakan di sini (client-side, atas SEMUA data
 * yg sudah di-fetch).
 *
 * Konvensi param SAMA dgn RouterOSSearchBar/PaginationBar/SortableHeader
 * (q, page, page_size, sortBy, sortDir -- TANPA underscore) -- supaya
 * komponen itu bisa dipakai APA ADANYA tanpa modifikasi, sama pola
 * dgn versi Next.js (list-utils.ts, ada catatan panjang di sana soal
 * bug produksi yg SUDAH diperbaiki krn nama param sempat salah).
 */

export interface PaginatedResult<T> {
  count: number
  page: number
  results: T[]
}

export function paginateSortFilter<T extends Record<string, unknown>>(
  rows: T[],
  options: { page: number; pageSize: number; sortBy: string; sortDir: "asc" | "desc"; searchQuery: string; searchFields: string[] }
): PaginatedResult<T> {
  let result = rows

  if (options.searchQuery && options.searchFields.length > 0) {
    const q = options.searchQuery.toLowerCase()
    result = result.filter((item) => options.searchFields.some((field) => String(item[field] ?? "").toLowerCase().includes(q)))
  }

  result = [...result].sort((a, b) => {
    const av = String(a[options.sortBy] ?? "")
    const bv = String(b[options.sortBy] ?? "")
    const cmp = av.localeCompare(bv, undefined, { numeric: true })
    return options.sortDir === "desc" ? -cmp : cmp
  })

  const start = (options.page - 1) * options.pageSize
  const paginated = result.slice(start, start + options.pageSize)

  return { count: result.length, page: options.page, results: paginated }
}
