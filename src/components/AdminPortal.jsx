import { useCallback, useEffect, useMemo, useState } from 'react'

const DOCUMENT_STATUSES = ['received', 'reviewing', 'completed']
const BILLING_STATUSES = ['open', 'paid', 'overdue']
const REQUEST_STATUSES = ['open', 'completed', 'closed']
const TABS = ['Overview', 'Clients', 'Documents', 'Requests', 'Billing', 'Messages', 'Audit']

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

function statusBadgeClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized === 'completed' || normalized === 'paid' || normalized === 'closed') {
    return 'border border-emerald-200 bg-emerald-50 text-emerald-700'
  }
  if (normalized === 'overdue') {
    return 'border border-rose-200 bg-rose-50 text-rose-700'
  }
  if (normalized === 'reviewing' || normalized === 'open') {
    return 'border border-amber-200 bg-amber-50 text-amber-700'
  }
  return 'border border-slate-200 bg-slate-100 text-slate-700'
}

function statusLabel(status) {
  const normalized = String(status || '').toLowerCase()
  if (!normalized) return 'Unknown'
  return normalized.charAt(0).toUpperCase() + normalized.slice(1)
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

function SectionCard({ title, subtitle, children, actions }) {
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

function Field({ label, children }) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-slate-800">{label}</span>
      {children}
    </label>
  )
}

