import { View, Text } from 'react-native';

interface LoadingSpinnerProps {
  message?: string;
  size?: 'small' | 'medium' | 'large';
}

export const LoadingSpinner = ({ message = 'Loading...', size = 'medium' }: LoadingSpinnerProps) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    medium: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  return (
    <View className="items-center justify-center py-8">
      <View className={`${sizeClasses[size]} border-4 border-blue-200 border-t-blue-500 rounded-full animate-spin mb-4`} />
      <Text className="text-gray-500 text-base">{message}</Text>
    </View>
  );
};
