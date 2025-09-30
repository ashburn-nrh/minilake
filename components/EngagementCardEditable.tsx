import { useState } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Engagement, updateEngagement } from '../lib/firebase/customers';
import { showMessage } from '../lib/utils/alert';

interface EngagementCardEditableProps {
  engagement: Engagement;
  customerId: string;
  onUpdate: () => void;
}

type EngagementStatus = 'open' | 'in_progress' | 'won' | 'lost';

const statusOptions: Array<{ value: EngagementStatus; label: string; color: string }> = [
  { value: 'open', label: 'Open', color: 'bg-gray-100 text-gray-700' },
  { value: 'in_progress', label: 'In Progress', color: 'bg-blue-100 text-blue-700' },
  { value: 'won', label: 'Won', color: 'bg-green-100 text-green-700' },
  { value: 'lost', label: 'Lost', color: 'bg-red-100 text-red-700' },
];

export const EngagementCardEditable = ({
  engagement,
  customerId,
  onUpdate,
}: EngagementCardEditableProps) => {
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [updating, setUpdating] = useState(false);

  const getCurrentStatusColor = () => {
    const status = statusOptions.find((s) => s.value === engagement.status);
    return status?.color || 'bg-gray-100 text-gray-700';
  };

  const getCurrentStatusLabel = () => {
    const status = statusOptions.find((s) => s.value === engagement.status);
    return status?.label || engagement.status;
  };

  const handleStatusChange = async (newStatus: EngagementStatus) => {
    setUpdating(true);
    try {
      await updateEngagement(customerId, engagement.id, { status: newStatus });
      setShowStatusMenu(false);
      onUpdate();
      showMessage('Success', 'Engagement status updated');
    } catch (error) {
      console.error(error);
      showMessage('Error', 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <View className="bg-white rounded-xl p-4 mb-3 border border-gray-200">
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-gray-800 flex-1 mr-2">
          {engagement.title}
        </Text>

        {/* Status Dropdown */}
        <TouchableOpacity
          onPress={() => setShowStatusMenu(!showStatusMenu)}
          className={`px-3 py-1 rounded-full ${getCurrentStatusColor()}`}
          disabled={updating}
        >
          <View className="flex-row items-center">
            <Text className={`text-xs font-semibold ${getCurrentStatusColor().split(' ')[1]}`}>
              {getCurrentStatusLabel().toUpperCase()}
            </Text>
            <Ionicons
              name={showStatusMenu ? 'chevron-up' : 'chevron-down'}
              size={12}
              color="#6b7280"
              style={{ marginLeft: 4 }}
            />
          </View>
        </TouchableOpacity>
      </View>

      {/* Status Menu */}
      {showStatusMenu && (
        <View className="mb-3 bg-gray-50 rounded-lg p-2">
          {statusOptions.map((option) => (
            <TouchableOpacity
              key={option.value}
              onPress={() => handleStatusChange(option.value)}
              className={`p-3 rounded-lg mb-1 ${
                engagement.status === option.value ? 'bg-blue-100' : 'bg-white'
              }`}
              disabled={updating}
            >
              <Text
                className={`font-semibold ${
                  engagement.status === option.value ? 'text-blue-700' : 'text-gray-700'
                }`}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={14} color="#9ca3af" />
        <Text className="text-gray-500 text-xs ml-1">
          Updated {formatDate(engagement.lastUpdated)}
        </Text>
      </View>
    </View>
  );
};
