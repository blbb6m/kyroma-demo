
import React, { useState } from 'react';
import { X, CheckCircle, XCircle, RefreshCw, DollarSign } from 'lucide-react';
import { Bid } from '../../types';

interface BidReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  bid: Bid;
  onAction: (action: 'ACCEPT' | 'REJECT' | 'COUNTER', payload?: { reason?: string; amount?: number }) => void;
}

const BidReviewModal: React.FC<BidReviewModalProps> = ({ isOpen, onClose, bid, onAction }) => {
  const [actionType, setActionType] = useState<'NONE' | 'REJECT' | 'COUNTER'>('NONE');
  const [reason, setReason] = useState('');
  const [counterAmount, setCounterAmount] = useState<string>(bid.amount.toString());

  if (!isOpen) return null;

  const handleSubmit = () => {
    if (actionType === 'REJECT') {
      onAction('REJECT', { reason });
    } else if (actionType === 'COUNTER') {
      onAction('COUNTER', { amount: Number(counterAmount) });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Review Proposal</h3>
            <p className="text-sm text-gray-500">From {bid.photographerName}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          {/* Proposal Details */}
          <div className="mb-6 bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Message:</p>
            <p className="text-gray-900 italic mb-3">"{bid.message}"</p>
            {bid.type === 'PAID' && (
               <div className="flex items-center text-gray-900 font-medium">
                  Proposal Amount: <span className="text-green-600 ml-1 font-bold">${bid.amount}</span>
               </div>
            )}
            {bid.type === 'OPEN_SHOOT' && (
                <div className="flex items-center text-amber-700 font-medium text-sm">
                    Requesting Open Shoot Access
                </div>
            )}
          </div>

          {/* Action Selection */}
          {actionType === 'NONE' && (
            <div className="space-y-3">
              <button
                onClick={() => onAction('ACCEPT')}
                className="w-full flex items-center justify-center px-4 py-3 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Accept Proposal
              </button>
              
              {bid.type === 'PAID' && (
                <button
                    onClick={() => setActionType('COUNTER')}
                    className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Counter Offer
                </button>
              )}

              <button
                onClick={() => setActionType('REJECT')}
                className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-red-600 bg-white hover:bg-red-50"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Decline
              </button>
            </div>
          )}

          {/* Decline Form */}
          {actionType === 'REJECT' && (
             <div className="space-y-4 animate-fade-in-up">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Declining (Optional)</label>
                   <textarea 
                     className="w-full border border-gray-300 rounded-md shadow-sm p-2 focus:ring-orange-500 focus:border-orange-500 sm:text-sm"
                     rows={3}
                     placeholder="e.g. Position already filled, seeking different style..."
                     value={reason}
                     onChange={(e) => setReason(e.target.value)}
                   />
                </div>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setActionType('NONE')}
                        className="flex-1 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700"
                    >
                        Confirm Decline
                    </button>
                </div>
             </div>
          )}

          {/* Counter Form */}
          {actionType === 'COUNTER' && (
             <div className="space-y-4 animate-fade-in-up">
                <div>
                   <label className="block text-sm font-medium text-gray-700 mb-1">Counter Offer Amount ($)</label>
                   <div className="relative rounded-md shadow-sm">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500 sm:text-sm">$</span>
                        </div>
                        <input
                        type="number"
                        min="0"
                        className="focus:ring-orange-500 focus:border-orange-500 block w-full pl-7 sm:text-sm border-gray-300 rounded-md py-2 border"
                        value={counterAmount}
                        onChange={(e) => setCounterAmount(e.target.value)}
                        />
                    </div>
                </div>
                <div className="flex space-x-3">
                    <button 
                        onClick={() => setActionType('NONE')}
                        className="flex-1 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Back
                    </button>
                    <button 
                        onClick={handleSubmit}
                        className="flex-1 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-orange-600 hover:bg-orange-700"
                    >
                        Send Counter Offer
                    </button>
                </div>
             </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BidReviewModal;
