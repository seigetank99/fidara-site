import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const COOLDOWN_AFTER_FAILED_ATTEMPTS = 3
const COOLDOWN_SECONDS = 30

async function readJson(response) {
  return response.json().catch(() => ({}))
}

export default function StaffLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [, setFailedAttempts] = useState(0)
  const [cooldownSeconds, setCooldownSeconds] = useState(0)
  const [showPassword, setShowPassword] = useState(false)

  useEffect(() => {
    if (!cooldownSeconds) return undefined
    const timer = window.setTimeout(() => setCooldownSeconds((current) => Math.max(0, current - 1)), 1000)
    return () => window.clearTimeout(timer)
  }, [cooldownSeconds])

  async function logout() {
    await fetch('/api/portal?action=logout', { method: 'POST' }).catch(() => {})
  }

  function registerFailedAttempt() {
    setFailedAttempts((current) => {
      const next = current + 1
      if (next >= COOLDOWN_AFTER_FAILED_ATTEMPTS) {
        setCooldownSeconds(COOLDOWN_SECONDS)
        return 0
      }
      return next
    })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (cooldownSeconds > 0) {
      setError(`Please wait ${cooldownSeconds} seconds before trying again.`)
      return
    }

    setLoading(true)
    setError('')

    try {
      const loginResponse = await fetch('/api/portal?action=login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })
      const loginData = await readJson(loginResponse)

      if (!loginResponse.ok) {
        registerFailedAttempt()
        throw new Error(loginData?.error || 'Unable to sign in with those credentials.')
      }

      setFailedAttempts(0)
      setCooldownSeconds(0)
      const adminResponse = await fetch('/api/admin?action=summary', {
        headers: { accept: 'application/json' },
      })

      if (adminResponse.status === 403) {
        await logout()
        setPassword('')
        setError('This account does not have staff access.')
        return
      }

      if (adminResponse.status === 401) {
        await logout()
        setPassword('')
        setError('Please sign in again to continue.')
        return
      }

      if (!adminResponse.ok) {
        await logout()
        setPassword('')
        setError('Staff access could not be verified right now.')
        return
      }

      window.location.assign('/admin')
    } catch (submitError) {
      setError(submitError.message || 'Unable to sign in right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-stone-200 bg-white p-6 shadow-sm sm:p-8">
      <div className="grid gap-5">
        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Email</span>
          <input
            type="email"
            autoComplete="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            className="rounded-md border border-stone-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </label>

        <label className="grid gap-2">
          <span className="text-sm font-medium text-slate-800">Password</span>
          <span className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="w-full rounded-md border border-stone-300 bg-white px-4 py-3 pr-12 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 inline-flex w-12 items-center justify-center text-slate-500 transition hover:text-slate-900"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff className="h-5 w-5" aria-hidden="true" /> : <Eye className="h-5 w-5" aria-hidden="true" />}
            </button>
          </span>
        </label>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading || cooldownSeconds > 0}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-slate-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          {loading ? 'Verifying...' : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Sign in'}
        </button>

        <a href="/" className="text-sm font-medium text-slate-600 transition hover:text-slate-900">
          Back to home
        </a>
      </div>
    </form>
  )
}
