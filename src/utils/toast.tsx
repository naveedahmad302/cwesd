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
import Toast from 'react-native-toast-message';

// Toast configuration
export const toastConfig = {
  success: (props: any) => (
    <View style={[styles.toastContainer, styles.successToast]}>
      <Text style={[styles.toastText, styles.successText]}>{props.text1}</Text>
      {props.text2 && <Text style={[styles.toastSubtext, styles.successText]}>{props.text2}</Text>}
    </View>
  ),
  error: (props: any) => (
    <View style={[styles.toastContainer, styles.errorToast]}>
      <Text style={[styles.toastText, styles.errorText]}>{props.text1}</Text>
      {props.text2 && <Text style={[styles.toastSubtext, styles.errorText]}>{props.text2}</Text>}
    </View>
  ),
  info: (props: any) => (
    <View style={[styles.toastContainer, styles.infoToast]}>
      <Text style={[styles.toastText, styles.infoText]}>{props.text1}</Text>
      {props.text2 && <Text style={[styles.toastSubtext, styles.infoText]}>{props.text2}</Text>}
    </View>
  ),
};

// Named export functions for utilities (following the requirement)
export const showSuccessToast = (message: string, title?: string) => {
  console.log('showSuccessToast:', { message, title });
  Toast.show({
    type: 'success',
    text1: title || 'Success',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

export const showErrorToast = (message: string, title?: string) => {
  console.log('showErrorToast:', { message, title });
  Toast.show({
    type: 'error',
    text1: title || 'Error',
    text2: message,
    position: 'top',
    visibilityTime: 4000,
  });
};

export const showInfoToast = (message: string, title?: string) => {
  console.log('showInfoToast:', { message, title });
  Toast.show({
    type: 'info',
    text1: title || 'Info',
    text2: message,
    position: 'top',
    visibilityTime: 3000,
  });
};

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
          <ScrollView style={modalStyles.content} showsVerticalScrollIndicator={false}>
            {/* Warning icon */}
            <View style={modalStyles.iconContainer}>
              <View style={[modalStyles.warningIcon, { backgroundColor: confirmColor }]}>
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
            <Text style={modalStyles.warningText}>This action cannot be undone.</Text>
          </ScrollView>

          {/* Buttons */}
          <View style={modalStyles.buttonContainer}>
            {/* Confirm button */}
            <TouchableOpacity 
              style={[modalStyles.confirmButton, { backgroundColor: confirmColor }]} 
              onPress={onConfirm}
            >
              <Text style={modalStyles.confirmButtonText}>{confirmText}</Text>
            </TouchableOpacity>

            {/* Cancel button */}
            <TouchableOpacity style={modalStyles.cancelButton} onPress={onClose}>
              <Text style={modalStyles.cancelButtonText}>{cancelText}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  // Toast styles
  toastContainer: {
    padding: 16,
    borderRadius: 10,
    marginHorizontal: 0,
    width: '95%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  toastSubtext: {
    fontSize: 14,
    fontWeight: '400',
  },
  successToast: {
    backgroundColor: '#4CAF50',
  },
  successText: {
    color: '#FFFFFF',
  },
  errorToast: {
    backgroundColor: '#F44336',
  },
  errorText: {
    color: '#FFFFFF',
  },
  infoToast: {
    backgroundColor: '#2196F3',
  },
  infoText: {
    color: '#FFFFFF',
  },
});

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