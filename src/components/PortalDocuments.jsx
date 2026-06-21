import { useEffect, useMemo, useState } from 'react'
import { getSupabaseBrowser } from '../lib/supabaseBrowser.js'

const CATEGORY_OPTIONS = [
  { value: 'general', label: 'General' },
  { value: 'tax', label: 'Tax' },
  { value: 'bookkeeping', label: 'Bookkeeping' },
  { value: 'payroll', label: 'Payroll' },
]
const DEFAULT_STORAGE_BUCKET = 'fidara-client-documents'
const STORAGE_BUCKET = import.meta.env.PUBLIC_SUPABASE_STORAGE_BUCKET || DEFAULT_STORAGE_BUCKET

export default function PortalDocuments() {
  const [clientId, setClientId] = useState('')
  const [documents, setDocuments] = useState([])
  const [category, setCategory] = useState('general')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [uploadError, setUploadError] = useState('')

  const hasDocuments = useMemo(() => documents.length > 0, [documents])

  function redirectToLogin() {
    window.location.assign('/login')
  }

  async function loadDocuments({ showLoading = false } = {}) {
    if (showLoading) setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/portal?action=documents', {
        headers: { accept: 'application/json' },
      })

      if (response.status === 401) {
        redirectToLogin()
        return
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to load documents.')
      }

      setClientId(data.clientId || '')
      setDocuments(Array.isArray(data.documents) ? data.documents : [])
    } catch (loadError) {
      setError(loadError.message || 'Failed to load documents.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    async function initializeDocuments() {
      setError('')

      try {
        const response = await fetch('/api/portal?action=documents', {
          headers: { accept: 'application/json' },
        })

        if (response.status === 401) {
          redirectToLogin()
          return
        }

        const data = await response.json().catch(() => ({}))

        if (!response.ok) {
          throw new Error(data?.error || 'Failed to load documents.')
        }

        if (cancelled) return

        setClientId(data.clientId || '')
        setDocuments(Array.isArray(data.documents) ? data.documents : [])
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Failed to load documents.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void initializeDocuments()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleUpload(event) {
    event.preventDefault()
    if (!file || !clientId) {
      setUploadError('Select a file before uploading.')
      return
    }

    setUploading(true)
    setUploadError('')

    try {
      const urlResponse = await fetch('/api/portal?action=upload-url', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          clientId,
          fileName: file.name,
          fileType: file.type,
          fileSize: file.size,
          category,
        }),
      })

      if (urlResponse.status === 401) {
        redirectToLogin()
        return
      }

      const urlData = await urlResponse.json().catch(() => ({}))

      if (!urlResponse.ok) {
        throw new Error(urlData?.error || 'Failed to prepare upload.')
      }

      const upload = urlData?.upload
      if (!upload?.path || !upload?.token) {
        throw new Error('Upload target is missing.')
      }

      const supabase = getSupabaseBrowser()
      const { error: signedUploadError } = await supabase.storage
        .from(STORAGE_BUCKET)
        .uploadToSignedUrl(upload.path, upload.token, file, {
          contentType: file.type || undefined,
          upsert: false,
        })

      if (signedUploadError) {
        throw signedUploadError
      }

      setFile(null)
      const fileInput = document.getElementById('portal-file-input')
      if (fileInput) fileInput.value = ''
      await loadDocuments({ showLoading: true })
    } catch (submitError) {
      setUploadError(submitError.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(documentId) {
    try {
      const response = await fetch('/api/portal?action=download-url', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      })

      if (response.status === 401) {
        redirectToLogin()
        return
      }

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Failed to create download link.')
      }

      window.open(data.downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (downloadError) {
      setError(downloadError.message || 'Failed to create download link.')
    }
  }

  async function handleLogout() {
    await fetch('/api/portal?action=logout', { method: 'POST' }).catch(() => {})
    redirectToLogin()
  }

  return (
    <div className="grid gap-8">
      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
          <div>
            <h2 className="font-serif text-3xl leading-tight text-slate-900">Documents</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-slate-700">
              Upload records for your Fidara team and access previously submitted files.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:text-slate-900"
          >
            Log out
          </button>
        </div>

        <form onSubmit={handleUpload} className="mt-8 grid gap-4 md:grid-cols-[minmax(0,200px)_minmax(0,1fr)_auto] md:items-end">
          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">Category</span>
            <select
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="min-h-12 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            >
              {CATEGORY_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <label className="grid gap-2">
            <span className="text-sm font-medium text-slate-800">File</span>
            <input
              id="portal-file-input"
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
              onChange={(event) => setFile(event.target.files?.[0] || null)}
              className="min-h-12 rounded-md border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 file:mr-4 file:rounded-md file:border-0 file:bg-stone-100 file:px-3 file:py-2 file:text-sm file:font-medium file:text-slate-700"
              required
            />
          </label>

          <button
            type="submit"
            disabled={uploading || loading}
            className="inline-flex min-h-12 items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </button>
        </form>

        {uploadError ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{uploadError}</p>
        ) : null}
        {error ? (
          <p className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}
      </section>

      <section className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
        <div className="flex items-center justify-between gap-4">
          <h2 className="font-serif text-2xl leading-tight text-slate-900">Uploaded files</h2>
          {!loading && clientId ? <span className="text-xs uppercase tracking-[0.2em] text-slate-500">Client {clientId}</span> : null}
        </div>

        {loading ? (
          <p className="mt-6 text-sm text-slate-600">Loading documents...</p>
        ) : hasDocuments ? (
          <div className="mt-6 overflow-x-auto">
            <table className="min-w-full border-separate border-spacing-y-3">
              <thead>
                <tr className="text-left text-xs uppercase tracking-[0.18em] text-slate-500">
                  <th className="pb-2 pr-4">Filename</th>
                  <th className="pb-2 pr-4">Category</th>
                  <th className="pb-2 pr-4">Status</th>
                  <th className="pb-2 pr-4">Uploaded</th>
                  <th className="pb-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {documents.map((document) => (
                  <tr key={document.id} className="rounded-lg bg-stone-50 text-sm text-slate-700">
                    <td className="rounded-l-lg px-4 py-4 font-medium text-slate-900">{document.original_file_name}</td>
                    <td className="px-4 py-4 capitalize">{document.category || 'general'}</td>
                    <td className="px-4 py-4 capitalize">{document.status}</td>
                    <td className="px-4 py-4">{new Date(document.created_at).toLocaleDateString()}</td>
                    <td className="rounded-r-lg px-4 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => handleDownload(document.id)}
                        className="inline-flex min-h-10 items-center justify-center rounded-md border border-stone-300 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:text-slate-900"
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="mt-6 text-sm leading-7 text-slate-600">No documents have been uploaded yet.</p>
        )}
      </section>
    </div>
  )
}
