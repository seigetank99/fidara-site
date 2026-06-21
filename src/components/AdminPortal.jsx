import { useEffect, useMemo, useState } from 'react'

function formatDate(value) {
  if (!value) return 'No date'
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

async function fetchJson(url, options) {
  const response = await fetch(url, options)
  if (response.status === 401) return { unauthorized: true }
  if (response.status === 403) return { forbidden: true }

  const data = await response.json().catch(() => ({}))
  return { unauthorized: false, forbidden: false, ok: response.ok, data }
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

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="rounded-2xl border border-stone-200 bg-white p-6 shadow-sm sm:p-7">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm leading-6 text-slate-600">{subtitle}</p> : null}
      </div>
      <div className="mt-6">{children}</div>
    </section>
  )
}

export default function AdminPortal() {
  const [summary, setSummary] = useState(null)
  const [documents, setDocuments] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [summaryLoading, setSummaryLoading] = useState(true)
  const [documentsLoading, setDocumentsLoading] = useState(true)
  const [error, setError] = useState('')
  const [forbidden, setForbidden] = useState(false)

  const hasDocuments = useMemo(() => documents.length > 0, [documents])

  function redirectToLogin() {
    window.location.assign('/login')
  }

  useEffect(() => {
    let cancelled = false

    async function loadAdmin() {
      setError('')
      try {
        const [summaryResult, documentsResult] = await Promise.all([
          fetchJson('/api/admin?action=summary', { headers: { accept: 'application/json' } }),
          fetchJson('/api/admin?action=documents', { headers: { accept: 'application/json' } }),
        ])

        if (summaryResult?.unauthorized || documentsResult?.unauthorized) {
          redirectToLogin()
          return
        }

        if (summaryResult?.forbidden || documentsResult?.forbidden) {
          if (!cancelled) setForbidden(true)
          return
        }

        if (!summaryResult?.ok || !documentsResult?.ok) {
          throw new Error('Unable to load the admin dashboard right now.')
        }

        if (!cancelled) {
          setSummary(summaryResult.data?.stats || null)
          setRecentActivity(Array.isArray(summaryResult.data?.recentActivity) ? summaryResult.data.recentActivity : [])
          setDocuments(Array.isArray(documentsResult.data?.documents) ? documentsResult.data.documents : [])
        }
      } catch (loadError) {
        if (!cancelled) {
          setError(loadError.message || 'Unable to load the admin dashboard right now.')
        }
      } finally {
        if (!cancelled) {
          setSummaryLoading(false)
          setDocumentsLoading(false)
        }
      }
    }

    void loadAdmin()

    return () => {
      cancelled = true
    }
  }, [])

  async function handleLogout() {
    await fetch('/api/portal?action=logout', { method: 'POST' }).catch(() => {})
    redirectToLogin()
  }

  async function handleDownload(documentId) {
    try {
      const result = await fetchJson('/api/admin?action=download-url', {
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

      if (result?.forbidden) {
        setForbidden(true)
        return
      }

      if (!result?.ok) {
        throw new Error('Download is not available right now.')
      }

      window.open(result.data.downloadUrl, '_blank', 'noopener,noreferrer')
    } catch (downloadError) {
      setError(downloadError.message || 'Download is not available right now.')
    }
  }

  if (forbidden) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 px-5 py-6 text-sm text-amber-800 shadow-sm">
        This account does not have admin access.
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[28px] border border-stone-200 bg-gradient-to-br from-white via-slate-50 to-stone-100 p-6 shadow-sm sm:p-8">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="inline-flex min-h-9 items-center rounded-full border border-slate-200 bg-white px-3 text-xs font-medium uppercase tracking-[0.18em] text-slate-700">
              Admin dashboard
            </div>
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Fidara firm operations</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Review client document flow, open requests, and outstanding billing from one dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-stone-400 hover:text-slate-900"
          >
            Log out
          </button>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <StatCard label="Clients" value={summary?.clientsCount ?? 0} detail="Active linked client accounts" loading={summaryLoading} />
        <StatCard label="Documents" value={summary?.documentsCount ?? 0} detail="Secure records in storage" loading={summaryLoading} />
        <StatCard label="Open Requests" value={summary?.openRequestsCount ?? 0} detail="Outstanding client follow-ups" loading={summaryLoading} />
        <StatCard label="Outstanding Balance" value={formatCurrency(summary?.outstandingBalanceCents || 0)} detail="Across hosted invoice records" loading={summaryLoading} />
      </section>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          We hit a problem loading part of the admin dashboard. Refresh and try again.
        </div>
      ) : null}

      <SectionCard title="Recent client documents" subtitle="Latest files across all clients. Downloads still use time-limited secure links.">
        {documentsLoading ? (
          <p className="text-sm text-slate-600">Loading recent client documents...</p>
        ) : hasDocuments ? (
          <div className="space-y-3">
            {documents.map((document) => (
              <div key={document.id} className="flex flex-col gap-4 rounded-2xl border border-stone-200 bg-slate-50 p-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-slate-900">{document.original_file_name}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>{document.clients?.business_name || document.clients?.name || 'Unknown client'}</span>
                    <span>{document.category || 'general'}</span>
                    <span>{formatDate(document.created_at)}</span>
                    <span>{formatFileSize(document.file_size)}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => handleDownload(document.id)}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:text-slate-900"
                >
                  Download
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-900">No documents found</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Client uploads will appear here as soon as new records enter the portal.</p>
          </div>
        )}
      </SectionCard>

      <SectionCard title="Recent activity" subtitle="Latest audit events across the portal.">
        {summaryLoading ? (
          <p className="text-sm text-slate-600">Loading recent activity...</p>
        ) : recentActivity.length ? (
          <div className="space-y-3">
            {recentActivity.map((event) => (
              <div key={event.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-medium text-slate-900">{event.description}</p>
                  <span className="text-xs uppercase tracking-[0.14em] text-slate-500">{formatDate(event.created_at)}</span>
                </div>
                <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">{event.event_type}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-stone-300 bg-slate-50 px-5 py-8 text-center">
            <p className="text-sm font-medium text-slate-900">No recent activity</p>
            <p className="mt-2 text-sm leading-6 text-slate-600">Audit events will appear here as clients upload or download documents.</p>
          </div>
        )}
      </SectionCard>
    </div>
  )
}
