import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useMemo, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import * as XLSX from 'xlsx'
import {
  createManageProduct,
  fetchManageBrands,
  fetchManageCategories,
  type ManageProduct,
} from '../api'
import { PageHeader } from '../components/PageHeader'

type ImportRow = {
  id: string
  selected: boolean
  name: string
  brand: number
  brandLabel: string
  category_ids: number[]
  categoriesLabel: string
  sku: string
  price: string
  currency: string
  short_description: string
  long_description: string
  specsText: string
  is_featured: boolean
  is_published: boolean
  error: string
}

const HEADER_ALIASES: Record<string, string> = {
  name: 'name',
  product: 'name',
  product_name: 'name',
  title: 'name',
  brand: 'brand',
  brand_name: 'brand',
  sku: 'sku',
  code: 'sku',
  model: 'sku',
  price: 'price',
  currency: 'currency',
  short_description: 'short_description',
  short_description_text: 'short_description',
  summary: 'short_description',
  long_description: 'long_description',
  description: 'long_description',
  categories: 'categories',
  category: 'categories',
  specs: 'specs',
  specifications: 'specs',
  is_featured: 'is_featured',
  featured: 'is_featured',
  is_published: 'is_published',
  published: 'is_published',
  status: 'is_published',
}

const KNOWN_FIELDS = new Set(Object.values(HEADER_ALIASES))

function normalizeHeader(raw: string) {
  return raw
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
}

function parseBool(value: unknown, fallback = false) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  const s = String(value ?? '')
    .trim()
    .toLowerCase()
  if (!s) return fallback
  if (['1', 'true', 'yes', 'y', 'published', 'featured'].includes(s)) return true
  if (['0', 'false', 'no', 'n', 'draft', 'unpublished'].includes(s)) return false
  return fallback
}

function parsePrice(value: unknown) {
  const raw = String(value ?? '')
    .replace(/,/g, '')
    .replace(/[^\d.-]/g, '')
    .trim()
  if (!raw) return '0.00'
  const n = Number(raw)
  if (Number.isNaN(n)) return '0.00'
  return n.toFixed(2)
}

function parseSpecs(value: unknown): Record<string, string> {
  const text = String(value ?? '').trim()
  if (!text) return {}
  try {
    const parsed = JSON.parse(text) as unknown
    if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
      const out: Record<string, string> = {}
      for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
        if (k.trim()) out[k.trim()] = String(v ?? '')
      }
      return out
    }
  } catch {
    // key=value; key=value
  }
  const out: Record<string, string> = {}
  for (const part of text.split(/[;\n|]+/)) {
    const idx = part.indexOf('=')
    const alt = part.indexOf(':')
    const sep = idx >= 0 ? idx : alt
    if (sep < 0) continue
    const key = part.slice(0, sep).trim()
    const val = part.slice(sep + 1).trim()
    if (key) out[key] = val
  }
  return out
}

function specsToText(specs: Record<string, string>) {
  return Object.entries(specs)
    .map(([k, v]) => `${k}=${v}`)
    .join('; ')
}

function cell(row: Record<string, unknown>, key: string) {
  const v = row[key]
  if (v == null) return ''
  return String(v).trim()
}

function downloadTemplate() {
  const rows = [
    {
      name: 'Example Built-in Hob',
      brand: "Mac'sons",
      sku: 'HOB-001',
      price: 89900,
      currency: 'PKR',
      short_description: '4-burner gas hob',
      long_description: 'Full product description here.',
      categories: 'Stoves & Hobs',
      specs: 'Burners=4; Ignition=Auto',
      is_published: 'yes',
      is_featured: 'no',
    },
  ]
  const sheet = XLSX.utils.json_to_sheet(rows)
  const book = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(book, sheet, 'Products')
  XLSX.writeFile(book, 'ugh-products-import-template.xlsx')
}

