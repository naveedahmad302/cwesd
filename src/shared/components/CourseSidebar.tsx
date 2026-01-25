import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import StyledText from './StyledText';
import { X, BookOpen, FileText, Video, Users, MessageSquare } from 'lucide-react-native';

interface CourseSidebarProps {
  isVisible: boolean;
  onClose: () => void;
}

const CourseSidebar: React.FC<CourseSidebarProps> = ({ isVisible, onClose }) => {
  if (!isVisible) return null;

  return (
    <View style={styles.overlay}>
      <View style={styles.sidebar}>
        {/* Header */}
        <View style={styles.sidebarHeader}>
          <StyledText style={styles.sidebarTitle}>Course Content</StyledText>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <X size={20} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Sidebar Items */}
        <ScrollView 
          style={styles.sidebarContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Lectures Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <BookOpen size={20} color="#8E8E93" />
              <StyledText style={styles.sectionTitle}>Lectures</StyledText>
            </View>
            <View style={styles.emptyContent}>
              <Video size={24} color="#C7C7CC" />
              <StyledText style={styles.emptyText}>No lectures available</StyledText>
            </View>
          </View>

          {/* Quizzes Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#8E8E93" />
              <StyledText style={styles.sectionTitle}>Quizzes</StyledText>
            </View>
            <View style={styles.emptyContent}>
              <FileText size={24} color="#C7C7CC" />
              <StyledText style={styles.emptyText}>No quizzes available</StyledText>
            </View>
          </View>

          {/* Assignments Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <FileText size={20} color="#8E8E93" />
              <StyledText style={styles.sectionTitle}>Assignments</StyledText>
            </View>
            <View style={styles.emptyContent}>
              <FileText size={24} color="#C7C7CC" />
              <StyledText style={styles.emptyText}>No assignments available</StyledText>
            </View>
          </View>

          {/* Discussions Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Users size={20} color="#8E8E93" />
              <StyledText style={styles.sectionTitle}>Discussions</StyledText>
            </View>
            <View style={styles.discussionItem}>
              <View style={styles.discussionContent}>
                <View style={styles.discussionHeader}>
                  <MessageSquare size={16} color="#007AFF" />
                  <View style={styles.dot} />
                  <StyledText style={styles.discussionTitle}>Announcements</StyledText>
                </View>
                <StyledText style={styles.discussionSubtitle}>Forum</StyledText>
              </View>
            </View>
          </View>
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 9999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: 350,
    backgroundColor: '#fff',
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
    zIndex: 9999,
  },
  sidebarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5EA',
  },
  sidebarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sidebarContent: {
    flex: 1,
    paddingVertical: 8,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F2F2F7',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  discussionItem: {
    backgroundColor: '#E3F2FD',
    borderRadius: 8,
    padding: 12,
  },
  discussionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  discussionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  discussionTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
    marginLeft: 8,
  },
  discussionSubtitle: {
    fontSize: 12,
    color: '#8E8E93',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#007AFF',
    marginLeft: 8,
  },
});

export default CourseSidebar;
