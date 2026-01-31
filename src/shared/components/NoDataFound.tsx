import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StyleProp,
  ViewStyle,
} from 'react-native';
import { Inbox } from 'lucide-react-native';
import StyledText from './StyledText';

export interface NoDataFoundProps {
  title?: string;
  message?: string;
  onAction?: () => void;
  actionTitle?: string;
  isLoading?: boolean;
  showIcon?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}

const NoDataFound: React.FC<NoDataFoundProps> = ({
  title = 'No data found',
  message = 'There is no data to display at the moment.',
  onAction,
  actionTitle = 'Refresh',
  isLoading = false,
  showIcon = true,
  icon,
  style,
}) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.content}>
        {showIcon && (
          <View style={styles.iconWrap}>
            {icon ?? <Inbox size={40} color="#6B7280" />}
          </View>
        )}
        {title && <StyledText style={styles.title}>{title}</StyledText>}
        {message && <StyledText style={styles.message}>{message}</StyledText>}
        {onAction && (
          <TouchableOpacity
            style={styles.button}
            onPress={onAction}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <StyledText style={styles.buttonLabel}>{actionTitle}</StyledText>
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

export default NoDataFound;
