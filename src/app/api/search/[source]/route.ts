import { NextRequest, NextResponse } from "next/server"
import { getProviderBySource } from "@/lib/providers"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ source: string }> }
) {
  const { source } = await params
  const q = req.nextUrl.searchParams.get("q")

  if (!q || !q.trim()) {
    return NextResponse.json({ error: "Missing query parameter 'q'" }, { status: 400 })
  }

  const provider = getProviderBySource(source)
  if (!provider) {
    return NextResponse.json({ error: `Unknown or inactive provider: ${source}` }, { status: 404 })
  }

  const results = await provider.search(q.trim())
  return NextResponse.json(results)
}
