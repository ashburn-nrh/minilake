import { Alert, Platform } from 'react-native';

/**
 * Cross-platform alert that works on web and mobile
 */
export const showAlert = (
  title: string,
  message: string,
  buttons?: Array<{
    text: string;
    onPress?: () => void;
    style?: 'default' | 'cancel' | 'destructive';
  }>
) => {
  if (Platform.OS === 'web') {
    // Web implementation using window.confirm
    const confirmed = window.confirm(`${title}\n\n${message}`);
    
    if (buttons) {
      const actionButton = buttons.find(b => b.style === 'destructive' || b.style === 'default');
      if (confirmed && actionButton?.onPress) {
        actionButton.onPress();
      }
    }
  } else {
    // Native implementation (iOS/Android)
    // Ensure buttons are properly formatted for Alert.alert
    const formattedButtons = buttons?.map(btn => ({
      text: btn.text,
      onPress: btn.onPress,
      style: btn.style,
    }));
    
    Alert.alert(title, message, formattedButtons);
  }
};

/**
 * Simple alert for success/error messages
 */
export const showMessage = (title: string, message: string) => {
  if (Platform.OS === 'web') {
    window.alert(`${title}\n\n${message}`);
  } else {
    Alert.alert(title, message, [{ text: 'OK' }]);
  }
};
