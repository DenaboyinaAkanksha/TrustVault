import { useState } from 'react'

type LoginProps = {
  onLogin: () => void
  onSignup: () => void
}

function Login({ onLogin, onSignup }: LoginProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError('')

    if (!email.trim() || !password) {
      setError('Please enter your email and password.')
      return
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.')
      return
    }

    setError('Login is not connected yet. Authentication will be added next.')
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <section className="w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-xl">
        <div className="bg-slate-900 px-8 py-8 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-600 text-white">
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              className="h-8 w-8"
              aria-hidden="true"
            >
              <path d="M12 3 20 6v5c0 5-3.4 8.2-8 10-4.6-1.8-8-5-8-10V6l8-3Z" />
              <path d="m9 12 2 2 4-4" />
            </svg>
          </div>

          <h1 className="mt-4 text-3xl font-bold tracking-tight text-white">
            TrustVault
          </h1>
          <p className="mt-2 text-sm text-slate-300">
            Your documents. Your privacy.
          </p>
        </div>

        <div className="px-8 py-8">
          <h2 className="text-2xl font-bold text-slate-900">
            Welcome back
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            Sign in to access your document vault.
          </p>

          <form onSubmit={handleSubmit} className="mt-7 space-y-5">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-medium text-slate-700"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                className="w-full rounded-xl border border-slate-300 px-4 py-3 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label
                  htmlFor="login-password"
                  className="text-sm font-medium text-slate-700"
                >
                  Password
                </label>
              </div>

              <div className="relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  required
                  className="w-full rounded-xl border border-slate-300 px-4 py-3 pr-20 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-3 text-sm font-medium text-blue-600 hover:text-blue-800"
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <p role="alert" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-blue-600 px-4 py-3 font-semibold text-white transition hover:bg-blue-700 focus:outline-none focus:ring-4 focus:ring-blue-200"
            >
              Sign in
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-500">
            Don't have an account?{' '}
            <button
              type="button"
              onClick={onSignup}
              className="font-semibold text-blue-600 hover:text-blue-800"
            >
              Create one
            </button>
          </p>
        </div>
      </section>
    </main>
  )
}

export default Login