import { NextRequest, NextResponse } from "next/server"
import { getProvidersForCollection } from "@/lib/providers"

export async function GET(req: NextRequest) {
  const slug = req.nextUrl.searchParams.get("slug")

  if (!slug) {
    return NextResponse.json({ error: "Missing 'slug' parameter" }, { status: 400 })
  }

  const providers = getProvidersForCollection(slug)
  const result = providers.map((p) => ({ source: p.source, label: p.source }))

  return NextResponse.json(result)
}
