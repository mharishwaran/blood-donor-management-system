import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import toast from 'react-hot-toast';

export default function GoogleCallbackPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => {
    const token = searchParams.get('token');
    const isNewUser = searchParams.get('isNewUser');

    if (!token) {
      toast.error('Google authentication failed. Please try again.');
      navigate('/login', { replace: true });
      return;
    }

    localStorage.setItem('token', token);
    if (isNewUser === 'true') {
      localStorage.setItem('showWelcomeMessage', 'true');
    } else {
      localStorage.removeItem('showWelcomeMessage');
    }

    window.location.replace('/');
  }, [navigate, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
      <p className="text-sm text-slate-300">Finishing sign-in...</p>
    </div>
  );
}
