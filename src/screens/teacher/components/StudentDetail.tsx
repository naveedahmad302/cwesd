import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import StyledText from '../../../shared/components/StyledText';
import { ArrowLeft, Mail as MailIcon, Phone, MapPin, User, FileText, CheckCircle, Calendar, GraduationCap } from 'lucide-react-native';

interface Student {
  id: string;
  name: string;
  email: string;
  picture?: string;
  age?: number;
  qualification?: string;
  contactNumber?: string;
  fatherName?: string;
  address?: string;
  permanentAddress?: string;
  batch?: string;
  status?: string;
  lastActive?: string;
  createdAt?: string;
  studentId?: string;
  cnicPicFront?: string;
  cnicPicBack?: string;
  presence?: {
    isOnline?: boolean;
    lastSeen?: string;
  };
}

interface StudentDetailProps {
  student: Student;
  onBack: () => void;
}

function formatDate(dateString: string | undefined): string {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}

function formatLastActive(lastSeen: string | undefined): string {
  if (!lastSeen) return 'Never';
  const lastSeenDate = new Date(lastSeen);
  const diffMs = Date.now() - lastSeenDate.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);
  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours} hours ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return lastSeenDate.toLocaleDateString();
}

const StudentDetail: React.FC<StudentDetailProps> = ({ student, onBack }) => {
  const [activeTab, setActiveTab] = useState<'Overview' | 'Profile' | 'Course Details'>('Overview');

  const isActive = student.presence?.isOnline || false;
  const enrollmentDate = formatDate(student.createdAt);
  const lastActive = formatLastActive(student.presence?.lastSeen);
  const batch = student.studentId?.split('-')[1] || student.batch || 'N/A';

  const renderOverviewTab = () => (
    <>
      <View style={styles.overviewRow}>
        {/* Contact Information */}
        <View style={[styles.infoCard, styles.overviewCard]}>
          <View style={styles.infoHeader}>
            <User color="#666" size={18} />
            <StyledText style={styles.infoTitle}>Contact Information</StyledText>
          </View>
          <View style={styles.contactSimpleRow}>
            <MailIcon color="#666" size={16} />
            <View style={styles.contactSimpleText}>
              <StyledText style={styles.contactSimpleLabel}>Email</StyledText>
              <StyledText style={styles.contactSimpleValue}>{student.email}</StyledText>
            </View>
          </View>
          <View style={styles.contactSimpleRow}>
            <Phone color="#666" size={16} />
            <View style={styles.contactSimpleText}>
              <StyledText style={styles.contactSimpleLabel}>Phone</StyledText>
              <StyledText style={styles.contactSimpleValue}>{student.contactNumber || 'N/A'}</StyledText>
            </View>
          </View>
          <View style={styles.contactSimpleRow}>
            <MapPin color="#666" size={16} />
            <View style={styles.contactSimpleText}>
              <StyledText style={styles.contactSimpleLabel}>Address</StyledText>
              <StyledText style={styles.contactSimpleValue}>{student.address || 'N/A'}</StyledText>
            </View>
          </View>
        </View>

        {/* Enrollment Information */}
        <View style={[styles.infoCard, styles.overviewCard]}>
          <View style={styles.infoHeader}>
            <Calendar color="#666" size={18} />
            <StyledText style={styles.infoTitle}>Enrollment Information</StyledText>
          </View>
          <View style={styles.enrollmentRow}>
            <StyledText style={styles.enrollmentLabel}>Created At</StyledText>
            <StyledText style={styles.enrollmentValue}>{enrollmentDate}</StyledText>
          </View>
          <View style={styles.enrollmentRow}>
            <StyledText style={styles.enrollmentLabel}>Last Active</StyledText>
            <StyledText style={styles.enrollmentValue}>{lastActive}</StyledText>
          </View>
          <View style={styles.enrollmentRow}>
            <StyledText style={styles.enrollmentLabel}>Batch</StyledText>
            <View style={styles.batchBadge}>
              <StyledText style={styles.batchBadgeText}>{batch}</StyledText>
            </View>
          </View>
          <View style={styles.enrollmentRow}>
            <StyledText style={styles.enrollmentLabel}>Status</StyledText>
            <View style={[styles.statusBadge, isActive ? styles.statusBadgeGreen : styles.statusBadgeGray]}>
              <StyledText style={[styles.statusBadgeText, isActive ? styles.statusBadgeTextGreen : styles.statusBadgeTextGray]}>
                {isActive ? 'active' : 'inactive'}
              </StyledText>
            </View>
          </View>
        </View>
      </View>
    </>
  );

  const renderProfileTab = () => (
    <>
      {/* Personal Information */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <User color="#666" size={18} />
          <StyledText style={styles.infoTitle}>Personal Information</StyledText>
        </View>
        <View style={styles.infoRow}>
          <StyledText style={styles.infoLabel}>Full Name</StyledText>
          <StyledText style={styles.infoValue}>{student.name}</StyledText>
        </View>
        <View style={styles.infoRow}>
          <StyledText style={styles.infoLabel}>Father's Name</StyledText>
          <StyledText style={styles.infoValue}>{student.fatherName || 'N/A'}</StyledText>
        </View>
        <View style={styles.infoRow}>
          <StyledText style={styles.infoLabel}>Age</StyledText>
          <StyledText style={styles.infoValue}>{student.age || 'N/A'}</StyledText>
        </View>
        <View style={styles.infoRow}>
          <StyledText style={styles.infoLabel}>Qualification</StyledText>
          <StyledText style={styles.infoValue}>{student.qualification || 'N/A'}</StyledText>
        </View>
      </View>

      {/* Address Information */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <MapPin color="#666" size={18} />
          <StyledText style={styles.infoTitle}>Address Information</StyledText>
        </View>
        <View style={styles.infoRow}>
          <StyledText style={styles.infoLabel}>Current Address</StyledText>
          <StyledText style={styles.infoValue}>{student.address || 'N/A'}</StyledText>
        </View>
        <View style={styles.infoRow}>
          <StyledText style={styles.infoLabel}>Permanent Address</StyledText>
          <StyledText style={styles.infoValue}>{student.permanentAddress || 'N/A'}</StyledText>
        </View>
        <View style={styles.infoRow}>
          <StyledText style={styles.infoLabel}>Contact Number</StyledText>
          <StyledText style={styles.infoValue}>{student.contactNumber || 'N/A'}</StyledText>
        </View>
      </View>

      {/* Identity Documents */}
      <View style={styles.infoCard}>
        <View style={styles.infoHeader}>
          <FileText color="#666" size={18} />
          <StyledText style={styles.infoTitle}>Identity Documents</StyledText>
        </View>
        
        <View style={styles.documentRow}>
          <View style={styles.documentInfo}>
            <StyledText style={styles.documentLabel}>CNIC Front</StyledText>
            {student.cnicPicFront ? (
              <Image source={{ uri: student.cnicPicFront }} style={styles.documentImage} />
            ) : (
              <View style={styles.documentPlaceholder}>
                <StyledText style={styles.documentPlaceholderText}>No Document</StyledText>
              </View>
            )}
          </View>
          <View style={styles.verifiedBadge}>
            <CheckCircle color="#10B981" size={14} />
            <StyledText style={styles.verifiedText}>Verified Document</StyledText>
          </View>
        </View>

        <View style={styles.documentRow}>
          <View style={styles.documentInfo}>
            <StyledText style={styles.documentLabel}>CNIC Back</StyledText>
            {student.cnicPicBack ? (
              <Image source={{ uri: student.cnicPicBack }} style={styles.documentImage} />
            ) : (
              <View style={styles.documentPlaceholder}>
                <StyledText style={styles.documentPlaceholderText}>No Document</StyledText>
              </View>
            )}
          </View>
          <View style={styles.verifiedBadge}>
            <CheckCircle color="#10B981" size={14} />
            <StyledText style={styles.verifiedText}>Verified Document</StyledText>
          </View>
        </View>
      </View>
    </>
  );

  const renderCourseDetailsTab = () => (
    <View style={styles.infoCard}>
      <View style={styles.infoHeader}>
        <GraduationCap color="#666" size={18} />
        <StyledText style={styles.infoTitle}>Course Details</StyledText>
      </View>
      <StyledText style={styles.infoValue}>Course information coming soon...</StyledText>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.detailContent}>
        {/* Header with Back Button */}
        <View style={styles.detailHeader}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <ArrowLeft color="#333" size={24} />
            <StyledText style={styles.backButtonText}>Back to Students</StyledText>
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <View style={styles.profileCard}>
          <View style={styles.profileHeader}>
            {student.picture ? (
              <Image source={{ uri: student.picture }} style={styles.profilePicture} />
            ) : (
              <View style={styles.profileAvatar}>
                <StyledText style={styles.profileAvatarText}>
                  {student.name.split(' ').map((n: string) => n[0]).join('')}
                </StyledText>
              </View>
            )}
            <View style={styles.profileInfo}>
              <StyledText style={styles.profileName}>{student.name}</StyledText>
              <StyledText style={styles.profileEmail}>{student.email}</StyledText>
            </View>
          </View>
        </View>

        {/* Tabs */}
        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Overview' && styles.activeTab]}
            onPress={() => setActiveTab('Overview')}
          >
            <StyledText style={[styles.tabText, activeTab === 'Overview' && styles.activeTabText]}>
              Overview
            </StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Profile' && styles.activeTab]}
            onPress={() => setActiveTab('Profile')}
          >
            <StyledText style={[styles.tabText, activeTab === 'Profile' && styles.activeTabText]}>
              Profile
            </StyledText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, activeTab === 'Course Details' && styles.activeTab]}
            onPress={() => setActiveTab('Course Details')}
          >
            <StyledText style={[styles.tabText, activeTab === 'Course Details' && styles.activeTabText]}>
              Course Details
            </StyledText>
          </TouchableOpacity>
        </View>

        {/* Tab Content */}
        {activeTab === 'Overview' && renderOverviewTab()}
        {activeTab === 'Profile' && renderProfileTab()}
        {activeTab === 'Course Details' && renderCourseDetailsTab()}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  detailContent: {
    padding: 20,
  },
  detailHeader: {
    marginBottom: 20,
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
  },
  backButtonText: {
    fontSize: 14,
    color: '#333',
  },
  profileCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profilePicture: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E56B8C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileAvatarText: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 12,
    color: '#666',
  },
  tabsContainer: {
    flexDirection: 'row',
    backgroundColor: '#F5F5FF',
    borderRadius: 8,
    padding: 5,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  activeTabText: {
    fontSize: 12,
    color: '#000',
    fontWeight: '600',
    lineHeight: 16,
  },
  // Cards
  infoCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  infoRow: {
    marginBottom: 12,
  },
  infoLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  // Overview tab layout styles
  overviewRow: {
    flexDirection: 'column',
  },
  overviewCard: {
    flex: 1,
    minWidth: 280,
  },
  contactSimpleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 14,
  },
  contactSimpleText: {
    flex: 1,
  },
  contactSimpleLabel: {
    fontSize: 13,
    color: '#888',
    marginBottom: 2,
  },
  contactSimpleValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  // Enrollment info styles
  enrollmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  enrollmentLabel: {
    fontSize: 14,
    color: '#000',
  },
  enrollmentValue: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
  },
  batchBadge: {
    backgroundColor: '#F5F5F5',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  batchBadgeText: {
    fontSize: 13,
    color: '#000',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusBadgeGreen: {
    backgroundColor: '#D1FAE5',
  },
  statusBadgeGray: {
    backgroundColor: '#F3F4F6',
  },
  statusBadgeText: {
    fontSize: 13,
    fontWeight: '500',
  },
  statusBadgeTextGreen: {
    color: '#059669',
  },
  statusBadgeTextGray: {
    color: '#6B7280',
  },
  // Identity Documents styles
  documentRow: {
    marginBottom: 20,
  },
  documentInfo: {
    marginBottom: 8,
  },
  documentLabel: {
    fontSize: 14,
    color: '#000',
    fontWeight: '500',
    marginBottom: 8,
  },
  documentImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  documentPlaceholder: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    height: 150,
  },
  documentPlaceholderText: {
    fontSize: 12,
    color: '#888',
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});

export default StudentDetail;
