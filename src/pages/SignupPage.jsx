import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'

export function SignupPage() {
  const [inviteCode, setInviteCode] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const { session, loading: authLoading, refetchProfile } = useAuth()

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-gray-200 border-t-primary-700 rounded-full animate-spin" />
      </div>
    )
  }

  if (session) {
    navigate('/', { replace: true })
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }
    setLoading(true)

    const normalizedCode = inviteCode.trim().replace(/-/g, '')
    const { data: verifyData, error: verifyErr } = await supabase.rpc(
      'verify_invite_code',
      { given_code: normalizedCode }
    )

    if (verifyErr || !verifyData?.length) {
      setError('Invalid or expired invite code.')
      setLoading(false)
      return
    }

    const { program_id, invite_id } = verifyData[0]

    const { data: authData, error: signUpErr } = await supabase.auth.signUp({
      email,
      password,
    })

    if (signUpErr) {
      if (signUpErr.message?.includes('already registered')) {
        setError('This email is already registered. Sign in instead.')
      } else {
        setError(signUpErr.message || 'Sign up failed')
      }
      setLoading(false)
      return
    }

    if (!authData.user) {
      setError('Sign up failed. Please try again.')
      setLoading(false)
      return
    }

    const { error: completeErr } = await supabase.rpc('complete_leader_signup', {
      invite_id_param: invite_id,
    })

    if (completeErr) {
      setError('Failed to complete signup. Contact support.')
      setLoading(false)
      return
    }

    await refetchProfile()
    setLoading(false)
    navigate('/')
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-sm p-6 sm:p-8 w-full max-w-md mx-4">
        <h1 className="text-2xl font-semibold text-gray-900 text-center">
          ThreeDungeons
        </h1>
        <p className="text-sm text-gray-500 mt-1 text-center">
          Create your leader account
        </p>
        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Invite Code
            </label>
            <input
              type="text"
              value={inviteCode}
              onChange={(e) => setInviteCode(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5 font-mono"
              placeholder="Enter your invite code"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Your email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="name@example.com"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="••••••••"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-900 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-primary-500 focus:border-primary-500 block w-full p-2.5"
              placeholder="••••••••"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full text-white bg-primary-700 hover:bg-primary-800 focus:ring-4 focus:ring-primary-300 font-medium rounded-lg text-sm px-5 py-2.5"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>
        <p className="text-sm text-gray-500 mt-4 text-center">
          Already have an account?{' '}
          <Link to="/login" className="text-primary-600 hover:underline">
            Sign in
          </Link>
        </p>
        {error && (
          <p className="text-sm text-red-600 mt-4 text-center">{error}</p>
        )}
      </div>
    </div>
  )
}
