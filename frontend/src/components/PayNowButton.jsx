import React, { useState } from 'react';
import axios from 'axios';
import { Send, CheckCircle2 } from 'lucide-react';

const PayNowButton = ({ payeeName, payeeUpiId, amount, payeeId, onPaymentComplete }) => {
  const [loading, setLoading] = useState(false);
  const [showMarkPaid, setShowMarkPaid] = useState(false);

  const handlePayNow = () => {
    // Generate standard Indian UPI deep link
    const upiUrl = `upi://pay?pa=${payeeUpiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=Hostel_Settlement`;
    
    // Attempt to open link (will work on mobile devices with UPI apps)
    window.location.href = upiUrl;

    // Show the manual "Mark as Paid" button after they click Pay
    setShowMarkPaid(true);
  };

  const handleMarkAsPaid = async () => {
    try {
      setLoading(true);
      await axios.post('/api/dashboard/pay', {
        payeeId,
        amount
      });
      onPaymentComplete();
    } catch (error) {
      console.error(error);
      alert('Error marking as paid');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2 ml-2">
      {!showMarkPaid ? (
        <button 
          onClick={handlePayNow}
          className="bg-emerald-500 hover:bg-emerald-600 text-white py-1.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-lg shadow-emerald-500/20"
        >
          <Send size={14} />
          Pay
        </button>
      ) : (
        <button 
          onClick={handleMarkAsPaid}
          disabled={loading}
          className="bg-slate-700 hover:bg-slate-600 text-emerald-400 py-1.5 px-4 rounded-full text-xs font-bold transition-all flex items-center justify-center gap-1.5 border border-slate-600"
        >
          <CheckCircle2 size={14} />
          {loading ? '...' : 'Paid'}
        </button>
      )}
    </div>
  );
};

export default PayNowButton;
