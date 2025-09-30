import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Engagement } from '../lib/firebase/customers';

interface EngagementCardProps {
  engagement: Engagement;
  onPress?: () => void;
}

export const EngagementCard = ({ engagement, onPress }: EngagementCardProps) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
      case 'in_progress':
        return { bg: 'bg-blue-100', text: 'text-blue-700' };
      case 'won':
        return { bg: 'bg-green-100', text: 'text-green-700' };
      case 'lost':
        return { bg: 'bg-red-100', text: 'text-red-700' };
      default:
        return { bg: 'bg-gray-100', text: 'text-gray-700' };
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

  const statusColors = getStatusColor(engagement.status);

  return (
    <TouchableOpacity
      onPress={onPress}
      className="bg-white rounded-xl p-4 mb-3 border border-gray-200"
    >
      <View className="flex-row items-start justify-between mb-2">
        <Text className="text-base font-semibold text-gray-800 flex-1">
          {engagement.title}
        </Text>
        
        <View className={`px-3 py-1 rounded-full ${statusColors.bg}`}>
          <Text className={`text-xs font-semibold ${statusColors.text}`}>
            {engagement.status.replace('_', ' ').toUpperCase()}
          </Text>
        </View>
      </View>
      
      <View className="flex-row items-center">
        <Ionicons name="time-outline" size={14} color="#9ca3af" />
        <Text className="text-gray-500 text-xs ml-1">
          Updated {formatDate(engagement.lastUpdated)}
        </Text>
      </View>
    </TouchableOpacity>
  );
};
