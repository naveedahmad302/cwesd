import React from 'react';
import { View, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StyledText from './StyledText';

interface CourseListItemProps {
  course: {
    id: string;
    title: string;
    instructor: string;
    lessons: number;
    duration: string;
    level: string;
    tags: string[];
    quizScore?: string;
    grade?: string;
    status: 'completed' | 'in-progress' | 'not-started';
    completedDate?: string;
    progress: number;
    headerColor?: string;
  };
}

const CourseListItem: React.FC<CourseListItemProps> = ({ course }) => {
  return (
    <View style={styles.courseListItem}>
      <View style={[styles.iconContainer, { backgroundColor: course.headerColor || '#7c3aed' }]}>
        <Icon name="check" size={16} color="#fff" />
      </View>
      
      <View style={styles.courseDetails}>
        <View style={styles.headerRow}>
          <StyledText style={styles.courseTitle}>{course.title}</StyledText>
        </View>
        
        <StyledText style={styles.instructorName}>{course.instructor}</StyledText>
        
        <View style={styles.tagsRow}>
          <View style={styles.tag}>
            <StyledText style={styles.tagText}>{course.level}</StyledText>
          </View>
          <View style={styles.tag}>
            <StyledText style={styles.tagText}>{course.lessons} Lessons</StyledText>
          </View>
          <View style={styles.tag}>
            <StyledText style={styles.tagText}>{course.duration}</StyledText>
          </View>
          {course.tags.map((tag, index) => (
            <View key={index} style={styles.tag}>
              <StyledText style={styles.tagText}>{tag}</StyledText>
            </View>
          ))}
        </View>
        
        <View style={styles.statusRow}>
          <StyledText style={[
            styles.statusText,
            course.status === 'completed' ? styles.completedStatus :
            course.status === 'in-progress' ? styles.inProgressStatus :
            styles.notStartedStatus
          ]}>
            {course.status === 'completed' ? 'Completed' :
             course.status === 'in-progress' ? 'In Progress' :
             'Not Started'}
          </StyledText>
          {course.completedDate && (
            <StyledText style={styles.completedDate}>{course.completedDate}</StyledText>
          )}
        </View>
        
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
          <StyledText style={styles.progressText}>{course.progress}%</StyledText>
        </View>
        
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  courseListItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  courseDetails: {
    flex: 1,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  courseTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1a1a1a',
    flex: 1,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  instructorName: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: 'white',
    paddingHorizontal: 10,
    // paddingVertical: 4,
    borderWidth:1,
    borderColor:'#e0e0e0',
    borderRadius: 20,
    marginRight: 8,
    marginBottom: 4,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
//   progressText: {
//     fontSize: 14,
//     color: '#666',
//     fontWeight: '500',
//   },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  statusText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  completedStatus: {
    color: '#059669',
  },
  inProgressStatus: {
    color: '#d97706',
  },
  notStartedStatus: {
    color: '#6b7280',
  },
  completedDate: {
    fontSize: 12,
    color: '#666',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e5e7eb',
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 2,
  },
});

export default CourseListItem;
