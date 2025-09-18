import React, { useState } from 'react';
import { Group, Settlement } from '../types';
import { X, DollarSign, ArrowRight } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { getCurrentUser } from '../utils/storage';

interface SettlementFormProps {
  group: Group;
  suggestions: Array<{ from: string; to: string; amount: number; fromName: string; toName: string }>;
  onSave: (settlement: Settlement) => void;
  onCancel: () => void;
}

const SettlementForm: React.FC<SettlementFormProps> = ({ 
  group, 
  suggestions, 
  onSave, 
  onCancel 
}) => {
  const [fromUserId, setFromUserId] = useState('');
  const [toUserId, setToUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number | null>(null);

  const currentUser = getCurrentUser();

  const handleSuggestionClick = (suggestionIndex: number) => {
    const suggestion = suggestions[suggestionIndex];
    setFromUserId(suggestion.from);
    setToUserId(suggestion.to);
    setAmount(suggestion.amount.toFixed(2));
    setDescription(`Settlement: ${suggestion.fromName} → ${suggestion.toName}`);
    setSelectedSuggestion(suggestionIndex);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fromUserId || !toUserId || !amount || !description.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    if (fromUserId === toUserId) {
      alert('Payer and receiver cannot be the same person');
      return;
    }

    const settlement: Settlement = {
      id: uuidv4(),
      groupId: group.id,
      fromUserId,
      toUserId,
      amount: parseFloat(amount),
      description: description.trim(),
      date,
      createdAt: new Date().toISOString()
    };

    onSave(settlement);
  };

  const getMemberName = (userId: string) => {
    return group.members.find(m => m.userId === userId)?.name || 'Unknown';
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Record Settlement</h2>
          <button
            onClick={onCancel}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Suggestions */}
          {suggestions.length > 0 && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Suggested Settlements
              </h3>
              <div className="space-y-2">
                {suggestions.slice(0, 5).map((suggestion, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => handleSuggestionClick(index)}
                    className={`w-full p-3 rounded-md border-2 transition-all ${
                      selectedSuggestion === index
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <span className="text-sm font-medium text-gray-900">
                          {suggestion.fromName}
                        </span>
                        <ArrowRight className="h-4 w-4 text-gray-400" />
                        <span className="text-sm font-medium text-gray-900">
                          {suggestion.toName}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-green-600">
                        ${suggestion.amount.toFixed(2)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Manual Entry */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                {suggestions.length > 0 ? 'Or enter manually:' : 'Settlement Details:'}
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    From (who paid) *
                  </label>
                  <select
                    value={fromUserId}
                    onChange={(e) => {
                      setFromUserId(e.target.value);
                      setSelectedSuggestion(null);
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select member</option>
                    {group.members.map(member => (
                      <option key={member.userId} value={member.userId}>
                        {member.name} {member.userId === currentUser.id ? '(You)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    To (who received) *
                  </label>
                  <select
                    value={toUserId}
                    onChange={(e) => {
                      setToUserId(e.target.value);
                      setSelectedSuggestion(null);
                    }}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select member</option>
                    {group.members
                      .filter(member => member.userId !== fromUserId)
                      .map(member => (
                        <option key={member.userId} value={member.userId}>
                          {member.name} {member.userId === currentUser.id ? '(You)' : ''}
                        </option>
                      ))}
                  </select>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount *
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={amount}
                    onChange={(e) => {
                      setAmount(e.target.value);
                      setSelectedSuggestion(null);
                    }}
                    className="pl-10 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="0.00"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <input
                type="text"
                required
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  setSelectedSuggestion(null);
                }}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="e.g., Cash payment, Bank transfer"
              />
            </div>

            {/* Preview */}
            {fromUserId && toUserId && amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
                <h4 className="text-sm font-medium text-blue-900 mb-2">Settlement Preview:</h4>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-sm font-medium text-blue-900">
                      {getMemberName(fromUserId)}
                    </span>
                    <ArrowRight className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-900">
                      {getMemberName(toUserId)}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-blue-900">
                    ${parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex items-center justify-center"
              >
                <DollarSign className="h-4 w-4 mr-2" />
                Record Settlement
              </button>
              <button
                type="button"
                onClick={onCancel}
                className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SettlementForm;