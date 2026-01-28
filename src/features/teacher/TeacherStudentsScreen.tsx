import React, { useState, useMemo, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, TextInput, ActivityIndicator, Image } from 'react-native';
import StyledText from '../../shared/components/StyledText';
import { UserPlus, Mail, Download, Users, GraduationCap, TrendingUp, Award, Search, SlidersHorizontal, Eye, MessageSquare, MoreVertical } from 'lucide-react-native';
import { apiClient } from '../../services/api';

const TeacherStudentsScreen = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All Status');
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const statusOptions = ['All Status', 'Active', 'Offline'];

  // Helper function to format last active time
  const formatLastActive = (lastSeen: string) => {
    if (!lastSeen) return 'Never';
    const now = new Date();
    const lastSeenDate = new Date(lastSeen);
    const diffMs = now.getTime() - lastSeenDate.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return lastSeenDate.toLocaleDateString();
  };

  // Fetch students from API
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get('/api/users/students');
      console.log('API Response:', response.data);
      
      if (response.data.success && response.data.data) {
        console.log('Students data:', response.data.data);
        
        // Map API response to our component structure
        const mappedStudents = response.data.data.map((student: any) => {
          console.log('Processing student:', student.name, 'Online:', student.presence?.isOnline);
          
          return {
            id: student._id,
            name: student.name,
            email: student.email,
            status: student.presence?.isOnline ? 'Active' : 'Offline',
            progress: Math.floor(Math.random() * 100), // Random progress for demo
            batch: student.enrolledCourses && student.enrolledCourses.length > 0 
              ? `Batch ${student.enrolledCourses[0].batch || 'A'}` 
              : 'Batch A',
            grade: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)], // Random grade for demo
            lastActive: student.presence?.lastSeen 
              ? formatLastActive(student.presence.lastSeen) 
              : 'Never',
            picture: student.picture,
            age: student.age,
            qualification: student.qualification,
            contactNumber: student.contactNumber,
            moodleSyncStatus: student.moodleDetails?.moodleSyncStatus || 'not_attempted',
            fatherName: student.fatherName,
            address: student.address,
            enrolledCourses: student.enrolledCourses || []
          };
        });
        
        console.log('Mapped students:', mappedStudents);
        setStudents(mappedStudents);
      } else {
        console.log('No success or no data in response');
        setStudents([]);
      }
    } catch (err) {
      console.error('Error fetching students:', err);
      setError('Failed to fetch students');
      setStudents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student: any) => {
      const matchesSearch = searchQuery === '' || 
        student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesStatus = selectedStatus === 'All Status' || student.status === selectedStatus;
      
      return matchesSearch && matchesStatus;
    });
  }, [searchQuery, selectedStatus, students]);

  // Calculate stats from students data
  const stats = useMemo(() => {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.status === 'Active').length;
    const avgProgress = students.length > 0 
      ? Math.round(students.reduce((sum, s) => sum + s.progress, 0) / students.length)
      : 0;
    const highPerformers = students.filter(s => s.progress >= 80).length;

    console.log('Stats calculation:', {
      totalStudents,
      activeStudents,
      avgProgress,
      highPerformers,
      studentsLength: students.length
    });

    return {
      totalStudents,
      activeStudents,
      avgProgress,
      highPerformers
    };
  }, [students]);

  const handleStatusFilter = (status: string) => {
    setSelectedStatus(status);
    setShowStatusDropdown(false);
  };
  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#E56B8C" />
        <StyledText style={styles.loadingText}>Loading students...</StyledText>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <StyledText style={styles.errorText}>{error}</StyledText>
        <TouchableOpacity style={styles.retryButton} onPress={fetchStudents}>
          <StyledText style={styles.retryButtonText}>Retry</StyledText>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.buttonRow}>
          <TouchableOpacity style={styles.inviteButton}>
            <UserPlus color="white" size={20} />
            <StyledText style={styles.inviteButtonText}>Invite Students</StyledText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.announcementButton}>
            <Mail color="black" size={20} />
            <StyledText style={styles.announcementButtonText}>Send Announcement</StyledText>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity style={styles.exportButton}>
          <Download color="black" size={20} />
          <StyledText style={styles.exportButtonText}>Export List</StyledText>
        </TouchableOpacity>

        <View style={styles.card}>
          <View>
            <StyledText style={styles.cardTitle}>Total Students</StyledText>
            <StyledText style={styles.cardNumber}>{stats.totalStudents}</StyledText>
          </View>
          <Users color="black" size={40} />
        </View>

        <View style={styles.card}>
          <View>
            <StyledText style={styles.cardTitle}>Active Students</StyledText>
            <StyledText style={styles.cardNumber}>{stats.activeStudents}</StyledText>
          </View>
          <GraduationCap color="black" size={40} />
        </View>

        <View style={styles.card}>
          <View>
            <StyledText style={styles.cardTitle}>Avg. Progress</StyledText>
            <StyledText style={styles.cardNumber}>{stats.avgProgress}%</StyledText>
          </View>
          <TrendingUp color="black" size={40} />
        </View>

        <View style={styles.card}>
          <View>
            <StyledText style={styles.cardTitle}>High Performers</StyledText>
            <StyledText style={styles.cardNumber}>{stats.highPerformers}</StyledText>
          </View>
          <Award color="black" size={40} />
        </View>

        <View style={styles.searchFilterContainer}>
          <View style={styles.searchBar}>
            <Search color="black" size={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search students..."
              placeholderTextColor="black"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={styles.filterContainer}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowStatusDropdown(!showStatusDropdown)}
            >
              <SlidersHorizontal color="black" size={20} />
              <StyledText style={styles.filterText}>{selectedStatus}</StyledText>
            </TouchableOpacity>
            {showStatusDropdown && (
              <View style={styles.dropdown}>
                {statusOptions.map((status) => (
                  <TouchableOpacity
                    key={status}
                    style={styles.dropdownItem}
                    onPress={() => handleStatusFilter(status)}
                  >
                    <StyledText style={styles.dropdownItemText}>{status}</StyledText>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>
        </View>

        <View style={styles.tableHeader}>
          <StyledText style={styles.tableHeaderText}>{filteredStudents.length} of {students.length} students</StyledText>
        </View>

        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={true}
          style={styles.horizontalScrollContainer}
        >
          <View style={styles.studentsTable}>
            <View style={styles.tableHeaderRow}>
              <StyledText style={[styles.columnHeader, styles.studentColumn]}>Student</StyledText>
              <StyledText style={[styles.columnHeader, styles.statusColumn]}>Status</StyledText>
              <StyledText style={[styles.columnHeader, styles.progressColumn]}>Progress</StyledText>
              <StyledText style={[styles.columnHeader, styles.batchColumn]}>Batch</StyledText>
              <StyledText style={[styles.columnHeader, styles.gradeColumn]}>Grade</StyledText>
              <StyledText style={[styles.columnHeader, styles.lastActiveColumn]}>Last Active</StyledText>
              <StyledText style={[styles.columnHeader, styles.actionsColumn]}>Actions</StyledText>
            </View>
            {filteredStudents.map((student) => (
              <View key={student.id} style={styles.studentRow}>
                <View style={[styles.studentInfo, styles.studentColumn]}>
                  <View style={styles.avatarContainer}>
                    {student.picture ? (
                      <Image source={{ uri: student.picture }} style={styles.studentPicture} />
                    ) : (
                      <View style={styles.avatar}>
                        <StyledText style={styles.avatarText}>{student.name.split(' ').map((n: any) => n[0]).join('')}</StyledText>
                      </View>
                    )}
                  </View>
                  <View style={styles.studentDetails}>
                    <StyledText style={styles.studentName}>{student.name}</StyledText>
                    <StyledText style={styles.studentEmail}>{student.email}</StyledText>
                  </View>
                </View>
                <View style={[styles.statusContainer, styles.statusColumn]}>
                  <View style={[styles.statusBadge, { backgroundColor: student.status === 'Active' ? '#10B981' : '#6B7280' }]}>
                    <StyledText style={styles.statusText}>{student.status}</StyledText>
                  </View>
                </View>
                <View style={[styles.progressContainer, styles.progressColumn]}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${student.progress}%` }]} />
                  </View>
                  <StyledText style={styles.progressText}>{student.progress}%</StyledText>
                </View>
                <StyledText style={[styles.batchText, styles.batchColumn]}>{student.batch}</StyledText>
                <StyledText style={[styles.gradeText, styles.gradeColumn]}>{student.grade}</StyledText>
                <StyledText style={[styles.lastActiveText, styles.lastActiveColumn]}>{student.lastActive}</StyledText>
                <View style={[styles.actionsContainer, styles.actionsColumn]}>
                  <TouchableOpacity style={styles.actionButton}>
                    <Eye color="#888888" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <MessageSquare color="#888888" size={16} />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.actionButton}>
                    <MoreVertical color="#888888" size={16} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>
        </ScrollView>
      </ScrollView>
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
  buttonRow: {
    width:'65%',
    flexDirection: 'column',
    marginBottom: 6,
  },
  inviteButton: {
    
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E56B8C',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 8,
    marginBottom: 5,
  },
  inviteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  announcementButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
  },
  announcementButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  exportButton: {
    width: '50%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    gap: 8,
    borderColor: '#E0E0E0',
    borderWidth: 1,
    marginBottom: 20,
  },
  exportButtonText: {
    color: 'black',
    fontSize: 16,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 16,
    color: 'black',
    marginBottom: 4,
  },
  cardNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'black',
  },
  searchFilterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    // paddingVertical: 1,
    flex: 1,
    marginRight: 10,
  },
  searchPlaceholder: {
    marginLeft: 8,
    color: 'black',
    fontSize: 16,
  },
  searchInput: {
    marginLeft: 8,
    flex: 1,
    fontSize: 16,
    color: 'black',
  },
  filterContainer: {
    position: 'relative',
  },
  dropdown: {
    position: 'absolute',
    top: '100%',
    right: 0,
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    marginTop: 5,
    zIndex: 1000,
    minWidth: 120,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dropdownItem: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: 'black',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
  },
  filterText: {
    fontSize: 14,
    color: 'black',
  },
  tableHeader: {
    marginBottom: 10,
  },
  tableHeaderText: {
    fontSize: 14,
    color: 'black',
  },
  studentsTable: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    minWidth: 810,
  },
  studentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  studentInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarContainer: {
    marginRight: 12,
  },
  studentPicture: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E56B8C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  studentDetails: {
    flex: 1,
  },
  studentName: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginBottom: 2,
  },
  studentEmail: {
    fontSize: 14,
    color: 'black',
  },
  statusContainer: {
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: '#F0F0F0',
    borderRadius: 3,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#10B981',
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: 'black',
  },
  batchText: {
    fontSize: 14,
    color: 'black',
  },
  gradeText: {
    fontSize: 14,
    color: 'black',
    fontWeight: '600',
  },
  lastActiveText: {
    fontSize: 14,
    color: 'black',
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  actionButton: {
    padding: 4,
  },
  horizontalScrollContainer: {
    marginBottom: 20,
  },
  tableHeaderRow: {
    flexDirection: 'row',
    // backgroundColor: '#F8F9FA',
    paddingVertical: 12,
    paddingHorizontal: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  columnHeader: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  studentColumn: {
    width: 250,
  },
  statusColumn: {
    width: 100,
  },
  progressColumn: {
    width: 120,
  },
  batchColumn: {
    width: 80,
  },
  gradeColumn: {
    width: 60,
  },
  lastActiveColumn: {
    width: 100,
  },
  actionsColumn: {
    width: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#E56B8C',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default TeacherStudentsScreen;
