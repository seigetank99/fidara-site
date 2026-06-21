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

function formatDate(value) {
  if (!value) return 'No activity yet'
  return new Date(value).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatCurrency(amountCents, currency = 'usd') {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: (currency || 'usd').toUpperCase(),
  }).format((amountCents || 0) / 100)
}

function formatFileSize(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) return 'Unknown size'
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function statusLabel(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'open') return 'Open'
  if (normalized === 'paid') return 'Paid'
  if (normalized === 'overdue') return 'Overdue'
  if (normalized === 'received') return 'Received'
  if (normalized === 'completed') return 'Completed'
  if (normalized === 'in_review') return 'In Review'
  if (!normalized) return 'Unknown'
  return normalized
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ')
}

function statusBadgeClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'paid' || normalized === 'completed') {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (normalized === 'overdue') {
    return 'border border-rose-200 bg-rose-50 text-rose-700'
  }
  if (normalized === 'open') {
    return 'border border-amber-200 bg-amber-50 text-amber-700'
  }
  return 'border border-slate-200 bg-slate-100 text-slate-700'
}

function parseErrorMessage(payload, fallback) {
  return payload?.error || fallback
}

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  if (response.status === 401) {
    return { unauthorized: true }
  }

  const data = await response.json().catch(() => ({}))
  return {
    unauthorized: false,
    ok: response.ok,
    data,
  }
}

function StatCard({ label, value, detail, loading }) {
  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm">
      <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{label}</div>
      <div className="mt-3 text-3xl font-semibold text-slate-900">{loading ? '...' : value}</div>
      <div className="mt-2 text-sm text-slate-600">{loading ? 'Loading data...' : detail}</div>
    </div>
  )
}

