import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StyledText from './StyledText';

export interface ErrorWithRetryProps {
  message?: string;
  onRetry?: () => void;
  isLoading?: boolean;
  title?: string;
  icon?: React.ReactNode;
  buttonText?: string;
}

const ErrorWithRetry: React.FC<ErrorWithRetryProps> = ({
  message = 'Something went wrong. Please try again.',
  onRetry,
  isLoading = false,
  title = 'Something went wrong',
  icon,
  buttonText = 'Try Again',
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <View style={styles.iconWrap}>
          {icon ?? <Icon name="error-outline" size={48} color="#E56B8C" />}
        </View>
        <StyledText style={styles.title}>{title}</StyledText>
        <StyledText style={styles.message}>{message}</StyledText>
        {onRetry && (
          <TouchableOpacity
            style={styles.button}
            onPress={onRetry}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <StyledText style={styles.buttonLabel}>{buttonText}</StyledText>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  iconWrap: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 22,
  },
  button: {
    backgroundColor: '#E56B8C',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ErrorWithRetry;
