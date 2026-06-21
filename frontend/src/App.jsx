import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Dashboard from './components/Dashboard';
import Groups from './components/Groups';
import GroupDetails from './components/GroupDetails';
import Profile from './components/Profile';
import ExpenseAnalytics from './components/ExpenseAnalytics';
import ExpenseHistory from './components/ExpenseHistory';
import axios from 'axios';

// Helper to convert base64 VAPID public key to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, '+')
    .replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

async function registerPushNotifications() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
    console.log('Push notifications are not supported on this browser/device');
    return;
  }

  try {
    const registration = await navigator.serviceWorker.ready;

    let permission = Notification.permission;
    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      console.log('Push notification permission denied/dismissed');
      return;
    }

    const vapidRes = await axios.get('/api/notifications/vapid-public-key');
    const vapidPublicKey = vapidRes.data.publicKey;

    const convertedKey = urlBase64ToUint8Array(vapidPublicKey);
    const subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: convertedKey
    });

    await axios.post('/api/notifications/subscribe', { subscription });
    console.log('Successfully subscribed to PWA Push Notifications!');
  } catch (error) {
    console.error('Error setting up push notifications:', error);
  }
}

const PushManager = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      registerPushNotifications();
    }
  }, [user]);

  return null;
};

const AuthScreen = () => {
  const { login, signup } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [upiId, setUpiId] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      if (isLogin) {
        await login(email, password);
        navigate('/'); // Redirect to dashboard on success
      } else {
        await signup({ name, email, password, upiId });
        navigate('/'); // Redirect to dashboard on success
      }
    } catch (err) {
      alert(err.response?.data?.error || (isLogin ? 'Login failed' : 'Signup failed'));
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setIsLogin(!isLogin);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center p-4">
      <div className="glass-panel p-8 rounded-3xl w-full max-w-md">
        <h2 className="text-3xl font-bold mb-1 text-center bg-clip-text text-transparent bg-gradient-to-r from-emerald-400 to-cyan-400">Clear&Sync</h2>
        <p className="text-xs text-center text-gray-500 mb-4 italic">Sync the expenses. Clear the debts.</p>
        <p className="text-center text-gray-400 mb-6">{isLogin ? 'Welcome back!' : 'Create your account'}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <>
            {!isLogin && (
              <input
                type="text"
                placeholder="Full Name"
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                value={name} onChange={e => setName(e.target.value)} required
              />
            )}
            <input
              type="email"
              placeholder="Email"
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
              value={email} onChange={e => setEmail(e.target.value)} required
            />
            <input
              type="password"
              placeholder="Password"
              className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
              value={password} onChange={e => setPassword(e.target.value)} required
            />
            {!isLogin && (
              <input
                type="text"
                placeholder="UPI ID (optional, e.g. name@oksbi)"
                className="bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                value={upiId} onChange={e => setUpiId(e.target.value)}
              />
            )}
          </>
          <button type="submit" disabled={isLoading} className="bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition mt-2">
            {isLoading ? 'Processing...' : (isLogin ? 'Login' : 'Sign Up')}
          </button>
        </form>
        <p className="text-center text-sm text-gray-400 mt-6">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            type="button"
            onClick={resetForm}
            className="text-emerald-400 hover:underline font-medium"
          >
            {isLogin ? 'Sign Up' : 'Login'}
          </button>
        </p>
      </div>
    </div>
  );
};

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-[#0a0a0a] text-white flex items-center justify-center">Loading...</div>;
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <PushManager />
      <Router>
        <Routes>
          <Route path="/login" element={<AuthScreen />} />
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/profile" element={<PrivateRoute><Profile /></PrivateRoute>} />
          <Route path="/groups" element={<PrivateRoute><Groups /></PrivateRoute>} />
          <Route path="/groups/:id" element={<PrivateRoute><GroupDetails /></PrivateRoute>} />
          <Route path="/analytics" element={<PrivateRoute><ExpenseAnalytics /></PrivateRoute>} />
          <Route path="/history" element={<PrivateRoute><ExpenseHistory /></PrivateRoute>} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
