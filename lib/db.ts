import { neon } from "@neondatabase/serverless"

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL environment variable is required")
}

export const sql = neon(process.env.DATABASE_URL)

export async function generateUniqueGroupCode(): Promise<string> {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let attempts = 0
  const maxAttempts = 10

  while (attempts < maxAttempts) {
    let code = ""
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length))
    }

    const existing = await sql`
      SELECT 1 FROM groups WHERE code = ${code} LIMIT 1
    `

    if (existing.length === 0) {
      return code
    }

    attempts++
  }

  throw new Error("Unable to generate unique group code")
}

export function getUserId(request: Request): string {
  const userAgent = request.headers.get("user-agent") || "unknown"
  const ip = request.headers.get("x-forwarded-for") || "unknown"
  return `user_${Buffer.from(userAgent + ip)
    .toString("base64")
    .slice(0, 16)}`
}
