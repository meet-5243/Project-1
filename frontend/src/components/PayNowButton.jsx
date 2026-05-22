import React, { useState } from 'react';
import axios from 'axios';
import { Send, Loader2 } from 'lucide-react';

const PayNowButton = ({ payeeName, payeeUpiId, amount, payeeId, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [paid, setPaid] = useState(false);

  const handlePay = async () => {
    if (loading || paid) return;
    try {
      setLoading(true);

      // 1. Build cross-platform UPI deep link and navigate
      const formattedAmount = Number(amount).toFixed(2);
      const queryParams = `pa=${payeeUpiId}&pn=${encodeURIComponent(payeeName)}&am=${formattedAmount}&cu=INR&tn=${encodeURIComponent('HostelSplit Payment')}`;

      // Direct Android intent routing to execute Google Pay natives directly
      const gpayAndroidIntent = `intent://pay?${queryParams}#Intent;scheme=upi;package=com.google.android.apps.nimbus;end`;

      // Generic fallback with routing bypass headers
      const universalUpiLink = `upi://pay?${queryParams}&mode=02&orgid=000000`;

      const isAndroid = /Android/i.test(navigator.userAgent);
      window.location.href = isAndroid ? gpayAndroidIntent : universalUpiLink;

      // 2. Mark as paid in the backend immediately
      await axios.post('/api/dashboard/pay', { payeeId, amount });

      setPaid(true);

      // 3. Refresh the balances list — entry will vanish from the UI
      onPaymentComplete();
    } catch (error) {
      console.error('Payment error:', error);
      alert('Error recording payment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handlePay}
      disabled={loading || paid}
      className={`flex items-center justify-center gap-1.5 py-1.5 px-4 rounded-full text-xs font-bold transition-all
        ${paid
          ? 'bg-zinc-700 text-zinc-400 cursor-default'
          : 'bg-rose-500 hover:bg-rose-600 text-white shadow-lg shadow-rose-500/25 hover:shadow-rose-500/40'
        }`}
    >
      {loading
        ? <Loader2 size={13} className="animate-spin" />
        : <Send size={13} />
      }
      {loading ? 'Paying...' : paid ? 'Paid!' : 'Pay Now'}
    </button>
  );
};

export default PayNowButton;
