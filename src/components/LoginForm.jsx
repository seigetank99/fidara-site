import { useEffect, useState } from 'react'
import { Eye, EyeOff } from 'lucide-react'

const COOLDOWN_AFTER_FAILED_ATTEMPTS = 3
const COOLDOWN_SECONDS = 30

export default function LoginForm() {
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
      const response = await fetch('/api/portal?action=login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        registerFailedAttempt()
        throw new Error(data?.error || 'Invalid email or password.')
      }

      setFailedAttempts(0)
      setCooldownSeconds(0)
      window.location.href = '/portal'
    } catch (submitError) {
      setError(submitError.message || 'Invalid email or password.')
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
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {loading ? 'Signing in...' : cooldownSeconds > 0 ? `Try again in ${cooldownSeconds}s` : 'Sign in'}
        </button>

        <a href="/forgot-password" className="text-sm font-medium text-emerald-700 transition hover:text-emerald-900">
          Forgot password?
        </a>
      </div>
    </form>
  )
}
