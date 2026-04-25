import { NextRequest, NextResponse } from "next/server"
import { getProviderBySource } from "@/lib/providers"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ source: string; id: string }> }
) {
  const { source, id } = await params

  const provider = getProviderBySource(source)
  if (!provider) {
    return NextResponse.json({ error: `Unknown or inactive provider: ${source}` }, { status: 404 })
  }

  const result = await provider.getById(id)
  if (!result) {
    return NextResponse.json({ error: "Not found" }, { status: 404 })
  }

  return NextResponse.json(result)
}
