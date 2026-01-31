import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import Toast, {
  BaseToast,
  BaseToastProps,
  ToastConfig,
} from 'react-native-toast-message';
import { CheckCircle, XCircle, AlertCircle, Info } from 'lucide-react-native';

const toastProps: BaseToastProps = {
  text1Style: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 4,
  },
  text2Style: {
    fontSize: 14,
    fontWeight: '400',
    color: '#6B7280',
    lineHeight: 20,
  },
  text2NumberOfLines: 10,
  style: {
    height: 'auto',
    minHeight: 60,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 12,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
  },
};

export const toastConfig: ToastConfig = {
  success: props => (
    <BaseToast
      {...props}
      {...toastProps}
      style={[toastProps.style, styles.success]}
      renderLeadingIcon={() => (
        <CheckCircle size={25} color="#10B981" style={styles.icon} />
      )}
    />
  ),
  error: (props: BaseToastProps) => (
    <BaseToast
      {...props}
      {...toastProps}
      style={[toastProps.style, styles.error]}
      renderLeadingIcon={() => (
        <XCircle size={25} color="#EF4444" style={styles.icon} />
      )}
    />
  ),
  warning: props => (
    <BaseToast
      {...props}
      {...toastProps}
      style={[toastProps.style, styles.warning]}
      renderLeadingIcon={() => (
        <AlertCircle size={25} color="#F59E0B" style={styles.icon} />
      )}
    />
  ),
  info: props => (
    <BaseToast
      {...props}
      {...toastProps}
      style={[toastProps.style, styles.info]}
      renderLeadingIcon={() => (
        <Info size={25} color="#3B82F6" style={styles.icon} />
      )}
    />
  ),
};

export const showSuccessToast = (text: string, title?: string) => {
  const formattedText = text.endsWith?.('.') ? text : `${text}.`;

  Toast.show({
    type: 'success',
    text1: title,
    text2: formattedText,
    visibilityTime: 4000,
    autoHide: true,
    swipeable: true,
    position: 'top',
  });
};

export const showErrorToast = (text: string, title?: string) => {
  const formattedText = text.endsWith?.('.') ? text : `${text}.`;

  Toast.show({
    type: 'error',
    text1: title,
    text2: formattedText,
    visibilityTime: 7000,
    autoHide: true,
    swipeable: true,
    position: 'top',
  });
};

export const showInfoToast = (text: string, title?: string) => {
  const formattedText = text.endsWith?.('.') ? text : `${text}.`;

  Toast.show({
    type: 'info',
    text1: title,
    text2: formattedText,
    visibilityTime: 4000,
    autoHide: true,
    swipeable: true,
    position: 'top',
  });
};

export const showWarningToast = (text: string, title?: string) => {
  const formattedText = text.endsWith?.('.') ? text : `${text}.`;

  Toast.show({
    type: 'warning',
    text1: title,
    text2: formattedText,
    visibilityTime: 4500,
    autoHide: true,
    swipeable: true,
    position: 'top',
  });
};

const styles = StyleSheet.create({
  success: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
    borderWidth: 1,
    borderColor: '#D1FAE5',
    zIndex: 1000000,
  },
  error: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#EF4444',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    zIndex: 1000000,
  },
  warning: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#F59E0B',
    borderWidth: 1,
    borderColor: '#FEF3C7',
    zIndex: 1000000,
  },
  info: {
    backgroundColor: '#FFFFFF',
    borderLeftWidth: 4,
    borderLeftColor: '#3B82F6',
    borderWidth: 1,
    borderColor: '#DBEAFE',
    zIndex: 1000000,
  },
  icon: {
    marginRight: -8,
  },
});

// Confirmation Modal Component
interface ConfirmationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  confirmColor?: string;
  details?: string[];
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  confirmColor = '#E53E3E',
  details = [],
}) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={modalStyles.overlay}>
        <View style={modalStyles.modalContainer}>
          {/* Header with close button */}
          <View style={modalStyles.header}>
            <TouchableOpacity style={modalStyles.closeButton} onPress={onClose}>
              <Icon name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <ScrollView
            style={modalStyles.content}
            showsVerticalScrollIndicator={false}
          >
            {/* Warning icon */}
            <View style={modalStyles.iconContainer}>
              <View
                style={[
                  modalStyles.warningIcon,
                  { backgroundColor: confirmColor },
                ]}
              >
                <Icon name="warning" size={32} color="#FFFFFF" />
              </View>
            </View>

            {/* Title */}
            <Text style={modalStyles.title}>{title}</Text>

            {/* Message */}
            <Text style={modalStyles.message}>{message}</Text>

            {/* Details */}
            {details.length > 0 && (
              <View style={modalStyles.detailsContainer}>
                {details.map((detail, index) => (
                  <View key={index} style={modalStyles.detailItem}>
                    <View style={modalStyles.bulletPoint} />
                    <Text style={modalStyles.detailText}>{detail}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Warning text */}
            <Text style={modalStyles.warningText}>
              This action cannot be undone.
            </Text>
          </ScrollView>

          {/* Buttons */}
          <View style={modalStyles.buttonContainer}>
            {/* Confirm button */}
            <TouchableOpacity
              style={[
                modalStyles.confirmButton,
                { backgroundColor: confirmColor },
              ]}
              onPress={onConfirm}
            >
              <Text style={modalStyles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>

            {/* Cancel button */}
            <TouchableOpacity
              style={modalStyles.cancelButton}
              onPress={onClose}
            >
              <Text style={modalStyles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

// Modal styles
const modalStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    maxHeight: '80%',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 16,
    paddingBottom: 0,
  },
  closeButton: {
    padding: 4,
  },
  content: {
    padding: 24,
    paddingBottom: 0,
  },
  iconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 16,
  },
  message: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  detailsContainer: {
    marginBottom: 24,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  bulletPoint: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#666666',
    marginTop: 8,
    marginRight: 12,
  },
  detailText: {
    fontSize: 15,
    color: '#666666',
    flex: 1,
    lineHeight: 22,
  },
  warningText: {
    fontSize: 14,
    color: '#E53E3E',
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 32,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 24,
    gap: 12,
  },
  confirmButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  cancelButton: {
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    backgroundColor: '#FAFAFA',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
});