function EmptyState({ title, body }) {
  return (
    <div className="rounded-2xl border border-dashed border-stone-300 bg-slate-50 px-5 py-8 text-center">
      <p className="text-sm font-medium text-slate-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  )
}

function FormNotice({ kind, message }) {
  if (!message) return null
  const className =
    kind === 'error'
      ? 'border border-rose-200 bg-rose-50 text-rose-700'
      : 'border border-emerald-200 bg-emerald-50 text-emerald-700'

  return <p className={`rounded-xl px-4 py-3 text-sm ${className}`}>{message}</p>
}

function TextInput(props) {
  return (
    <input
      {...props}
      className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    />
  )
}

function TextArea(props) {
  return (
    <textarea
      {...props}
      className="min-h-24 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    />
  )
}

function Select(props) {
  return (
    <select
      {...props}
      className="min-h-11 rounded-xl border border-stone-300 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
    />
  )
}

function PrimaryButton({ children, variant = 'emerald', ...props }) {
  const styles =
    variant === 'danger'
      ? 'bg-rose-600 text-white hover:bg-rose-700 disabled:bg-rose-400'
      : variant === 'dark'
        ? 'bg-slate-900 text-white hover:bg-slate-800 disabled:bg-slate-400'
        : 'bg-emerald-600 text-white hover:bg-emerald-700 disabled:bg-emerald-400'

  return (
    <button
      {...props}
      className={`inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed ${styles}`}
    >
      {children}
    </button>
  )
}

function SecondaryButton({ children, ...props }) {
  return (
    <button
      {...props}
      className="inline-flex min-h-10 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-stone-400 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {children}
    </button>
  )
}

export default function AdminPortal() {
  const [activeTab, setActiveTab] = useState('Overview')
  const [summary, setSummary] = useState(null)
  const [documents, setDocuments] = useState([])
  const [requests, setRequests] = useState([])
  const [billingItems, setBillingItems] = useState([])
  const [messages, setMessages] = useState([])
  const [recentActivity, setRecentActivity] = useState([])
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState('')
  const [forbidden, setForbidden] = useState(false)
  const [documentFilter, setDocumentFilter] = useState('active')
  const [createClientForm, setCreateClientForm] = useState({ name: '', businessName: '' })
  const [linkUserForm, setLinkUserForm] = useState({ clientId: '', email: '', fullName: '' })
  const [requestForm, setRequestForm] = useState({ clientId: '', title: '', description: '', dueDate: '' })
  const [billingForm, setBillingForm] = useState({
    clientId: '',
    title: '',
    description: '',
    amountDollars: '',
    status: 'open',
    dueDate: '',
    stripeHostedInvoiceUrl: '',
    invoicePdfUrl: '',
  })
  const [messageForm, setMessageForm] = useState({ clientId: '', title: '', body: '' })
  const [requestEdits, setRequestEdits] = useState({})
  const [billingEdits, setBillingEdits] = useState({})
  const [busyAction, setBusyAction] = useState('')
  const [notice, setNotice] = useState({ kind: '', message: '' })

  const hasClients = useMemo(() => clients.length > 0, [clients])

  const redirectToStaffLogin = useCallback(() => {
    window.location.assign('/staff-login')
  }, [])

  function clearNotice() {
    setNotice({ kind: '', message: '' })
  }

  function clientOptions() {
    return clients.map((client) => (
      <option key={client.id} value={client.id}>
        {client.business_name || client.name}
      </option>
    ))
  }

  async function submitAdminAction(action, body) {
    const result = await fetchJson(`/api/admin?action=${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (result?.unauthorized) {
      redirectToStaffLogin()
      return null
    }

    if (result?.forbidden) {
      setForbidden(true)
      return null
    }

    if (!result?.ok) {
      throw new Error(result?.data?.error || 'Admin action failed.')
    }

    return result.data
  }

  const loadAdmin = useCallback(async (nextFilter = documentFilter) => {
    setError('')
    const [summaryResult, documentsResult, clientsResult, requestsResult, billingResult, messagesResult] = await Promise.all([
      fetchJson('/api/admin?action=summary', { headers: { accept: 'application/json' } }),
      fetchJson(`/api/admin?action=documents&filter=${encodeURIComponent(nextFilter)}`, { headers: { accept: 'application/json' } }),
      fetchJson('/api/admin?action=clients', { headers: { accept: 'application/json' } }),
      fetchJson('/api/admin?action=requests', { headers: { accept: 'application/json' } }),
      fetchJson('/api/admin?action=billing', { headers: { accept: 'application/json' } }),
      fetchJson('/api/admin?action=messages', { headers: { accept: 'application/json' } }),
    ])

    const results = [summaryResult, documentsResult, clientsResult, requestsResult, billingResult, messagesResult]
    if (results.some((result) => result?.unauthorized)) {
      redirectToStaffLogin()
      return
    }

    if (results.some((result) => result?.forbidden)) {
      setForbidden(true)
      return
    }

    if (results.some((result) => !result?.ok)) {
      throw new Error('Unable to load the admin dashboard right now.')
    }

    setSummary(summaryResult.data?.stats || null)
    setRecentActivity(Array.isArray(summaryResult.data?.recentActivity) ? summaryResult.data.recentActivity : [])
    setDocuments(Array.isArray(documentsResult.data?.documents) ? documentsResult.data.documents : [])
    setClients(Array.isArray(clientsResult.data?.clients) ? clientsResult.data.clients : [])
    setRequests(Array.isArray(requestsResult.data?.requests) ? requestsResult.data.requests : [])
    setBillingItems(Array.isArray(billingResult.data?.billingItems) ? billingResult.data.billingItems : [])
    setMessages(Array.isArray(messagesResult.data?.messages) ? messagesResult.data.messages : [])
    setVerified(true)
  }, [documentFilter, redirectToStaffLogin])

  useEffect(() => {
    let cancelled = false

    async function initialize() {
      try {
        await loadAdmin()
      } catch (loadError) {
        if (!cancelled) setError(loadError.message || 'Unable to load the admin dashboard right now.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void initialize()
    return () => {
      cancelled = true
    }
  }, [loadAdmin])

  useEffect(() => {
    if (!verified) return

    async function reloadDocuments() {
      try {
        const result = await fetchJson(`/api/admin?action=documents&filter=${encodeURIComponent(documentFilter)}`, {
          headers: { accept: 'application/json' },
        })
        if (result?.unauthorized) return redirectToStaffLogin()
        if (result?.forbidden) return setForbidden(true)
        if (!result?.ok) throw new Error('Unable to load documents.')
        setDocuments(Array.isArray(result.data?.documents) ? result.data.documents : [])
      } catch (loadError) {
        setError(loadError.message || 'Unable to load documents.')
      }
    }

    void reloadDocuments()
  }, [documentFilter, redirectToStaffLogin, verified])

  async function refreshAdminData() {
    try {
      await loadAdmin(documentFilter)
    } catch (refreshError) {
      setError(refreshError.message || 'Unable to refresh the admin dashboard right now.')
    }
  }

  async function handleLogout() {
    await fetch('/api/portal?action=logout', { method: 'POST' }).catch(() => {})
    redirectToStaffLogin()
  }

  async function withBusy(action, fn) {
    setBusyAction(action)
    clearNotice()
    try {
      await fn()
    } catch (submitError) {
      setNotice({ kind: 'error', message: submitError.message || 'Action failed.' })
    } finally {
      setBusyAction('')
    }
  }

  async function handleDownload(documentId) {
    await withBusy(`download-${documentId}`, async () => {
      const result = await submitAdminAction('download-url', { documentId })
      if (!result) return
      window.open(result.downloadUrl, '_blank', 'noopener,noreferrer')
      await refreshAdminData()
    })
  }

  async function handleCreateClient(event) {
    event.preventDefault()
    await withBusy('create-client', async () => {
      const result = await submitAdminAction('create-client', createClientForm)
      if (!result) return
      setCreateClientForm({ name: '', businessName: '' })
      setNotice({ kind: 'success', message: 'Client created successfully.' })
      await refreshAdminData()
    })
  }

  async function handleInviteUser(event) {
    event.preventDefault()
    await withBusy('invite-client-user', async () => {
      const result = await submitAdminAction('invite-client-user', linkUserForm)
      if (!result) return
      setLinkUserForm({ clientId: '', email: '', fullName: '' })
      setNotice({ kind: 'success', message: result.message || 'Client user invited or linked successfully.' })
      await refreshAdminData()
    })
  }

  async function handleCreateRequest(event) {
    event.preventDefault()
    await withBusy('create-request', async () => {
      const result = await submitAdminAction('create-request', requestForm)
      if (!result) return
      setRequestForm({ clientId: '', title: '', description: '', dueDate: '' })
      setNotice({ kind: 'success', message: 'Document request added to the portal.' })
      await refreshAdminData()
    })
  }

  async function handleCreateBillingItem(event) {
    event.preventDefault()
    await withBusy('create-billing-item', async () => {
      const amountDollars = Number(billingForm.amountDollars || 0)
      const amountCents = Number.isFinite(amountDollars) ? Math.round(amountDollars * 100) : null
      const result = await submitAdminAction('create-billing-item', {
        ...billingForm,
        amountCents,
        currency: 'usd',
      })
      if (!result) return
      setBillingForm({
        clientId: '',
        title: '',
        description: '',
        amountDollars: '',
        status: 'open',
        dueDate: '',
        stripeHostedInvoiceUrl: '',
        invoicePdfUrl: '',
      })
      setNotice({ kind: 'success', message: 'Billing item created successfully.' })
      await refreshAdminData()
    })
  }

  async function handleCreateMessage(event) {
    event.preventDefault()
    await withBusy('create-message', async () => {
      const result = await submitAdminAction('create-message', messageForm)
      if (!result) return
      setMessageForm({ clientId: '', title: '', body: '' })
      setNotice({ kind: 'success', message: 'Portal message sent successfully.' })
      await refreshAdminData()
    })
  }

  async function handleUpdateDocumentStatus(documentId, status) {
    await withBusy(`document-${documentId}-${status}`, async () => {
      const result = await submitAdminAction('update-document-status', { documentId, status })
      if (!result) return
      setNotice({ kind: 'success', message: `Document marked as ${status}.` })
      await refreshAdminData()
    })
  }

  async function handleArchiveDocument(documentId) {
    await withBusy(`archive-document-${documentId}`, async () => {
      const result = await submitAdminAction('archive-document', { documentId })
      if (!result) return
      setNotice({ kind: 'success', message: 'Document archived.' })
      await refreshAdminData()
    })
  }

  async function handleDeleteDocument(documentId) {
    if (!window.confirm('Delete this file from Supabase Storage? This keeps the audit record but removes the physical file.')) return
    await withBusy(`delete-document-${documentId}`, async () => {
      const result = await submitAdminAction('delete-document', { documentId, confirm: true })
      if (!result) return
      setNotice({ kind: 'success', message: 'Document file deleted and record marked deleted.' })
      await refreshAdminData()
    })
  }

  function getRequestEdit(request) {
    return requestEdits[request.id] || {
      title: request.title || '',
      description: request.description || '',
      status: request.status || 'open',
      dueDate: request.due_date || '',
    }
  }

  function setRequestEdit(id, patch) {
    const request = requests.find((item) => item.id === id)
    const base = request
      ? {
          title: request.title || '',
          description: request.description || '',
          status: request.status || 'open',
          dueDate: request.due_date || '',
        }
      : {}
    setRequestEdits((current) => ({ ...current, [id]: { ...(current[id] || base), ...patch } }))
  }

  async function handleUpdateRequest(request) {
    const edit = getRequestEdit(request)
    await withBusy(`update-request-${request.id}`, async () => {
      const result = await submitAdminAction('update-request', { id: request.id, ...edit })
      if (!result) return
      setNotice({ kind: 'success', message: 'Request updated.' })
      setRequestEdits((current) => {
        const next = { ...current }
        delete next[request.id]
        return next
      })
      await refreshAdminData()
    })
  }

  function getBillingEdit(item) {
    return billingEdits[item.id] || {
      title: item.title || '',
      description: item.description || '',
      amountDollars: ((item.amount_cents || 0) / 100).toFixed(2),
      status: item.status || 'open',
      dueDate: item.due_date || '',
      stripeHostedInvoiceUrl: item.stripe_hosted_invoice_url || '',
      invoicePdfUrl: item.invoice_pdf_url || '',
    }
  }

  function setBillingEdit(id, patch) {
    const item = billingItems.find((entry) => entry.id === id)
    const base = item
      ? {
          title: item.title || '',
          description: item.description || '',
          amountDollars: ((item.amount_cents || 0) / 100).toFixed(2),
          status: item.status || 'open',
          dueDate: item.due_date || '',
          stripeHostedInvoiceUrl: item.stripe_hosted_invoice_url || '',
          invoicePdfUrl: item.invoice_pdf_url || '',
        }
      : {}
    setBillingEdits((current) => ({ ...current, [id]: { ...(current[id] || base), ...patch } }))
  }

  async function handleUpdateBillingItem(item) {
    const edit = getBillingEdit(item)
    const amountDollars = Number(edit.amountDollars || 0)
    await withBusy(`update-billing-${item.id}`, async () => {
      const result = await submitAdminAction('update-billing-item', {
        id: item.id,
        ...edit,
        amountCents: Number.isFinite(amountDollars) ? Math.round(amountDollars * 100) : null,
        currency: item.currency || 'usd',
      })
      if (!result) return
      setNotice({ kind: 'success', message: 'Billing item updated.' })
      setBillingEdits((current) => {
        const next = { ...current }
        delete next[item.id]
        return next
      })
      await refreshAdminData()
    })
  }

  async function handleArchiveMessage(messageId) {
    await withBusy(`archive-message-${messageId}`, async () => {
      const result = await submitAdminAction('archive-message', { id: messageId })
      if (!result) return
      setNotice({ kind: 'success', message: 'Message archived.' })
      await refreshAdminData()
    })
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-amber-200 bg-amber-50 px-6 py-8 text-center shadow-sm">
        <h1 className="text-2xl font-semibold text-amber-950">Access denied</h1>
        <p className="mt-3 text-sm leading-6 text-amber-800">This account does not have staff access.</p>
        <a
          href="/staff-login"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
        >
          Back to staff login
        </a>
      </div>
    )
  }

  if (!verified) {
    if (error) {
      return (
        <div className="mx-auto max-w-xl rounded-2xl border border-rose-200 bg-rose-50 px-6 py-8 text-center shadow-sm">
          <h1 className="text-2xl font-semibold text-rose-950">Unable to verify staff access</h1>
          <p className="mt-3 text-sm leading-6 text-rose-700">Please try signing in again from the staff login page.</p>
          <a
            href="/staff-login"
            className="mt-5 inline-flex min-h-11 items-center justify-center rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800"
          >
            Back to staff login
          </a>
        </div>
      )
    }

    return (
      <div className="mx-auto max-w-xl rounded-2xl border border-stone-200 bg-white px-6 py-8 text-center shadow-sm">
        <p className="text-sm font-medium text-slate-900">Verifying staff access...</p>
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
            <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">Fidara Admin Portal</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-600 sm:text-base">
              Manage clients, documents, billing, requests, messages, and audit activity from one operations dashboard.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a
              href="/portal"
              className="inline-flex min-h-11 items-center justify-center rounded-xl border border-stone-300 bg-white px-4 text-sm font-medium text-slate-700 shadow-sm transition hover:border-stone-400 hover:text-slate-900"
            >
              Back to client portal
            </a>
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
        <StatCard label="Total Clients" value={summary?.clientsCount ?? 0} detail="Managed client accounts" loading={loading} />
        <StatCard label="Active Documents" value={summary?.documentsCount ?? 0} detail="Files stored in the portal" loading={loading} />
        <StatCard label="Open Requests" value={summary?.openRequestsCount ?? 0} detail="Client follow-ups still outstanding" loading={loading} />
        <StatCard label="Outstanding Balance" value={formatCurrency(summary?.outstandingBalanceCents || 0)} detail={`${summary?.openInvoicesCount ?? 0} open invoice${summary?.openInvoicesCount === 1 ? '' : 's'}`} loading={loading} />
      </section>

      <div className="flex gap-2 overflow-x-auto rounded-2xl border border-stone-200 bg-white p-2 shadow-sm">
        {TABS.map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setActiveTab(tab)}
            className={`min-h-10 rounded-xl px-4 text-sm font-medium transition ${
              activeTab === tab ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {error ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          We hit a problem loading part of the admin dashboard. Refresh and try again.
        </div>
      ) : null}

      <FormNotice kind={notice.kind} message={notice.message} />

      {activeTab === 'Overview' ? (
        <div className="grid gap-8 xl:grid-cols-[minmax(0,1.4fr)_420px]">
          <SectionCard title="Recent Documents" subtitle="Latest active client uploads across the portal.">
            {loading ? (
              <p className="text-sm text-slate-600">Loading recent client documents...</p>
            ) : documents.length ? (
              <div className="space-y-3">
                {documents.slice(0, 6).map((document) => (
                  <div key={document.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                    <p className="truncate text-sm font-medium text-slate-900">{document.original_file_name}</p>
                    <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                      <span>{document.client_name}</span>
                      <span>{formatDate(document.created_at)}</span>
                      <span className={`rounded-full px-2.5 py-1 ${statusBadgeClass(document.status)}`}>{statusLabel(document.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No active documents found" body="Client uploads will appear here as soon as records start coming into the portal." />
            )}
          </SectionCard>

          <SectionCard title="Recent Activity" subtitle="Latest admin and client actions captured in the audit log.">
            {loading ? (
              <p className="text-sm text-slate-600">Loading recent activity...</p>
            ) : recentActivity.length ? (
              <div className="space-y-3">
                {recentActivity.map((event) => (
                  <div key={event.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <p className="text-sm font-medium text-slate-900">{event.description}</p>
                      <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{formatDate(event.created_at)}</span>
                    </div>
                    <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">{event.event_type}</p>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No recent activity" body="Audit events will appear here as admins and clients interact with the portal." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {activeTab === 'Clients' ? (
        <SectionCard title="Clients" subtitle="Create client accounts and invite or link Supabase Auth users to portal access.">
          {loading ? (
            <p className="text-sm text-slate-600">Loading clients...</p>
          ) : (
            <div className="space-y-6">
              {hasClients ? (
                <div className="space-y-3">
                  {clients.map((client) => (
                    <div key={client.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                      <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{client.business_name || client.name}</p>
                          <p className="mt-1 text-sm text-slate-600">{client.name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">Created {formatDate(client.created_at)}</p>
                        </div>
                        <div className="text-sm text-slate-600">
                          {client.linked_users?.length ? `${client.linked_users.length} linked user${client.linked_users.length === 1 ? '' : 's'}` : 'No linked users'}
                        </div>
                      </div>
                      {client.linked_users?.length ? (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {client.linked_users.map((linkedUser) => (
                            <span key={`${client.id}-${linkedUser.user_id}`} className="rounded-full border border-stone-200 bg-white px-3 py-1 text-xs text-slate-600">
                              {linkedUser.full_name || linkedUser.email}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState title="No clients yet" body="Create your first client below, then invite or link a user to portal access." />
              )}

              <div className="grid gap-6 lg:grid-cols-2">
                <form onSubmit={handleCreateClient} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Create client</h3>
                  <Field label="Name">
                    <TextInput value={createClientForm.name} onChange={(event) => setCreateClientForm((current) => ({ ...current, name: event.target.value }))} required />
                  </Field>
                  <Field label="Business name">
                    <TextInput value={createClientForm.businessName} onChange={(event) => setCreateClientForm((current) => ({ ...current, businessName: event.target.value }))} />
                  </Field>
                  <PrimaryButton type="submit" disabled={busyAction === 'create-client'}>
                    {busyAction === 'create-client' ? 'Creating...' : 'Create client'}
                  </PrimaryButton>
                </form>

                <form onSubmit={handleInviteUser} className="grid gap-4 rounded-2xl border border-stone-200 bg-white p-5">
                  <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-600">Invite / Link Client User</h3>
                  <Field label="Client">
                    <Select value={linkUserForm.clientId} onChange={(event) => setLinkUserForm((current) => ({ ...current, clientId: event.target.value }))} required>
                      <option value="">Select client</option>
                      {clientOptions()}
                    </Select>
                  </Field>
                  <Field label="Email">
                    <TextInput type="email" value={linkUserForm.email} onChange={(event) => setLinkUserForm((current) => ({ ...current, email: event.target.value }))} required />
                  </Field>
                  <Field label="Full name">
                    <TextInput value={linkUserForm.fullName} onChange={(event) => setLinkUserForm((current) => ({ ...current, fullName: event.target.value }))} />
                  </Field>
                  <PrimaryButton type="submit" variant="dark" disabled={busyAction === 'invite-client-user'}>
                    {busyAction === 'invite-client-user' ? 'Sending...' : 'Invite / link user'}
                  </PrimaryButton>
                </form>
              </div>
            </div>
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'Documents' ? (
        <SectionCard
          title="Documents"
          subtitle="Review client uploads, download secure copies, update status, archive records, or delete physical files when required."
          actions={
            <Select value={documentFilter} onChange={(event) => setDocumentFilter(event.target.value)}>
              <option value="active">Active</option>
              <option value="archived">Archived</option>
              <option value="all">All</option>
            </Select>
          }
        >
          {loading ? (
            <p className="text-sm text-slate-600">Loading documents...</p>
          ) : documents.length ? (
            <div className="space-y-3">
              {documents.map((document) => (
                <div key={document.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="truncate text-sm font-medium text-slate-900">{document.original_file_name}</p>
                        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(document.status)}`}>{statusLabel(document.status)}</span>
                        {document.archived_at ? <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">Archived</span> : null}
                        {document.deleted_at ? <span className="rounded-full border border-rose-200 bg-rose-50 px-3 py-1 text-xs text-rose-700">Deleted</span> : null}
                      </div>
                      <div className="mt-2 flex flex-wrap gap-3 text-xs text-slate-500">
                        <span>{document.client_name}</span>
                        <span>{document.category || 'general'}</span>
                        <span>{formatDate(document.created_at)}</span>
                        <span>{formatFileSize(document.file_size)}</span>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {DOCUMENT_STATUSES.map((status) => (
                        <SecondaryButton
                          key={status}
                          type="button"
                          onClick={() => handleUpdateDocumentStatus(document.id, status)}
                          disabled={busyAction === `document-${document.id}-${status}` || document.status === status || Boolean(document.deleted_at)}
                        >
                          {busyAction === `document-${document.id}-${status}` ? 'Saving...' : status}
                        </SecondaryButton>
                      ))}
                      <PrimaryButton type="button" variant="dark" onClick={() => handleDownload(document.id)} disabled={Boolean(document.deleted_at)}>
                        Download
                      </PrimaryButton>
                      {!document.archived_at && !document.deleted_at ? (
                        <SecondaryButton type="button" onClick={() => handleArchiveDocument(document.id)} disabled={busyAction === `archive-document-${document.id}`}>
                          {busyAction === `archive-document-${document.id}` ? 'Archiving...' : 'Archive'}
                        </SecondaryButton>
                      ) : null}
                      {!document.deleted_at ? (
                        <PrimaryButton type="button" variant="danger" onClick={() => handleDeleteDocument(document.id)} disabled={busyAction === `delete-document-${document.id}`}>
                          {busyAction === `delete-document-${document.id}` ? 'Deleting...' : 'Delete file'}
                        </PrimaryButton>
                      ) : null}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No documents found" body="Change the filter or wait for client uploads to appear." />
          )}
        </SectionCard>
      ) : null}

      {activeTab === 'Requests' ? (
        <div className="space-y-8">
          <SectionCard title="Create Request" subtitle="Add a new missing-item request that clients will see immediately in their portal.">
            <form onSubmit={handleCreateRequest} className="grid gap-4 lg:grid-cols-2">
              <Field label="Client">
                <Select value={requestForm.clientId} onChange={(event) => setRequestForm((current) => ({ ...current, clientId: event.target.value }))} required>
                  <option value="">Select client</option>
                  {clientOptions()}
                </Select>
              </Field>
              <Field label="Due date">
                <TextInput type="date" value={requestForm.dueDate} onChange={(event) => setRequestForm((current) => ({ ...current, dueDate: event.target.value }))} />
              </Field>
              <div className="lg:col-span-2">
                <Field label="Request title">
                  <TextInput value={requestForm.title} onChange={(event) => setRequestForm((current) => ({ ...current, title: event.target.value }))} required />
                </Field>
              </div>
              <div className="lg:col-span-2">
                <Field label="Description">
                  <TextArea value={requestForm.description} onChange={(event) => setRequestForm((current) => ({ ...current, description: event.target.value }))} />
                </Field>
              </div>
              <div className="lg:col-span-2">
                <PrimaryButton type="submit" disabled={busyAction === 'create-request'}>{busyAction === 'create-request' ? 'Saving...' : 'Create request'}</PrimaryButton>
              </div>
            </form>
          </SectionCard>

          <SectionCard title="Requests" subtitle="Edit, complete, or close client requests.">
            {requests.length ? (
              <div className="space-y-4">
                {requests.map((request) => {
                  const edit = getRequestEdit(request)
                  return (
                    <div key={request.id} className="grid gap-4 rounded-2xl border border-stone-200 bg-slate-50 p-4 lg:grid-cols-2">
                      <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{request.client_name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">Created {formatDate(request.created_at)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(request.status)}`}>{statusLabel(request.status)}</span>
                      </div>
                      <Field label="Title">
                        <TextInput value={edit.title} onChange={(event) => setRequestEdit(request.id, { title: event.target.value })} />
                      </Field>
                      <Field label="Status">
                        <Select value={edit.status} onChange={(event) => setRequestEdit(request.id, { status: event.target.value })}>
                          {REQUEST_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </Select>
                      </Field>
                      <Field label="Due date">
                        <TextInput type="date" value={edit.dueDate} onChange={(event) => setRequestEdit(request.id, { dueDate: event.target.value })} />
                      </Field>
                      <div className="lg:col-span-2">
                        <Field label="Description">
                          <TextArea value={edit.description} onChange={(event) => setRequestEdit(request.id, { description: event.target.value })} />
                        </Field>
                      </div>
                      <div className="lg:col-span-2">
                        <PrimaryButton type="button" variant="dark" onClick={() => handleUpdateRequest(request)} disabled={busyAction === `update-request-${request.id}`}>
                          {busyAction === `update-request-${request.id}` ? 'Saving...' : 'Save request'}
                        </PrimaryButton>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState title="No requests found" body="Create a request when Fidara needs follow-up documents or client information." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {activeTab === 'Billing' ? (
        <div className="space-y-8">
          <SectionCard title="Create Billing Item" subtitle="Store invoice records and hosted Stripe invoice URLs. No card handling happens inside the portal.">
            <form onSubmit={handleCreateBillingItem} className="grid gap-4 lg:grid-cols-2">
              <Field label="Client">
                <Select value={billingForm.clientId} onChange={(event) => setBillingForm((current) => ({ ...current, clientId: event.target.value }))} required>
                  <option value="">Select client</option>
                  {clientOptions()}
                </Select>
              </Field>
              <Field label="Status">
                <Select value={billingForm.status} onChange={(event) => setBillingForm((current) => ({ ...current, status: event.target.value }))}>
                  {BILLING_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                </Select>
              </Field>
              <div className="lg:col-span-2"><Field label="Title"><TextInput value={billingForm.title} onChange={(event) => setBillingForm((current) => ({ ...current, title: event.target.value }))} required /></Field></div>
              <div className="lg:col-span-2"><Field label="Description"><TextArea value={billingForm.description} onChange={(event) => setBillingForm((current) => ({ ...current, description: event.target.value }))} /></Field></div>
              <Field label="Amount in dollars"><TextInput type="number" min="0" step="0.01" value={billingForm.amountDollars} onChange={(event) => setBillingForm((current) => ({ ...current, amountDollars: event.target.value }))} required /></Field>
              <Field label="Due date"><TextInput type="date" value={billingForm.dueDate} onChange={(event) => setBillingForm((current) => ({ ...current, dueDate: event.target.value }))} /></Field>
              <div className="lg:col-span-2"><Field label="Stripe hosted invoice URL"><TextInput type="url" value={billingForm.stripeHostedInvoiceUrl} onChange={(event) => setBillingForm((current) => ({ ...current, stripeHostedInvoiceUrl: event.target.value }))} /></Field></div>
              <div className="lg:col-span-2"><Field label="Invoice PDF URL"><TextInput type="url" value={billingForm.invoicePdfUrl} onChange={(event) => setBillingForm((current) => ({ ...current, invoicePdfUrl: event.target.value }))} /></Field></div>
              <div className="lg:col-span-2"><PrimaryButton type="submit" variant="dark" disabled={busyAction === 'create-billing-item'}>{busyAction === 'create-billing-item' ? 'Saving...' : 'Create billing item'}</PrimaryButton></div>
            </form>
          </SectionCard>

          <SectionCard title="Billing" subtitle="Edit invoice metadata and hosted Stripe invoice URLs.">
            {billingItems.length ? (
              <div className="space-y-4">
                {billingItems.map((item) => {
                  const edit = getBillingEdit(item)
                  return (
                    <div key={item.id} className="grid gap-4 rounded-2xl border border-stone-200 bg-slate-50 p-4 lg:grid-cols-2">
                      <div className="lg:col-span-2 flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium text-slate-900">{item.client_name}</p>
                          <p className="mt-1 text-xs uppercase tracking-[0.12em] text-slate-500">{formatCurrency(item.amount_cents, item.currency)} · Created {formatDate(item.created_at)}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusBadgeClass(item.status)}`}>{statusLabel(item.status)}</span>
                      </div>
                      <Field label="Title"><TextInput value={edit.title} onChange={(event) => setBillingEdit(item.id, { title: event.target.value })} /></Field>
                      <Field label="Status">
                        <Select value={edit.status} onChange={(event) => setBillingEdit(item.id, { status: event.target.value })}>
                          {BILLING_STATUSES.map((status) => <option key={status} value={status}>{statusLabel(status)}</option>)}
                        </Select>
                      </Field>
                      <Field label="Amount in dollars"><TextInput type="number" min="0" step="0.01" value={edit.amountDollars} onChange={(event) => setBillingEdit(item.id, { amountDollars: event.target.value })} /></Field>
                      <Field label="Due date"><TextInput type="date" value={edit.dueDate} onChange={(event) => setBillingEdit(item.id, { dueDate: event.target.value })} /></Field>
                      <div className="lg:col-span-2"><Field label="Description"><TextArea value={edit.description} onChange={(event) => setBillingEdit(item.id, { description: event.target.value })} /></Field></div>
                      <div className="lg:col-span-2"><Field label="Stripe hosted invoice URL"><TextInput type="url" value={edit.stripeHostedInvoiceUrl} onChange={(event) => setBillingEdit(item.id, { stripeHostedInvoiceUrl: event.target.value })} /></Field></div>
                      <div className="lg:col-span-2"><Field label="Invoice PDF URL"><TextInput type="url" value={edit.invoicePdfUrl} onChange={(event) => setBillingEdit(item.id, { invoicePdfUrl: event.target.value })} /></Field></div>
                      <div className="lg:col-span-2"><PrimaryButton type="button" variant="dark" onClick={() => handleUpdateBillingItem(item)} disabled={busyAction === `update-billing-${item.id}`}>{busyAction === `update-billing-${item.id}` ? 'Saving...' : 'Save billing item'}</PrimaryButton></div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <EmptyState title="No billing items found" body="Create billing records after Stripe hosted invoice URLs are ready." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {activeTab === 'Messages' ? (
        <div className="space-y-8">
          <SectionCard title="Send Message" subtitle="Add a portal message that clients can read inside their dashboard.">
            <form onSubmit={handleCreateMessage} className="grid gap-4">
              <Field label="Client">
                <Select value={messageForm.clientId} onChange={(event) => setMessageForm((current) => ({ ...current, clientId: event.target.value }))} required>
                  <option value="">Select client</option>
                  {clientOptions()}
                </Select>
              </Field>
              <Field label="Title"><TextInput value={messageForm.title} onChange={(event) => setMessageForm((current) => ({ ...current, title: event.target.value }))} required /></Field>
              <Field label="Message body"><TextArea value={messageForm.body} onChange={(event) => setMessageForm((current) => ({ ...current, body: event.target.value }))} required /></Field>
              <PrimaryButton type="submit" disabled={busyAction === 'create-message'}>{busyAction === 'create-message' ? 'Sending...' : 'Send message'}</PrimaryButton>
            </form>
          </SectionCard>

          <SectionCard title="Messages" subtitle="Archive messages clients no longer need to see.">
            {messages.length ? (
              <div className="space-y-3">
                {messages.map((message) => (
                  <div key={message.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-medium text-slate-900">{message.title}</p>
                          {message.archived_at ? <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs text-slate-600">Archived</span> : null}
                        </div>
                        <p className="mt-1 text-sm text-slate-600">{message.client_name}</p>
                        <p className="mt-3 text-sm leading-6 text-slate-700">{message.body}</p>
                        <p className="mt-3 text-xs uppercase tracking-[0.12em] text-slate-500">Created {formatDate(message.created_at)}</p>
                      </div>
                      {!message.archived_at ? (
                        <SecondaryButton type="button" onClick={() => handleArchiveMessage(message.id)} disabled={busyAction === `archive-message-${message.id}`}>
                          {busyAction === `archive-message-${message.id}` ? 'Archiving...' : 'Archive'}
                        </SecondaryButton>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState title="No messages found" body="Portal messages will appear here after they are created." />
            )}
          </SectionCard>
        </div>
      ) : null}

      {activeTab === 'Audit' ? (
        <SectionCard title="Audit" subtitle="Recent portal activity across clients.">
          {recentActivity.length ? (
            <div className="space-y-3">
              {recentActivity.map((event) => (
                <div key={event.id} className="rounded-2xl border border-stone-200 bg-slate-50 p-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm font-medium text-slate-900">{event.description}</p>
                    <span className="text-xs uppercase tracking-[0.12em] text-slate-500">{formatDate(event.created_at)}</span>
                  </div>
                  <p className="mt-2 text-xs uppercase tracking-[0.12em] text-slate-500">{event.event_type}</p>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState title="No recent activity" body="Audit events will appear here as admins and clients interact with the portal." />
          )}
        </SectionCard>
      ) : null}
    </div>
  )
}