function SectionCard({ title, subtitle, actions, children }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
          {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
        </div>
        {actions}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function ClientPortalDashboard() {
  const [clientId, setClientId] = useState('')
  const [documents, setDocuments] = useState([])
  const [billingItems, setBillingItems] = useState([])
  const [requests, setRequests] = useState([])
  const [messages, setMessages] = useState([])
  const [summary, setSummary] = useState(null)
  const [category, setCategory] = useState('general')
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [billingLoading, setBillingLoading] = useState(true)
  const [requestsLoading, setRequestsLoading] = useState(true)
  const [messagesLoading, setMessagesLoading] = useState(true)
  const [pageError, setPageError] = useState('')
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  const hasDocuments = useMemo(() => documents.length > 0, [documents])
  const hasBilling = useMemo(() => billingItems.length > 0, [billingItems])
  const hasRequests = useMemo(() => requests.length > 0, [requests])
  const hasMessages = useMemo(() => messages.length > 0, [messages])

  function redirectToLogin() {
    window.location.assign('/login')
  }

  function assignClientId(nextClientId) {
    if (nextClientId) setClientId(nextClientId)
  }

  async function loadSummary() {
    setSummaryLoading(true)

    try {
      const result = await fetchJson('/api/portal-summary', {
        headers: { accept: 'application/json' },
      })

      if (result?.unauthorized) {
        redirectToLogin()
        return
      }

      if (!result?.ok) {
        throw new Error(parseErrorMessage(result?.data, 'Failed to load portal summary.'))
      }

      assignClientId(result.data.clientId)
      setSummary(result.data.stats || null)
    } catch (error) {
      setPageError(error.message || 'Failed to load portal summary.')
    } finally {
      setSummaryLoading(false)
    }
  }

  async function loadDocuments({ showLoading = false } = {}) {
    if (showLoading) setDocumentsLoading(true)

    try {
      const result = await fetchJson('/api/documents-list', {
        headers: { accept: 'application/json' },
      })

      if (result?.unauthorized) {
        redirectToLogin()
        return
      }

      if (!result?.ok) {
        throw new Error(parseErrorMessage(result?.data, 'Failed to load documents.'))
      }

      assignClientId(result.data.clientId)
      setDocuments(Array.isArray(result.data.documents) ? result.data.documents : [])
    } catch (error) {
      setPageError(error.message || 'Failed to load documents.')
    } finally {
      setDocumentsLoading(false)
    }
  }

  async function loadBilling() {
    setBillingLoading(true)

    try {
      const result = await fetchJson('/api/billing-list', {
        headers: { accept: 'application/json' },
      })

      if (result?.unauthorized) {
        redirectToLogin()
        return
      }

      if (!result?.ok) {
        throw new Error(parseErrorMessage(result?.data, 'Failed to load billing records.'))
      }

      assignClientId(result.data.clientId)
      setBillingItems(Array.isArray(result.data.billingItems) ? result.data.billingItems : [])
    } catch (error) {
      setPageError(error.message || 'Failed to load billing records.')
    } finally {
      setBillingLoading(false)
    }
  }

  async function loadRequests() {
    setRequestsLoading(true)

    try {
      const result = await fetchJson('/api/requests-list', {
        headers: { accept: 'application/json' },
      })

      if (result?.unauthorized) {
        redirectToLogin()
        return
      }

      if (!result?.ok) {
        throw new Error(parseErrorMessage(result?.data, 'Failed to load requested items.'))
      }

      assignClientId(result.data.clientId)
      setRequests(Array.isArray(result.data.requests) ? result.data.requests : [])
    } catch (error) {
      setPageError(error.message || 'Failed to load requested items.')
    } finally {
      setRequestsLoading(false)
    }
  }

  async function loadMessages() {
    setMessagesLoading(true)

    try {
      const result = await fetchJson('/api/messages-list', {
        headers: { accept: 'application/json' },
      })

      if (result?.unauthorized) {
        redirectToLogin()
        return
      }

      if (!result?.ok) {
        throw new Error(parseErrorMessage(result?.data, 'Failed to load updates.'))
      }

      assignClientId(result.data.clientId)
      setMessages(Array.isArray(result.data.messages) ? result.data.messages : [])
    } catch (error) {
      setPageError(error.message || 'Failed to load updates.')
    } finally {
      setMessagesLoading(false)
    }
  }

  useEffect(() => {
    void Promise.all([loadSummary(), loadDocuments(), loadBilling(), loadRequests(), loadMessages()])
  }, [])

  async function handleUpload(event) {
    event.preventDefault()
    if (!file || !clientId) {
      setUploadError('Select a file before uploading.')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    try {
      const result = await fetchJson('/api/documents-upload-url', {
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

      if (result?.unauthorized) {
        redirectToLogin()
        return
      }

      if (!result?.ok) {
        throw new Error(parseErrorMessage(result?.data, 'Failed to prepare upload.'))
      }

      const upload = result.data?.upload
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
        throw new Error('Upload failed. Please try again.')
      }

      setFile(null)
      setUploadSuccess('Document uploaded successfully.')
      const fileInput = document.getElementById('portal-file-input')
      if (fileInput) fileInput.value = ''
      await Promise.all([loadDocuments({ showLoading: true }), loadSummary()])
    } catch (error) {
      setUploadError(error.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  async function handleDownload(documentId) {
    try {
      const result = await fetchJson('/api/documents-download-url', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ documentId }),
      })

      if (result?.unauthorized) {
        redirectToLogin()
        return
      }

      if (!result?.ok) {
        throw new Error(parseErrorMessage(result?.data, 'Failed to create download link.'))
      }

      window.open(result.data.downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (error) {
      setPageError(error.message || 'Failed to create download link.')
    }
  }

  async function handleLogout() {
    await fetch('/api/logout', { method: 'POST' }).catch(() => {})
    redirectToLogin()
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-gradient-to-br from-white via-slate-50 to-stone-100 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex min-h-9 items-center rounded-full border border-emerald-200 bg-emerald-50 px-3 text-xs font-medium uppercase tracking-[0.18em] text-emerald-700">
              Secure client portal
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Fidara Group Client Portal</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Securely manage documents, billing, and accounting requests.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
            {clientId ? (
              <div className="inline-flex min-h-11 items-center rounded-xl border border-stone-200 bg-white px-4 text-sm font-medium text-slate-600 shadow-sm">
                Client ID: {clientId}
              </div>
            ) : null}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-stone-400 hover:text-slate-900"
            >
              Log out
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Documents Uploaded"
          value={summary?.documentsCount ?? 0}
          detail="Files received in your secure portal"
          loading={summaryLoading}
        />
        <StatCard
          label="Open Requests"
          value={summary?.openRequestsCount ?? 0}
          detail="Items your Fidara team is still waiting on"
          loading={summaryLoading}
        />
        <StatCard
          label="Outstanding Balance"
          value={formatCurrency(summary?.outstandingBalanceCents || 0)}
          detail={`${summary?.openInvoicesCount ?? 0} active invoice${summary?.openInvoicesCount === 1 ? '' : 's'}`}
          loading={summaryLoading}
        />
        <StatCard
          label="Last Upload"
          value={summaryLoading ? '...' : formatDate(summary?.lastUploadDate)}
          detail="Most recent document activity"
          loading={summaryLoading}
        />
      </section>

      {pageError ? (
        <p className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{pageError}</p>
      ) : null}

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1.7fr)_320px]">
        <div className="space-y-8">
          <SectionCard title="Upload a Document" subtitle="Accepted files: PDF, JPG, PNG, XLSX, DOCX. Max 25MB.">
            <form onSubmit={handleUpload} className="grid gap-5">
              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-800">Category</span>
                <select
                  value={category}
                  onChange={(event) => setCategory(event.target.value)}
                  className="min-h-12 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
                >
                  {CATEGORY_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <label
                htmlFor="portal-file-input"
                className="grid min-h-44 cursor-pointer place-items-center rounded-2xl border border-dashed border-stone-300 bg-slate-50 px-6 py-8 text-center transition hover:border-emerald-400 hover:bg-emerald-50/40"
              >
                <input
                  id="portal-file-input"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png,.xlsx,.docx"
                  onChange={(event) => {
                    setFile(event.target.files?.[0] || null)
                    setUploadError('')
                    setUploadSuccess('')
                  }}
                  className="sr-only"
                  required
                />

                <div>
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-stone-200 bg-white text-lg text-slate-500 shadow-sm">
                    +
                  </div>
                  <p className="mt-4 text-sm font-medium text-slate-900">
                    {file ? file.name : 'Choose a file to upload'}
                  </p>
                  <p className="mt-2 text-sm text-slate-500">
                    {file ? `${formatFileSize(file.size)} selected` : 'Drag a file here or browse from your device'}
                  </p>
                </div>
              </label>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="text-sm text-slate-500">
                  {file ? `Ready to upload ${file.name}` : 'Select a file to continue.'}
                </div>
                <button
                  type="submit"
                  disabled={uploading || documentsLoading || !clientId}
                  className="inline-flex min-h-12 items-center justify-center rounded-xl bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
                >
                  {uploading ? 'Uploading...' : 'Upload document'}
                </button>
              </div>
            </form>

            {uploadSuccess ? (
              <p className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">{uploadSuccess}</p>
            ) : null}
            {uploadError ? (
              <p className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{uploadError}</p>
            ) : null}
          </SectionCard>

          <SectionCard title="Recent Documents" subtitle="Download previously submitted files and track their current status.">
            {documentsLoading ? (
              <p className="text-sm text-slate-600">Loading documents...</p>
            ) : hasDocuments ? (
              <div className="space-y-3">
                {documents.map((document) => (
                  <div
                    key={document.id}
                    className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-slate-50 p-4 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-slate-900">{document.original_file_name}</p>
                      <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="rounded-full bg-white px-2.5 py-1 uppercase tracking-[0.12em] text-slate-600">
                          {document.category || 'general'}
                        </span>
                        <span>{formatDate(document.created_at)}</span>
                        <span>{formatFileSize(document.file_size)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(document.status)}`}>
                        {statusLabel(document.status)}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleDownload(document.id)}
                        className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:text-slate-900"
                      >
                        Download
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-600">No documents have been uploaded yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Billing" subtitle="View invoice status and pay through secure hosted billing pages when available.">
            {billingLoading ? (
              <p className="text-sm text-slate-600">Loading invoices...</p>
            ) : hasBilling ? (
              <div className="space-y-3">
                {billingItems.map((item) => (
                  <div
                    key={item.id}
                    className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-slate-50 p-4 md:flex-row md:items-center md:justify-between"
                  >
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-slate-900">{item.title}</p>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(item.status)}`}>
                          {statusLabel(item.status)}
                        </span>
                      </div>
                      {item.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{item.description}</p> : null}
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{formatCurrency(item.amount_cents, item.currency)}</span>
                        <span>Due {formatDate(item.due_date || item.created_at)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      {item.invoice_pdf_url ? (
                        <a
                          href={item.invoice_pdf_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:text-slate-900"
                        >
                          Download PDF
                        </a>
                      ) : null}
                      {item.stripe_hosted_invoice_url ? (
                        <a
                          href={item.stripe_hosted_invoice_url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex min-h-10 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
                        >
                          Pay Invoice
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-600">No invoices yet.</p>
            )}
          </SectionCard>

          <SectionCard title="Requested Items" subtitle="Track missing documents and other action items from your Fidara team.">
            {requestsLoading ? (
              <p className="text-sm text-slate-600">Loading requested items...</p>
            ) : hasRequests ? (
              <div className="space-y-3">
                {requests.map((request) => (
                  <div key={request.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{request.title}</p>
                          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(request.status)}`}>
                            {statusLabel(request.status)}
                          </span>
                        </div>
                        {request.description ? <p className="mt-2 text-sm leading-6 text-slate-600">{request.description}</p> : null}
                      </div>
                      <div className="text-xs uppercase tracking-[0.14em] text-slate-500">Due {formatDate(request.due_date || request.created_at)}</div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-600">No open requests.</p>
            )}
          </SectionCard>
        </div>

        <aside className="space-y-6">
          <SectionCard title="What to upload">
            <ul className="space-y-3 text-sm leading-6 text-slate-600">
              <li>Tax forms and notices</li>
              <li>Bank statements and reconciliations</li>
              <li>Payroll reports and provider exports</li>
              <li>Bookkeeping files and supporting schedules</li>
              <li>Entity formation and compliance documents</li>
            </ul>
          </SectionCard>

          <SectionCard title="Security note">
            <ul className="space-y-3 text-sm leading-6 text-slate-600">
              <li>Files are stored in private storage.</li>
              <li>Downloads use time-limited secure links.</li>
              <li>Payments are handled through hosted billing pages.</li>
            </ul>
          </SectionCard>

          <SectionCard title="Need help?">
            <p className="text-sm leading-6 text-slate-600">Questions about requested items, billing, or document delivery can go directly to Fidara Group.</p>
            <a
              href="/contact"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:text-slate-900"
            >
              Contact Fidara Group
            </a>
          </SectionCard>

          <SectionCard title="Recent updates">
            {messagesLoading ? (
              <p className="text-sm text-slate-600">Loading updates...</p>
            ) : hasMessages ? (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="text-sm font-medium text-slate-900">{message.title}</p>
                      <span className="text-xs text-slate-500">{formatDate(message.created_at)}</span>
                    </div>
                    <p className="mt-2 text-sm leading-6 text-slate-600">{message.body}</p>
                    <p className="mt-3 text-xs uppercase tracking-[0.14em] text-slate-500">{message.created_by || 'Fidara Group'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm leading-7 text-slate-600">No messages yet.</p>
            )}
          </SectionCard>
        </aside>
      </div>
    </div>
  )
}
