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
      await axios.post('http://localhost:5000/api/dashboard/pay', {
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
    <div className="flex flex-col gap-2 w-full mt-2">
      <button 
        onClick={handlePayNow}
        className="w-full bg-emerald-500 hover:bg-emerald-600 text-white py-2 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2"
      >
        <Send size={18} />
        Pay ₹{amount} Now
      </button>

      {showMarkPaid && (
        <button 
          onClick={handleMarkAsPaid}
          disabled={loading}
          className="w-full bg-slate-700 hover:bg-slate-600 text-emerald-400 py-2 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 border border-slate-600"
        >
          <CheckCircle2 size={18} />
          {loading ? 'Processing...' : 'I have Paid!'}
        </button>
      )}
    </div>
  );
};

export default PayNowButton;
