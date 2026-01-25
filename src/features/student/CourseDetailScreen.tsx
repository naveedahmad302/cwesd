import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import StyledText from '../../shared/components/StyledText';
import CourseSidebar from '../../shared/components/CourseSidebar';
import { MessageSquare, ExternalLink, Menu, CircleCheckBig } from 'lucide-react-native';

const CourseDetailScreen: React.FC = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { course } = route.params as { course: any };
  const [showSidebar, setShowSidebar] = useState(false);

  const handleHeaderClick = () => {
    setShowSidebar(true);
  };

  const handleCloseSidebar = () => {
    setShowSidebar(false);
  };

  const handleOpenContent = () => {
    // Handle opening course content
    console.log('Opening course content for:', course.title);
  };

  const handleOpenInMoodle = () => {
    // Handle opening in Moodle
    console.log('Opening in Moodle:', course.title);
  };

  const handleMarkComplete = () => {
    // Handle marking as complete
    console.log('Marking as complete:', course.title);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <TouchableOpacity style={styles.header} onPress={handleHeaderClick}>
          <View style={styles.menuButton}>
            <Menu size={17} color="#000" />
          </View>
          <StyledText style={styles.title}>Course Content</StyledText>
        </TouchableOpacity>

        {/* Announcements Card */}
        <View style={styles.announcementsCard}>
          <View style={styles.cardHeader}>
            <View style={styles.iconContainer}>
              <MessageSquare size={32} color="#E56B8C" />
            </View>
            <View style={styles.headerContent}>
              <StyledText style={styles.cardTitle}>Announcements</StyledText>
              <StyledText style={styles.cardSubtitle}>
                Join the discussion with your classmates
              </StyledText>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.openContentButton}
            onPress={handleOpenContent}
          >
            <ExternalLink strokeWidth={1.75} size={20} color="#fff" style={styles.buttonIcon} />
            <StyledText style={styles.openContentText}>Open Content</StyledText>
          </TouchableOpacity>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.moodleButton}
            onPress={handleOpenInMoodle}
          >
            <ExternalLink size={20} color="#fff" style={styles.buttonIcon} />
            <StyledText style={styles.moodleButtonText}>Open in Moodle</StyledText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={handleMarkComplete}
          >
            <CircleCheckBig strokeWidth={1.75} size={20} color="black" style={styles.buttonIcon} />
            <StyledText style={styles.completeButtonText}>Mark Complete</StyledText>
          </TouchableOpacity>
        </View>
      </ScrollView>
      
      {/* Sidebar */}
      <CourseSidebar isVisible={showSidebar} onClose={handleCloseSidebar} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    backgroundColor:'#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 5,
    borderRadius: 8,
    margin: 20,
    // paddingTop: 60,
    // backgroundColor: '#fff',
    // borderWidth: 1,
    // borderColor: '#e9ecef',
    borderWidth: 1,
    borderColor: '#e0e0e0ff',
    width: '51%',
  },
  menuButton: {
    marginRight: 10,
    padding: 4,
    
  },
  title: {
    fontSize: 17,
    // fontWeight: 'bold',
    color: '#212529',
  },
  announcementsCard: {
    margin: 20,
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    
  },
  cardHeader: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 12,
    backgroundColor: '#FFE4E1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  headerContent: {
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#212529',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    lineHeight: 22,
    textAlign: 'center',
  },
  openContentButton: {
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 70,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    marginTop: 10,
  },
  openContentText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  actionButtons: {
    paddingHorizontal: 20,
    paddingBottom: 30,
    gap: 12,
  },
  moodleButton: {
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    marginRight: 8,
  },
  moodleButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginLeft: 10,
  },
  completeButton: {
    backgroundColor: '#F8FAFD',
    borderWidth: 1,
    borderColor: '#e6e6e6ff',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    margin: 4,
    shadowColor: '#00000055',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
    marginLeft: 10,
  },
});

export default CourseDetailScreen;
