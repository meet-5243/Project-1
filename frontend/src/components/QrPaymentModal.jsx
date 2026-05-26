import React, { useState } from 'react';
import { X, Copy, Check, QrCode, Smartphone, Info } from 'lucide-react';

const QrPaymentModal = ({ isOpen, onClose, payeeName, payeeUpiId, amount, onConfirmPayment }) => {
  const [copied, setCopied] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [includeAmount, setIncludeAmount] = useState(true);

  if (!isOpen) return null;

  // Trim payee UPI ID to prevent trailing space issues
  const cleanUpiId = payeeUpiId?.trim() || '';

  // Construct UPI URI based on user toggle
  const upiUrl = includeAmount
    ? `upi://pay?pa=${cleanUpiId}&pn=${encodeURIComponent(payeeName)}&am=${amount}&cu=INR&tn=ClearAndSync`
    : `upi://pay?pa=${cleanUpiId}&pn=${encodeURIComponent(payeeName)}`;

  // Dynamically generate QR code URL using public API
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(upiUrl)}&color=0-0-0&bgcolor=255-255-255&margin=10`;

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(cleanUpiId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleConfirm = async () => {
    if (confirming) return;
    try {
      setConfirming(true);
      await onConfirmPayment();
      onClose();
    } catch (err) {
      console.error(err);
      alert('Failed to settle payment. Please try again.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200">
      <div 
        className="relative bg-zinc-900/90 border border-zinc-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl shadow-rose-500/5 animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative Top Glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-12 bg-rose-500/10 rounded-full blur-2xl pointer-events-none" />

        {/* Header */}
        <div className="p-5 border-b border-zinc-800/80 flex justify-between items-center bg-zinc-950/40">
          <div className="flex items-center gap-2">
            <div className="bg-rose-500/15 p-2 rounded-xl text-rose-400">
              <QrCode size={18} />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white leading-tight">Pay via UPI QR</h3>
              <p className="text-[10px] text-zinc-500">Scan with any UPI App</p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-white p-1.5 bg-white/5 rounded-full hover:bg-white/10 transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col items-center">
          {/* Amount Badge */}
          <div className="text-center mb-5 flex flex-col items-center">
            <span className="text-[10px] uppercase tracking-wider text-rose-400 font-bold bg-rose-500/10 px-3 py-1 rounded-full border border-rose-500/20">
              Paying {payeeName}
            </span>
            <h2 className="text-3xl font-black text-white mt-3 flex items-center justify-center gap-0.5">
              <span className="text-xl font-bold text-zinc-400">₹</span>
              {amount}
            </h2>
            
            {/* Dynamic Amount Pre-fill Switcher */}
            <label className="flex items-center gap-2 mt-3 py-1 px-3 bg-zinc-950/40 border border-zinc-800/80 rounded-full text-[10px] text-zinc-400 cursor-pointer hover:text-zinc-300 transition-colors select-none">
              <input 
                type="checkbox" 
                checked={includeAmount} 
                onChange={(e) => setIncludeAmount(e.target.checked)}
                className="rounded border-zinc-700 bg-zinc-800 text-rose-500 focus:ring-0 focus:ring-offset-0 w-3 h-3 accent-rose-500 cursor-pointer"
              />
              Pre-fill exact amount (₹{amount})
            </label>
          </div>

          {/* QR Code Container */}
          <div className="relative bg-white p-3 rounded-2xl shadow-xl shadow-black/20 border border-zinc-700/20 transition-transform duration-300 hover:scale-[1.02]">
            <img 
              src={qrCodeUrl} 
              alt="UPI QR Code" 
              className="w-48 h-48 block rounded-lg"
              loading="lazy"
            />
          </div>

          {/* UPI Details */}
          <div className="w-full mt-6 bg-zinc-950/50 border border-zinc-800/50 rounded-2xl p-3 flex flex-col gap-2">
            <div className="flex justify-between items-center gap-2">
              <div className="min-w-0">
                <p className="text-[10px] text-zinc-500 uppercase tracking-wider font-semibold">UPI ID</p>
                <p className="text-xs text-zinc-300 truncate font-mono mt-0.5">{cleanUpiId}</p>
              </div>
              <button
                onClick={handleCopyUpi}
                className="shrink-0 flex items-center justify-center gap-1 py-1.5 px-3 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-zinc-300 rounded-lg text-xs font-bold transition-all border border-zinc-700/50"
              >
                {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                {copied ? 'Copied!' : 'Copy'}
              </button>
            </div>
          </div>

          {/* Mobile Deep Link & Troubleshooting Help */}
          <div className="w-full mt-3 flex flex-col gap-2.5 bg-zinc-950/30 border border-zinc-800/80 rounded-2xl p-3">
            <div className="flex items-start gap-2">
              <Smartphone size={14} className="text-emerald-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-normal">
                On mobile? You can scan this screen or click <a href={upiUrl} className="text-emerald-400 hover:underline font-bold">here to open UPI apps</a> directly.
              </p>
            </div>
            
            <div className="flex items-start gap-2 border-t border-zinc-800/50 pt-2.5">
              <Info size={14} className="text-rose-400 shrink-0 mt-0.5" />
              <p className="text-[10px] text-zinc-400 leading-normal">
                <span className="font-bold text-zinc-300">Scanning issues?</span> If your UPI app says <span className="text-rose-400 font-semibold">"Add bank account"</span>:
                <br />
                1. Make sure recipient's UPI ID (<span className="font-mono text-[9px] text-zinc-300">{cleanUpiId}</span>) is valid & active.
                <br />
                2. <span className="font-semibold text-zinc-300">Uncheck</span> the amount pre-fill box above to enter the amount manually on your phone.
              </p>
            </div>
          </div>
        </div>

        {/* Footer Confirmation */}
        <div className="p-4 bg-zinc-950/40 border-t border-zinc-800/80 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 bg-zinc-800 hover:bg-zinc-700 active:bg-zinc-800 text-zinc-300 rounded-xl text-xs font-bold transition-colors border border-zinc-700/50"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={confirming}
            className="flex-1 py-2.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-xl text-xs font-black transition-all shadow-lg shadow-rose-500/25 disabled:opacity-50"
          >
            {confirming ? 'Settling...' : 'I Have Paid'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QrPaymentModal;
