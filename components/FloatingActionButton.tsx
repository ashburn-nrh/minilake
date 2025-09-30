import { TouchableOpacity, Text } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface FABProps {
  onPress: () => void;
  icon?: keyof typeof Ionicons.glyphMap;
  label?: string;
}

export const FloatingActionButton = ({ onPress, icon = 'add', label }: FABProps) => {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute bottom-6 right-6 bg-blue-500 rounded-full shadow-lg flex-row items-center px-6 py-4"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
        elevation: 8,
      }}
    >
      <Ionicons name={icon} size={24} color="white" />
      {label && (
        <Text className="text-white font-bold text-base ml-2">{label}</Text>
      )}
    </TouchableOpacity>
  );
};