export function AdminProductsImportPage() {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const fileRef = useRef<HTMLInputElement>(null)

  const brands = useQuery({ queryKey: ['manage-brands'], queryFn: fetchManageBrands })
  const categories = useQuery({
    queryKey: ['manage-categories'],
    queryFn: fetchManageCategories,
  })

  const [rows, setRows] = useState<ImportRow[]>([])
  const [parseError, setParseError] = useState('')
  const [importMessage, setImportMessage] = useState('')
  const [importErrors, setImportErrors] = useState<string[]>([])
  const [fileName, setFileName] = useState('')

  const brandByName = useMemo(() => {
    const map = new Map<string, number>()
    for (const b of brands.data ?? []) {
      map.set(b.name.trim().toLowerCase(), b.id)
    }
    return map
  }, [brands.data])

  const categoryByName = useMemo(() => {
    const map = new Map<string, number>()
    for (const c of categories.data ?? []) {
      map.set(c.name.trim().toLowerCase(), c.id)
    }
    return map
  }, [categories.data])

  const selectedCount = rows.filter((r) => r.selected).length
  const allSelected = rows.length > 0 && rows.every((r) => r.selected)

  function resolveBrand(label: string, fallbackId: number) {
    const key = label.trim().toLowerCase()
    if (!key) return { id: fallbackId, label }
    const id = brandByName.get(key)
    return { id: id ?? fallbackId, label }
  }

  function resolveCategories(label: string) {
    const parts = label
      .split(/[,|;]+/)
      .map((p) => p.trim())
      .filter(Boolean)
    const ids: number[] = []
    for (const part of parts) {
      const id = categoryByName.get(part.toLowerCase())
      if (id != null) ids.push(id)
    }
    return { ids, label }
  }

  function mapSheetRows(rawRows: Record<string, unknown>[]) {
    const defaultBrandId = brands.data?.[0]?.id ?? 0
    const mapped: ImportRow[] = []

    for (let i = 0; i < rawRows.length; i++) {
      const source = rawRows[i]
      const normalized: Record<string, unknown> = {}
      const extraSpecs: Record<string, string> = {}

      for (const [header, value] of Object.entries(source)) {
        const norm = normalizeHeader(header)
        const field = HEADER_ALIASES[norm]
        if (field) {
          normalized[field] = value
        } else if (norm && !KNOWN_FIELDS.has(norm) && value != null && String(value).trim()) {
          extraSpecs[header.trim()] = String(value).trim()
        }
      }

      const name = cell(normalized, 'name')
      if (!name && !cell(normalized, 'sku') && !cell(normalized, 'price')) continue

      const brandLabel = cell(normalized, 'brand')
      const brandResolved = resolveBrand(brandLabel, defaultBrandId)
      const categoriesLabel = cell(normalized, 'categories')
      const catsResolved = resolveCategories(categoriesLabel)
      const specs = {
        ...parseSpecs(normalized.specs),
        ...extraSpecs,
      }

      let error = ''
      if (!name) error = 'Name is required'
      else if (!brandResolved.id) error = 'No brand available — create a brand first'
      else if (brandLabel && !brandByName.has(brandLabel.toLowerCase())) {
        error = `Brand "${brandLabel}" not found — pick one from the list`
      }

      mapped.push({
        id: `row-${i}-${Math.random().toString(36).slice(2, 8)}`,
        selected: !error,
        name,
        brand: brandResolved.id,
        brandLabel,
        category_ids: catsResolved.ids,
        categoriesLabel,
        sku: cell(normalized, 'sku'),
        price: parsePrice(normalized.price),
        currency: (cell(normalized, 'currency') || 'PKR').toUpperCase().slice(0, 3),
        short_description: cell(normalized, 'short_description'),
        long_description: cell(normalized, 'long_description'),
        specsText: specsToText(specs),
        is_featured: parseBool(normalized.is_featured, false),
        is_published: parseBool(normalized.is_published, true),
        error,
      })
    }

    return mapped
  }

  async function onFileChange(fileList: FileList | null) {
    setParseError('')
    setImportMessage('')
    setImportErrors([])
    setRows([])
    setFileName('')
    const file = fileList?.[0]
    if (!file) return

    const lower = file.name.toLowerCase()
    if (!lower.endsWith('.xlsx') && !lower.endsWith('.xls') && !lower.endsWith('.csv')) {
      setParseError('Please upload an .xlsx, .xls, or .csv file.')
      if (fileRef.current) fileRef.current.value = ''
      return
    }

    try {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheetName = workbook.SheetNames[0]
      if (!sheetName) {
        setParseError('The file has no sheets.')
        return
      }
      const sheet = workbook.Sheets[sheetName]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: '',
        raw: false,
      })
      if (!json.length) {
        setParseError('No rows found in the first sheet.')
        return
      }
      const mapped = mapSheetRows(json)
      if (!mapped.length) {
        setParseError(
          'No product rows found. Include a "name" column (and ideally brand, price, sku).',
        )
        return
      }
      setFileName(file.name)
      setRows(mapped)
    } catch (err) {
      setParseError(err instanceof Error ? err.message : 'Could not read that file.')
    } finally {
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  function updateRow(id: string, patch: Partial<ImportRow>) {
    setRows((prev) =>
      prev.map((row) => {
        if (row.id !== id) return row
        const next = { ...row, ...patch }
        if ('name' in patch || 'brand' in patch) {
          next.error = !next.name.trim()
            ? 'Name is required'
            : !next.brand
              ? 'Brand is required'
              : ''
        }
        return next
      }),
    )
  }

  function toggleAll(checked: boolean) {
    setRows((prev) => prev.map((r) => ({ ...r, selected: checked })))
  }

  const importMutation = useMutation({
    mutationFn: async () => {
      const toImport = rows.filter((r) => r.selected)
      if (!toImport.length) throw new Error('Select at least one product to import.')

      const createdIds: string[] = []
      const failures: string[] = []

      for (const row of toImport) {
        if (!row.name.trim()) {
          failures.push(`Skipped empty name (SKU ${row.sku || '—'})`)
          continue
        }
        if (!row.brand) {
          failures.push(`"${row.name}": brand is required`)
          continue
        }
        try {
          const payload: Partial<ManageProduct> = {
            name: row.name.trim(),
            brand: row.brand,
            category_ids: row.category_ids,
            sku: row.sku.trim(),
            price: parsePrice(row.price),
            currency: row.currency || 'PKR',
            short_description: row.short_description.trim(),
            long_description: row.long_description.trim(),
            specs: parseSpecs(row.specsText),
            is_featured: row.is_featured,
            is_published: row.is_published,
            sort_order: 0,
          }
          await createManageProduct(payload)
          createdIds.push(row.id)
        } catch (err) {
          failures.push(
            `"${row.name}": ${err instanceof Error ? err.message : 'failed to create'}`,
          )
        }
      }

      return { createdIds, failures }
    },
    onSuccess: ({ createdIds, failures }) => {
      void queryClient.invalidateQueries({ queryKey: ['manage-products'] })
      void queryClient.invalidateQueries({ queryKey: ['manage-dashboard'] })
      setImportErrors(failures)
      if (createdIds.length) {
        setImportMessage(
          `Imported ${createdIds.length} product${createdIds.length === 1 ? '' : 's'}.`,
        )
        const done = new Set(createdIds)
        setRows((prev) => prev.filter((r) => !done.has(r.id)))
        if (!failures.length) {
          window.setTimeout(() => navigate('/manage/products'), 900)
        }
      } else if (failures.length) {
        setImportMessage('No products were imported.')
      }
    },
    onError: (err: Error) => {
      setImportMessage('')
      setImportErrors([err.message])
    },
  })

  return (
    <div className="manage-page">
      <PageHeader
        eyebrow="Catalogue"
        title="Import products"
        description="Upload an Excel file, review the table, edit fields, and uncheck any row you do not want to import."
        actions={
          <>
            <button type="button" className="manage-btn manage-btn--ghost" onClick={downloadTemplate}>
              Download template
            </button>
            <Link to="/manage/products" className="manage-btn">
              Back to products
            </Link>
          </>
        }
      />

      <section className="manage-form-section manage-import-upload">
        <h3>1. Upload file</h3>
        <p className="manage-muted">
          Accepted columns: <code>name</code>, <code>brand</code>, <code>sku</code>,{' '}
          <code>price</code>, <code>currency</code>, <code>short_description</code>,{' '}
          <code>long_description</code>, <code>categories</code> (comma-separated),{' '}
          <code>specs</code> (<code>Key=Value; Key=Value</code>), <code>is_published</code>,{' '}
          <code>is_featured</code>. Extra columns become specs. Brand and category names must
          match existing catalogue entries.
        </p>
        <label className="manage-field">
          <span>XLSX / XLS / CSV</span>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel,text/csv"
            disabled={!brands.data?.length}
            onChange={(e) => void onFileChange(e.target.files)}
          />
        </label>
        {!brands.data?.length && !brands.isLoading ? (
          <p className="manage-alert">Create at least one brand before importing products.</p>
        ) : null}
        {brands.isLoading ? <p className="manage-muted">Loading brands…</p> : null}
        {fileName ? <p className="manage-muted">Loaded: {fileName}</p> : null}
        {parseError ? <p className="manage-alert">{parseError}</p> : null}
      </section>

      {rows.length ? (
        <section className="manage-form-section">
          <div className="manage-import-toolbar">
            <h3>2. Review &amp; edit ({selectedCount} of {rows.length} selected)</h3>
            <div className="manage-import-toolbar__actions">
              <button
                type="button"
                className="manage-btn manage-btn--ghost"
                onClick={() => toggleAll(!allSelected)}
              >
                {allSelected ? 'Uncheck all' : 'Check all'}
              </button>
              <button
                type="button"
                className="manage-btn manage-btn--primary"
                disabled={importMutation.isPending || selectedCount === 0}
                onClick={() => {
                  setImportMessage('')
                  setImportErrors([])
                  importMutation.mutate()
                }}
              >
                {importMutation.isPending
                  ? `Importing…`
                  : `Import ${selectedCount} product${selectedCount === 1 ? '' : 's'}`}
              </button>
            </div>
          </div>

          {importMessage ? <p className="manage-success">{importMessage}</p> : null}
          {importErrors.length ? (
            <ul className="manage-import-errors">
              {importErrors.map((err) => (
                <li key={err}>{err}</li>
              ))}
            </ul>
          ) : null}

          <div className="manage-table-wrap manage-import-table-wrap">
            <table className="manage-table manage-import-table">
              <thead>
                <tr>
                  <th className="manage-import-table__check">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => toggleAll(e.target.checked)}
                      aria-label="Select all products"
                    />
                  </th>
                  <th>Name</th>
                  <th>Brand</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Currency</th>
                  <th>Categories</th>
                  <th>Short description</th>
                  <th>Specs</th>
                  <th>Flags</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr
                    key={row.id}
                    className={
                      row.selected
                        ? row.error
                          ? 'manage-import-row manage-import-row--warn'
                          : 'manage-import-row'
                        : 'manage-import-row manage-import-row--off'
                    }
                  >
                    <td className="manage-import-table__check">
                      <input
                        type="checkbox"
                        checked={row.selected}
                        onChange={(e) => updateRow(row.id, { selected: e.target.checked })}
                        aria-label={`Import ${row.name || 'row'}`}
                      />
                    </td>
                    <td>
                      <input
                        className="manage-import-input"
                        value={row.name}
                        onChange={(e) => updateRow(row.id, { name: e.target.value })}
                      />
                      {row.error ? <span className="manage-table__sub" style={{ color: '#f3a48a' }}>{row.error}</span> : null}
                    </td>
                    <td>
                      <select
                        className="manage-import-input"
                        value={row.brand || ''}
                        onChange={(e) =>
                          updateRow(row.id, {
                            brand: Number(e.target.value) || 0,
                            brandLabel:
                              brands.data?.find((b) => b.id === Number(e.target.value))?.name ??
                              '',
                          })
                        }
                      >
                        <option value="">Select brand</option>
                        {(brands.data ?? []).map((b) => (
                          <option key={b.id} value={b.id}>
                            {b.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        className="manage-import-input"
                        value={row.sku}
                        onChange={(e) => updateRow(row.id, { sku: e.target.value })}
                      />
                    </td>
                    <td>
                      <input
                        className="manage-import-input manage-import-input--price"
                        value={row.price}
                        onChange={(e) => updateRow(row.id, { price: e.target.value })}
                      />
                    </td>
                    <td>
                      <select
                        className="manage-import-input"
                        value={row.currency}
                        onChange={(e) => updateRow(row.id, { currency: e.target.value })}
                      >
                        <option value="PKR">PKR</option>
                        <option value="USD">USD</option>
                        <option value="AED">AED</option>
                        <option value="EUR">EUR</option>
                      </select>
                    </td>
                    <td>
                      <input
                        className="manage-import-input"
                        value={row.categoriesLabel}
                        placeholder="Category A, Category B"
                        title="Comma-separated category names (must match existing categories)"
                        onChange={(e) => {
                          const label = e.target.value
                          const resolved = resolveCategories(label)
                          updateRow(row.id, {
                            categoriesLabel: label,
                            category_ids: resolved.ids,
                          })
                        }}
                      />
                      {row.categoriesLabel.trim() && row.category_ids.length === 0 ? (
                        <span className="manage-table__sub" style={{ color: '#f3a48a' }}>No matching categories</span>
                      ) : null}
                    </td>
                    <td>
                      <input
                        className="manage-import-input"
                        value={row.short_description}
                        onChange={(e) =>
                          updateRow(row.id, { short_description: e.target.value })
                        }
                      />
                    </td>
                    <td>
                      <input
                        className="manage-import-input"
                        value={row.specsText}
                        onChange={(e) => updateRow(row.id, { specsText: e.target.value })}
                        placeholder="Key=Value; Key=Value"
                      />
                    </td>
                    <td>
                      <label className="manage-import-flag">
                        <input
                          type="checkbox"
                          checked={row.is_published}
                          onChange={(e) =>
                            updateRow(row.id, { is_published: e.target.checked })
                          }
                        />
                        Published
                      </label>
                      <label className="manage-import-flag">
                        <input
                          type="checkbox"
                          checked={row.is_featured}
                          onChange={(e) =>
                            updateRow(row.id, { is_featured: e.target.checked })
                          }
                        />
                        Featured
                      </label>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="manage-muted">
            Uncheck any row to skip it. Edit cells inline, then click Import. Images are not
            included in the spreadsheet — add them after import on each product page.
          </p>
        </section>
      ) : null}
    </div>
  )
}
