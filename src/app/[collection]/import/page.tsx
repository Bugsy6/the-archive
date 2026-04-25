"use client"

import { useParams, useRouter } from "next/navigation"
import { useState, useRef } from "react"
import Papa from "papaparse"
import { Button } from "@/components/ui/button"
import { UploadIcon, ArrowLeftIcon, CheckIcon } from "lucide-react"
import Link from "next/link"

type Step = "upload" | "map" | "importing" | "done"

interface ParsedRow {
  [key: string]: string
}

interface ImportResult {
  id: string
  title: string
}

export default function ImportPage() {
  const { collection: slug } = useParams<{ collection: string }>()
  const router = useRouter()

  const [step, setStep] = useState<Step>("upload")
  const [headers, setHeaders] = useState<string[]>([])
  const [rows, setRows] = useState<ParsedRow[]>([])
  const [titleCol, setTitleCol] = useState("")
  const [descCol, setDescCol] = useState("")
  const [phase1Progress, setPhase1Progress] = useState("")
  const [imageProgress, setImageProgress] = useState(0)
  const [imageTotal, setImageTotal] = useState(0)
  const [importedCount, setImportedCount] = useState(0)
  const [imagesFound, setImagesFound] = useState(0)
  const fileRef = useRef<HTMLInputElement>(null)

  function handleFile(file: File) {
    Papa.parse<ParsedRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(results) {
        const parsed = results.data
        if (!parsed.length) return
        const cols = Object.keys(parsed[0])
        setHeaders(cols)
        setRows(parsed)
        const autoTitle = cols.find(c => /^(title|name|game)$/i.test(c)) ?? cols[0]
        const autoDesc = cols.find(c => /^(description|desc|summary|notes)$/i.test(c)) ?? ""
        setTitleCol(autoTitle)
        setDescCol(autoDesc)
        setStep("map")
      },
    })
  }

  async function startImport() {
    setStep("importing")

    const items = rows
      .map(row => ({
        title: row[titleCol]?.trim() ?? "",
        description: descCol ? row[descCol]?.trim() || undefined : undefined,
      }))
      .filter(i => i.title)

    setPhase1Progress(`Creating ${items.length} items…`)

    const res = await fetch(`/api/import/${slug}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    })

    if (!res.ok) {
      setPhase1Progress("Import failed. Please try again.")
      return
    }

    const data: { count: number; items: ImportResult[] } = await res.json()
    const created = data.items
    setImportedCount(created.length)
    setImageTotal(created.length)

    let found = 0
    for (let i = 0; i < created.length; i++) {
      setImageProgress(i + 1)
      try {
        const searchRes = await fetch(
          `/api/search/bgg?q=${encodeURIComponent(created[i].title)}`
        )
        if (!searchRes.ok) continue
        const results = await searchRes.json()
        if (!results.length) continue

        const detailRes = await fetch(`/api/search/bgg/${results[0].externalId}`)
        if (!detailRes.ok) continue
        const detail = await detailRes.json()
        if (!detail.coverUrl) continue

        const photoRes = await fetch(`/api/items/${created[i].id}/photos/from-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url: detail.coverUrl }),
        })
        if (photoRes.ok) found++
      } catch {
        // skip silently
      }
    }

    setImagesFound(found)
    setStep("done")
  }

  const previewRows = rows.slice(0, 5)

  return (
    <div className="p-6 md:p-8 max-w-2xl">
      <div className="mb-6">
        <Link
          href={`/${slug}`}
          className="inline-flex items-center gap-1.5 text-sm text-zinc-400 hover:text-zinc-200 mb-4"
        >
          <ArrowLeftIcon className="size-4" />
          Back to collection
        </Link>
        <h1 className="text-2xl font-bold text-zinc-100">Import CSV</h1>
        <p className="text-sm text-zinc-400 mt-1">
          Upload a CSV or TSV file to bulk-import items into this collection.
        </p>
      </div>

      {step === "upload" && (
        <div
          className="border-2 border-dashed border-zinc-700 rounded-xl p-12 text-center cursor-pointer hover:border-zinc-500 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDragOver={e => e.preventDefault()}
          onDrop={e => {
            e.preventDefault()
            const file = e.dataTransfer.files[0]
            if (file) handleFile(file)
          }}
        >
          <UploadIcon className="size-8 mx-auto mb-3 text-zinc-500" />
          <p className="text-zinc-300 font-medium">Drop your CSV file here</p>
          <p className="text-sm text-zinc-500 mt-1">or click to browse</p>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.tsv,.txt"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
        </div>
      )}

      {step === "map" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Title column <span className="text-red-400">*</span>
              </label>
              <select
                value={titleCol}
                onChange={e => setTitleCol(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-1.5">
                Description column <span className="text-zinc-500">(optional)</span>
              </label>
              <select
                value={descCol}
                onChange={e => setDescCol(e.target.value)}
                className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-zinc-100 focus:outline-none focus:ring-1 focus:ring-zinc-500"
              >
                <option value="">— none —</option>
                {headers.map(h => (
                  <option key={h} value={h}>{h}</option>
                ))}
              </select>
            </div>
          </div>

          {previewRows.length > 0 && (
            <div>
              <p className="text-xs text-zinc-500 mb-2 uppercase tracking-wide">Preview (first 5 rows)</p>
              <div className="overflow-x-auto rounded-lg border border-zinc-800">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-zinc-800/60">
                      <th className="px-3 py-2 text-left text-zinc-400 font-medium">Title</th>
                      {descCol && <th className="px-3 py-2 text-left text-zinc-400 font-medium">Description</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {previewRows.map((row, i) => (
                      <tr key={i} className="border-t border-zinc-800">
                        <td className="px-3 py-2 text-zinc-200 truncate max-w-xs">
                          {row[titleCol] || <span className="text-zinc-600 italic">empty</span>}
                        </td>
                        {descCol && (
                          <td className="px-3 py-2 text-zinc-400 truncate max-w-xs">
                            {row[descCol] || <span className="text-zinc-600 italic">empty</span>}
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          <div className="flex items-center gap-3">
            <Button onClick={startImport} disabled={!titleCol} className="gap-1.5">
              <UploadIcon className="size-4" />
              Import {rows.length} games
            </Button>
            <button
              onClick={() => { setStep("upload"); setRows([]); setHeaders([]) }}
              className="text-sm text-zinc-400 hover:text-zinc-200"
            >
              Choose different file
            </button>
          </div>
        </div>
      )}

      {step === "importing" && (
        <div className="space-y-5">
          {phase1Progress && (
            <div className="flex items-center gap-3 text-zinc-300">
              {imageTotal === 0 ? (
                <div className="size-4 rounded-full border-2 border-zinc-500 border-t-zinc-200 animate-spin shrink-0" />
              ) : (
                <CheckIcon className="size-4 text-green-400 shrink-0" />
              )}
              <span className="text-sm">{imageTotal > 0 ? `${importedCount} items created` : phase1Progress}</span>
            </div>
          )}

          {imageTotal > 0 && (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-zinc-300">
                {imageProgress < imageTotal ? (
                  <div className="size-4 rounded-full border-2 border-zinc-500 border-t-zinc-200 animate-spin shrink-0" />
                ) : (
                  <CheckIcon className="size-4 text-green-400 shrink-0" />
                )}
                <span className="text-sm">
                  Fetching cover images… ({imageProgress}/{imageTotal})
                </span>
              </div>
              <div className="h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-zinc-400 rounded-full transition-all duration-300"
                  style={{ width: `${(imageProgress / imageTotal) * 100}%` }}
                />
              </div>
            </div>
          )}
        </div>
      )}

      {step === "done" && (
        <div className="space-y-5">
          <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <div className="flex items-center gap-2 mb-4">
              <CheckIcon className="size-5 text-green-400" />
              <span className="font-medium text-zinc-100">Import complete</span>
            </div>
            <dl className="space-y-1 text-sm">
              <div className="flex justify-between">
                <dt className="text-zinc-400">Items created</dt>
                <dd className="text-zinc-100 font-medium">{importedCount}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-zinc-400">Cover images found</dt>
                <dd className="text-zinc-100 font-medium">{imagesFound}</dd>
              </div>
            </dl>
          </div>
          <div className="flex gap-3">
            <Button onClick={() => router.push(`/${slug}`)}>
              View collection
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setStep("upload")
                setRows([])
                setHeaders([])
                setImageProgress(0)
                setImageTotal(0)
                setImportedCount(0)
                setImagesFound(0)
                setPhase1Progress("")
              }}
            >
              Import another file
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
