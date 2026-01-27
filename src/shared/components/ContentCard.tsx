import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import StyledText from './StyledText';
import { Check, FileText, Video, BookOpen } from 'lucide-react-native';

export interface ContentItem {
  id: string;
  title: string;
  subtitle?: string;
  type: 'quiz' | 'assignment' | 'lecture';
  isCompleted: boolean;
  points?: number;
  duration?: number;
  onPress?: () => void;
}

interface ContentCardProps {
  item: ContentItem;
}

const ContentCard: React.FC<ContentCardProps> = ({ item }) => {
  const getIcon = () => {
    switch (item.type) {
      case 'quiz':
        return <FileText size={16} color="#007AFF" />;
      case 'assignment':
        return <FileText size={16} color="#FF9500" />;
      case 'lecture':
        return <Video size={16} color="#34C759" />;
      default:
        return <FileText size={16} color="#007AFF" />;
    }
  };

  return (
    <TouchableOpacity 
      key={item.id} 
      style={[styles.contentItem, item.isCompleted && styles.contentItemCompleted]} 
      onPress={item.onPress}
    >
      <View style={styles.contentItemContent}>
        <View style={styles.checkboxContainer}>
          <View style={[styles.checkbox, item.isCompleted && styles.checkboxChecked]}>
            {item.isCompleted && <Check size={14} color="#FFFFFF" />}
          </View>
        </View>
        <View style={styles.textContent}>
          <StyledText style={styles.contentTitle}>{item.title}</StyledText>
          <StyledText style={styles.contentSubtitle}>
            {item.subtitle || item.type.charAt(0).toUpperCase() + item.type.slice(1)}
            {item.points && ` • ${item.points} points`}
            {item.duration && ` • ${item.duration} min`}
          </StyledText>
        </View>
        <View style={[styles.dotIndicator, { backgroundColor: item.isCompleted ? '#007AFF' : '#C7C7CC' }]} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  contentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  contentItemCompleted: {
    backgroundColor: '#E3F2FD',
    borderColor: '#007AFF',
  },
  contentItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkboxContainer: {
    marginRight: 12,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#C7C7CC',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxChecked: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  textContent: {
    flex: 1,
  },
  contentTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 2,
  },
  contentSubtitle: {
    fontSize: 14,
    color: '#8E8E93',
  },
  dotIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
});

export default ContentCard;
