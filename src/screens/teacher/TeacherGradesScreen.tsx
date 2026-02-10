import React, { useState, useCallback } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, Modal, FlatList, Pressable, RefreshControl } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import { Download, MessageSquare, Calendar, RefreshCw, Clock, CheckCircle, Users, FileText, TrendingUp, AlertCircle, Search, BookOpen, Filter, ChevronDown, Check } from 'lucide-react-native';

const TeacherGradesScreen = () => {
  const [searchText, setSearchText] = useState('');
  const [selectedCourse, setSelectedCourse] = useState('All Courses');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [activeTab, setActiveTab] = useState('table');
  const [refreshing, setRefreshing] = useState(false);

  const [showCourseModal, setShowCourseModal] = useState(false);
  const [showStatusModal, setShowStatusModal] = useState(false);

  // Assignment grade stats
  const [assignmentStats, setAssignmentStats] = useState({
    pendingGrades: 0,
    graded: 0,
    notSubmitted: 0,
    totalAssignments: 0,
  });

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

  const courses = ['All Courses', 'DM-SPR-2026', 'ML-ADV-INT-2026', 'AI-INTRO-2026'];
  const statuses = ['All Status', 'Submitted', 'Graded', 'Overdue', 'Draft'];

  const handleCourseSelect = (course: string) => {
    setSelectedCourse(course);
    setShowCourseModal(false);
  };

  const handleStatusSelect = (status: string) => {
    setSelectedStatus(status);
    setShowStatusModal(false);
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#E56B8C']} />
        }
      >
        {/* <StyledText style={styles.title}>Grades</StyledText>
        <StyledText style={styles.subtitle}>Manage student grades</StyledText>
         */}
        
        
        {/* Assignment Grade Cards */}
        <View style={styles.statsContainer}>
          <View style={styles.card}>
            <View>
              <StyledText style={styles.cardTitle}>Pending Grades</StyledText>
              <StyledText style={styles.cardValue}>{assignmentStats.pendingGrades}</StyledText>
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <StyledText style={styles.cardTitle}>Graded</StyledText>
              <StyledText style={styles.cardValue}>{assignmentStats.graded}</StyledText>
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <StyledText style={styles.cardTitle}>Not Submitted</StyledText>
              <StyledText style={styles.cardValue}>{assignmentStats.notSubmitted}</StyledText>
            </View>
          </View>

          <View style={styles.card}>
            <View>
              <StyledText style={styles.cardTitle}>Total Assignments</StyledText>
              <StyledText style={styles.cardValue}>{assignmentStats.totalAssignments}</StyledText>
            </View>
          </View>
        </View>
        {/* Assignment Management Section */}
        <View style={styles.assignmentManagementSection}>
          {/* Search and Filter Bar */}
          <View style={styles.searchFilterContainer}>
            <View style={styles.searchBar}>
              <Search size={18} color="black" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search submissions..."
                value={searchText}
                onChangeText={setSearchText}
                placeholderTextColor="black"
              />
            </View>
            
            <View style={styles.filterButtons}>
              <TouchableOpacity style={styles.filterButton} onPress={() => setShowCourseModal(true)}>
                <BookOpen size={16} color="#6B7280" />
                <StyledText style={styles.filterButtonText}>{selectedCourse}</StyledText>
                <ChevronDown size={16} color="#6B7280" />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.filterButton} onPress={() => setShowStatusModal(true)}>
                <Filter size={16} color="#6B7280" />
                <StyledText style={styles.filterButtonText}>{selectedStatus}</StyledText>
                <ChevronDown size={16} color="#6B7280" />
              </TouchableOpacity>
            </View>
            
            <StyledText style={styles.assignmentCount}>0 of 0 assignments</StyledText>
          </View>

          {/* Navigation Tabs */}
          <View style={styles.tabsContainer}>
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'table' && styles.activeTab]}
              onPress={() => setActiveTab('table')}
            >
              <StyledText style={[styles.tabText, activeTab === 'table' && styles.activeTabText]}>
                Table View
              </StyledText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
              onPress={() => setActiveTab('analytics')}
            >
              <StyledText style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
                Assignment Analytics
              </StyledText>
            </TouchableOpacity>
          </View>

          {/* Main Content Card */}
          {activeTab === 'table' ? (
            <View style={styles.contentCard}>
              <ScrollView horizontal showsHorizontalScrollIndicator={true}>
                <View>
                  {/* Table Header */}
                  <View style={styles.tableHeader}>
                    <StyledText style={styles.headerText}>Assignment</StyledText>
                    <StyledText style={styles.headerText}>Course</StyledText>
                    <StyledText style={styles.headerText}>Submissions</StyledText>
                    <StyledText style={styles.headerText}>Graded</StyledText>
                    <StyledText style={styles.headerText}>Actions</StyledText>
                  </View>

                  {/* Empty State */}
                  <View style={styles.emptyState}>
                    <View style={styles.targetIconLarge}>
                      <View style={styles.targetOuter} />
                      <View style={styles.targetMiddle} />
                      <View style={styles.targetInner} />
                    </View>
                    <StyledText style={styles.emptyStateTitle}>No assignments found</StyledText>
                    <StyledText style={styles.emptyStateSubtitle}>
                      No assignments are available at the moment
                    </StyledText>
                  </View>
                </View>
              </ScrollView>
            </View>
          ) : (
            <View style={styles.analyticsContent}>
              <View style={styles.analyticsCard}>
                <StyledText style={styles.analyticsCardTitle}>Assignment Status Distribution</StyledText>
                <View style={styles.statusItem}>
                  <StyledText style={styles.statusLabel}>Submitted</StyledText>
                  <StyledText style={styles.statusValue}>0 (0%)</StyledText>
                </View>
                <View style={styles.statusItem}>
                  <StyledText style={styles.statusLabel}>Graded</StyledText>
                  <StyledText style={styles.statusValue}>0 (0%)</StyledText>
                </View>
                <View style={styles.statusItem}>
                  <StyledText style={styles.statusLabel}>Unknown</StyledText>
                  <StyledText style={styles.statusValue}>0 (0%)</StyledText>
                </View>
                <View style={styles.statusItem}>
                  <StyledText style={styles.statusLabel}>Draft</StyledText>
                  <StyledText style={styles.statusValue}>0 (0%)</StyledText>
                </View>
              </View>

              <View style={styles.analyticsCard}>
                <StyledText style={styles.analyticsCardTitle}>Assignment Progress</StyledText>
                <View style={styles.analyticsProgressItem}>
                  <StyledText style={styles.analyticsProgressLabel}>Graded</StyledText>
                  <Check size={16} color="#28A745" />
                  <StyledText style={styles.analyticsProgressValue}>0</StyledText>
                </View>
                <View style={styles.analyticsProgressItem}>
                  <StyledText style={styles.analyticsProgressLabel}>Pending Grades</StyledText>
                  <Clock size={16} color="#FFC107" />
                  <StyledText style={styles.analyticsProgressValue}>0</StyledText>
                </View>
                <View style={styles.analyticsProgressItem}>
                  <StyledText style={styles.analyticsProgressLabel}>Not Submitted</StyledText>
                  <AlertCircle size={16} color="#DC3545" />
                  <StyledText style={styles.analyticsProgressValue}>0</StyledText>
                </View>
                <View style={styles.analyticsProgressItem}>
                  <StyledText style={styles.analyticsProgressLabel}>Completion Rate</StyledText>
                  <StyledText style={styles.completionRateValue}>0%</StyledText>
                </View>
              </View>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Course Dropdown Modal */}
      <Modal
        visible={showCourseModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCourseModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowCourseModal(false)}>
          <View style={styles.dropdownContainer}>
            <FlatList
              data={courses}
              keyExtractor={(item) => item}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleCourseSelect(item)}
                >
                  <StyledText style={styles.dropdownText}>{item}</StyledText>
                  {selectedCourse === item && (
                    <Check size={16} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>

      {/* Status Dropdown Modal */}
      <Modal
        visible={showStatusModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowStatusModal(false)}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setShowStatusModal(false)}>
          <View style={styles.dropdownContainer}>
            <FlatList
              data={statuses}
              keyExtractor={(item: string) => item}
              renderItem={({ item }: { item: string }) => (
                <TouchableOpacity
                  style={styles.dropdownItem}
                  onPress={() => handleStatusSelect(item)}
                >
                  <StyledText style={styles.dropdownText}>{item}</StyledText>
                  {selectedStatus === item && (
                    <Check size={16} color="#8B5CF6" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </Pressable>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 24,
  },
  buttonContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24,
  },
  buttonRow:{
    flexDirection:'row',
    gap: 12,
  },
  exportButton: {
    backgroundColor: '#E56B8C',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  exportButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: '#F8F9FA',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E5EA',
    gap: 8,
  },
  secondaryButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '600',
  },
  // Stats container for assignment grade cards
  statsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 10,
  },
  card: {
    width: '48%',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 13,
    color: '#888888',
  },
  cardValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'black',
  },
  cardsContainer: {
    flexDirection: 'column',
    gap: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  viewAllText: {
    fontSize: 14,
    color: '#E56B8C',
    fontWeight: '600',
  },
  assignmentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: 12,
  },
  cardTitleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  assignmentTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  assignmentClass: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusPending: {
    backgroundColor: '#FFF3CD',
  },
  statusGraded: {
    
    backgroundColor: '#D4EDDA',
  },
  statusOverdue: {
    backgroundColor: '#F8D7DA',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
  },
  cardStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  progressSection: {
    flex: 1,
  },
  progressLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#F0F0F0',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E56B8C',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 12,
    color: '#666',
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  scoreValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#28A745',
  },
  gradeButton: {
    backgroundColor: '#E56B8C',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  gradeButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reviewButton: {
    backgroundColor: '#28A745',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reviewButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  reminderButton: {
    backgroundColor: '#FF9500',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  reminderButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  statCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statContent: {
    flex: 1,
  },
  statTitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
  },
  statIconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FF4444',
  },
  targetIcon: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#4A90E2',
    position: 'relative',
  },
  // Assignment Management Styles
  assignmentManagementSection: {
    marginTop: 32,
  },
  searchFilterContainer: {
    marginBottom: 10,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 16,
    // paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: '#1F2937',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 5,
    marginBottom: 5,
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 6,
  },
  filterButtonText: {
    fontSize: 14,
    color: 'black',
    fontWeight: '500',
  },
  assignmentCount: {
    fontSize: 14,
    color: 'black',
    textAlign: 'right',
  },
  tabsContainer: {
    borderRadius: 8,
    backgroundColor: '#F0F0FF',
    flexDirection: 'row',
    gap: 8,
    marginBottom: 20,
    width: '100%',
  },
  tab: {
    margin:5,
    // backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  activeTab: {
    backgroundColor: 'white',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'black',
  },
  activeTabText: {
    color: 'black',
  },
  contentCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical:10,
    paddingHorizontal: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    marginBottom: 20,
    minWidth: 600,
  },
  headerText: {
    width: 120,
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    paddingHorizontal: 8,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    minWidth: 600,
  },
  targetIconLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  targetOuter: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 8,
    borderColor: '#E5E7EB',
  },
  targetMiddle: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 6,
    borderColor: '#9CA3AF',
  },
  targetInner: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#6B7280',
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
  analyticsContent: {
    // backgroundColor:'blue',
    // paddingVertical: 20,
    gap: 12,
  },
  analyticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    borderWidth:1,
    borderColor:'#F3F4F6',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    
  },
  analyticsCardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 16,
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  statusLabel: {
    fontSize: 16,
    color: 'black',
  },
  statusValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  analyticsProgressItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  analyticsProgressLabel: {
    fontSize: 16,
    color: 'black',
    flex: 1,
  },
  analyticsProgressValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  completionRateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B5CF6',
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    paddingTop: 200,
    paddingHorizontal: 20,
  },
  dropdownContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
});

export default TeacherGradesScreen;
