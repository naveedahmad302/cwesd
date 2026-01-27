import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import StyledText from './StyledText';

interface CourseCardProps {
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
    status: 'completed' | 'in-progress' | 'not-started' | 'Locked';
    completedDate?: string;
    progress: number;
    headerColor?: string;
    moodleId?: number; // Add moodleId property
  };
}

const CourseCard: React.FC<CourseCardProps> = ({ course }) => {
  const navigation = useNavigation();

  const handleCardPress = () => {
    (navigation as any).navigate('CourseDetail', { course });
  };

  return (
    <TouchableOpacity 
      style={styles.courseCard}
      onPress={handleCardPress}
      activeOpacity={0.8}
    >
      <View style={[styles.cardHeader, { backgroundColor: course.headerColor || '#7c3aed' }]}>
        <View style={styles.headerTop}>
          <View style={styles.headerTags}>
            <View style={styles.tag}>
              <StyledText style={styles.tagText}>{course.lessons} Lessons</StyledText>
            </View>
            <View style={styles.tag}>
              <StyledText style={styles.tagText}>{course.duration}</StyledText>
            </View>
          </View>
          {course.status === 'completed' && (
            <View style={styles.checkmarkContainer}>
              <Icon name="check" size={16} color={course.headerColor || '#7c3aed'} />
              
            </View>
          )}
        </View>
        <View style={styles.headerBottom}>
          <View style={styles.beginnerTag}>
            <StyledText style={styles.beginnerText}>{course.level}</StyledText>
          </View>
          <StyledText style={styles.instructorName}>{course.instructor}</StyledText>
        </View>
      </View>
      
      <View style={styles.cardBody}>
        <StyledText style={styles.courseTitle}>{course.title}</StyledText>
        
        <View style={styles.courseTags}>
          {course.tags.map((tag, index) => (
            <View key={index} style={styles.courseTag}>
              <StyledText style={styles.courseTagText}>{tag}</StyledText>
            </View>
          ))}
          {course.quizScore && (
            <View style={styles.courseTag}>
              <StyledText style={styles.courseTagText}>Quiz: {course.quizScore}</StyledText>
            </View>
          )}
          {course.grade && (
            <View style={styles.courseTag}>
              <StyledText style={styles.courseTagText}>Grade: {course.grade}</StyledText>
            </View>
          )}
        </View>
        
        <View style={styles.completionSection}>
          <StyledText style={[
            styles.completionStatus,
            course.status === 'completed' ? styles.completedStatus :
            course.status === 'in-progress' ? styles.inProgressStatus :
            course.status === 'Locked' ? styles.lockedStatus :
            styles.notStartedStatus
          ]}>
            {course.status === 'completed' ? 'Completed' :
             course.status === 'in-progress' ? 'In Progress' :
             course.status === 'Locked' ? 'Locked' :
             'Not Started'}
          </StyledText>
          {course.completedDate && (
            <StyledText style={styles.completedDate}>{course.completedDate}</StyledText>
          )}
        </View>
        

        <View style={styles.progressContainer}>
            <View><StyledText style={styles.completedDate}>Progress:</StyledText></View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${course.progress}%` }]} />
          </View>
          <StyledText style={styles.progressText}>{course.progress}%</StyledText>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  courseCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 16,
  },
  cardHeader: {
    backgroundColor: '#7c3aed',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    padding: 16,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 80,
  },
  headerTags: {
    flexDirection: 'row',
  },
  tag: {
    backgroundColor: '#F0F0FF',
    paddingHorizontal: 10,
    // paddingVertical: 0,
    borderRadius: 20,
    marginRight: 8,
  },
  tagText: {
    fontSize: 12,
    color: '',
    fontWeight: '500',
  },
  checkmarkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  beginnerTag: {
   backgroundColor: '#F0F0FF',
    paddingHorizontal: 10,
    paddingVertical: 2,
    borderRadius: 20,

  },
  beginnerText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '500',
  },
  instructorName: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
  },
  cardBody: {
    padding: 16,
  },
  courseTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  courseTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  courseTag: {
    // backgroundColor: '#f3f4f6',
    paddingHorizontal: 8,
    paddingVertical: 0,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#e5e7eb',
    marginRight: 8,
    marginBottom: 4,
  },
  courseTagText: {
    fontSize: 12,
    color: 'black',
    fontWeight: '500',
  },
  completionSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  completionStatus: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
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
  lockedStatus: {
    color: '#9ca3af',
  },
  completedDate: {
    paddingRight:5,
    fontSize: 12,
    color: '#666',
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  progressBar: {
    flex: 1,
    height: 6,
    backgroundColor: '#e5e7eb',
    borderRadius: 3,
    marginRight: 12,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
  },
});

export default CourseCard;
