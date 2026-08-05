/**
 * Baca klaim `exp` dari JWT (base64 payload) TANPA perlu library JWT
 * penuh -- SAMA PERSIS logic versi Next.js (auth.ts::decodeJwtExpiry).
 */
export function decodeJwtExpiry(token: string): number {
  try {
    const payloadPart = token.split(".")[1]
    if (!payloadPart) throw new Error("Invalid JWT format")
    const payload = JSON.parse(Buffer.from(payloadPart, "base64").toString())
    return (payload.exp as number) * 1000
  } catch {
    return Date.now() + 25 * 60 * 1000 // fallback konservatif kalau decode gagal
  }
}
