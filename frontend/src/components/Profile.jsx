import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft, UserCircle, Save } from 'lucide-react';

const Profile = () => {
  const { user, updateProfile, sendOtp } = useAuth();
  const navigate = useNavigate();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [upiId, setUpiId] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  
  const [showOtpField, setShowOtpField] = useState(false);
  const [otp, setOtp] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setEmail(user.email || '');
      setUpiId(user.upiId || '');
    }
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');
    
    try {
      const updateData = { name, email, upiId };
      if (password) {
        if (!showOtpField) {
          await sendOtp(user.email, 'password_change');
          setShowOtpField(true);
          setMessage('An OTP has been sent to your email to verify password change.');
          return;
        }
        updateData.password = password;
        updateData.otp = otp;
      }
      
      await updateProfile(updateData);
      navigate('/', { state: { message: 'Profile updated successfully!' } });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to update profile');
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white p-4 md:p-8 font-sans">
      <header className="flex items-center gap-4 mb-8">
        <Link to="/" className="p-2 glass-panel rounded-full hover:bg-white/10 transition">
          <ArrowLeft size={20} />
        </Link>
        <h1 className="text-2xl font-bold">Edit Profile</h1>
      </header>

      <div className="max-w-md mx-auto">
        <div className="glass-panel p-8 rounded-3xl">
          <div className="flex justify-center mb-6">
            <div className="h-24 w-24 rounded-full bg-gradient-to-br from-emerald-400 to-cyan-500 flex items-center justify-center font-bold text-4xl shadow-[0_0_20px_rgba(52,211,153,0.3)]">
              {name ? name.charAt(0).toUpperCase() : <UserCircle size={48} />}
            </div>
          </div>
          
          {message && <div className="bg-emerald-500/20 border border-emerald-500 text-emerald-400 p-3 rounded-xl mb-4 text-sm text-center">{message}</div>}
          {error && <div className="bg-red-500/20 border border-red-500 text-red-400 p-3 rounded-xl mb-4 text-sm text-center">{error}</div>}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Full Name</label>
              <input 
                type="text" 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                value={name} onChange={e => setName(e.target.value)} required 
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Email Address</label>
              <input 
                type="email" 
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                value={email} onChange={e => setEmail(e.target.value)} required 
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 mb-1 block">UPI ID</label>
              <input 
                type="text" 
                placeholder="e.g. yourname@oksbi"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                value={upiId} onChange={e => setUpiId(e.target.value)} 
              />
            </div>
            
            <div>
              <label className="text-xs text-gray-400 mb-1 block">New Password <span className="text-gray-500">(Leave blank to keep current)</span></label>
              <input 
                type="password" 
                placeholder="••••••••"
                autoComplete="new-password"
                className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition"
                value={password} onChange={e => setPassword(e.target.value)} 
                disabled={showOtpField}
              />
            </div>
            
            {showOtpField && (
              <div>
                <label className="text-xs text-gray-400 mb-1 block">Verification OTP</label>
                <input 
                  type="text" 
                  placeholder="Enter 6-digit OTP"
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-white outline-none focus:border-emerald-500 transition text-center tracking-widest text-lg"
                  value={otp} onChange={e => setOtp(e.target.value)} required
                  maxLength={6}
                />
                <button 
                  type="button" 
                  onClick={() => { setShowOtpField(false); setOtp(''); setMessage(''); }}
                  className="text-xs text-gray-400 hover:text-white mt-2 block"
                >
                  Cancel password change
                </button>
              </div>
            )}
            
            <button type="submit" className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold py-3 rounded-xl transition mt-4 flex justify-center items-center gap-2">
              <Save size={20} />
              {showOtpField ? 'Verify & Save Changes' : 'Save Changes'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Profile;
