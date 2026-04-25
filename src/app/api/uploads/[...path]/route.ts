import { NextRequest, NextResponse } from "next/server"
import path from "path"
import { readFile } from "fs/promises"

const UPLOAD_DIR = process.env.UPLOAD_DIR ?? "./uploads"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    const { path: pathParts } = await params

    // Path traversal protection: only allow alphanumeric, hyphen, underscore, dot
    const safe = pathParts.every((p) => /^[a-zA-Z0-9._-]+$/.test(p))
    if (!safe) {
      return NextResponse.json({ error: "Invalid path" }, { status: 400 })
    }

    const filePath = path.join(UPLOAD_DIR, ...pathParts)

    // Ensure the resolved path is within UPLOAD_DIR
    const resolvedUploadDir = path.resolve(UPLOAD_DIR)
    const resolvedFilePath = path.resolve(filePath)
    if (!resolvedFilePath.startsWith(resolvedUploadDir + path.sep) && resolvedFilePath !== resolvedUploadDir) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const fileBuffer = await readFile(filePath)
    const ext = path.extname(filePath).toLowerCase()
    const contentTypeMap: Record<string, string> = {
      ".webp": "image/webp",
      ".jpg": "image/jpeg",
      ".jpeg": "image/jpeg",
      ".png": "image/png",
      ".gif": "image/gif",
    }
    const contentType = contentTypeMap[ext] ?? "application/octet-stream"

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    })
  } catch (error: unknown) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }
    return NextResponse.json({ error: "Failed to serve file" }, { status: 500 })
  }
}
