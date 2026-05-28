import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface Props {
  appTitle: string;
}

export default function Login({ appTitle }: Props) {
  const { signInWithGoogle, authError, currentUser } = useAuth();
  const [isSigningIn, setIsSigningIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser) navigate('/', { replace: true });
  }, [currentUser, navigate]);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
    } catch {
      // error stored in authError via context
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-brand-600 via-brand-500 to-brand-700 flex items-center justify-center px-4">
      <div className="bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl p-8 sm:p-10 w-full max-w-md border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-brand-500 to-brand-700 rounded-2xl mb-5 shadow-lg">
            <svg className="w-11 h-11 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{appTitle}</h1>
          <p className="text-sm text-gray-500">{orgConfig.orgName}</p>
        </div>

        {authError && (
          <div className="mb-5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm">{authError}</div>
        )}

        <button
          onClick={handleSignIn}
          disabled={isSigningIn}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 rounded-xl px-6 py-3.5 text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSigningIn ? (
            <>
              <div className="w-5 h-5 border-2 border-gray-300 border-t-gray-700 rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Sign in with Google
            </>
          )}
        </button>

        <p className="text-center text-xs text-gray-400 mt-5">
          {`Restricted to @${orgConfig.staffEmailDomain} accounts`}
        </p>
      </div>
    </div>
  );
}
