import React, { useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import StyledText from '../../shared/components/StyledText';

export interface Module {
  id: string;
  title: string;
  completed: boolean;
  date?: string;
  score?: string;
}

interface CertificateCardProps {
  item: Module;
}

const CertificateCard = React.memo(({ item }: CertificateCardProps) => {
  const handleDownload = useCallback(() => {
    // Handle download logic
    console.log(`Downloading certificate for ${item.title}`);
  }, [item.title]);

  return (
    <View style={styles.moduleItem}>
      <View style={styles.moduleInfo}>
        <View style={styles.moduleHeader}>
          <StyledText style={styles.moduleTitle}>{item.title}</StyledText>
          {item.completed ? (
            <View style={styles.completedIcon}>
              <StyledText style={styles.checkmark}>✓</StyledText>
            </View>
          ) : (
            <View style={styles.lockIcon}>
              <StyledText style={styles.lock}>🔒</StyledText>
            </View>
          )}
        </View>
        {item.completed && item.date && (
          <StyledText style={styles.moduleDate}>Completed on {item.date}</StyledText>
        )}
        {item.completed && item.score && (
          <StyledText style={styles.moduleScore}>Score: {item.score}</StyledText>
        )}
        {!item.completed && (
          <StyledText style={styles.notCompletedText}>Not completed yet</StyledText>
        )}
      </View>
      {item.completed && (
        <TouchableOpacity style={styles.downloadButton} onPress={handleDownload}>
          <StyledText style={styles.downloadButtonText}>Download</StyledText>
        </TouchableOpacity>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  moduleItem: {
    backgroundColor: '#fff',
    marginBottom: 12,
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  moduleInfo: {
    flex: 1,
  },
  moduleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  moduleTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    flex: 1,
    marginRight: 12,
  },
  completedIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#28a745',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  lockIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  lock: {
    fontSize: 16,
  },
  moduleDate: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  moduleScore: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  notCompletedText: {
    fontSize: 14,
    color: '#dc3545',
  },
  downloadButton: {
    backgroundColor: '#007bff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
    marginLeft: 12,
  },
  downloadButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default CertificateCard;
