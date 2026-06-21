import { useState } from 'react'

export default function LoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/login', {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json().catch(() => ({}))

      if (!response.ok) {
        throw new Error(data?.error || 'Login failed.')
      }

      window.location.href = '/portal'
    } catch (submitError) {
      setError(submitError.message || 'Login failed.')
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
          <input
            type="password"
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-md border border-stone-300 bg-white px-4 py-3 text-base text-slate-900 outline-none transition focus:border-emerald-600 focus:ring-2 focus:ring-emerald-100"
            required
          />
        </label>

        {error ? (
          <p className="rounded-md border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</p>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-emerald-600 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:bg-emerald-400"
        >
          {loading ? 'Signing in...' : 'Sign in'}
        </button>
      </div>
    </form>
  )
}
