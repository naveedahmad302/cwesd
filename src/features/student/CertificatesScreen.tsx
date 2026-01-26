import React, { useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { Award, Calendar, Download, CircleCheckBig, Lock } from 'lucide-react-native';
import StyledText from '../../shared/components/StyledText';

interface Certificate {
  id: string;
  title: string;
  date: string;
  status: 'completed' | 'locked' | 'in_progress';
  icon?: string;
}

interface CourseProgressScreenProps { }

const MOCK_CERTIFICATES: Certificate[] = [
  {
    id: '1',
    title: 'Introduction to Technical Entrepreneurship',
    date: 'January 12, 2026',
    status: 'completed',
  },
  {
    id: '2',
    title: 'Business Model Canvas',
    date: 'December 28, 2025',
    status: 'completed',
  },
  {
    id: '3',
    title: 'Market Research & Analysis',
    date: 'Not completed yet',
    status: 'locked',
  },
  {
    id: '4',
    title: 'Product Development',
    date: 'Not completed yet',
    status: 'locked',
  },
  {
    id: '5',
    title: 'Financial Planning',
    date: 'Not completed yet',
    status: 'locked',
  },
  {
    id: '6',
    title: 'Pitching & Fundraising',
    date: 'Not completed yet',
    status: 'locked',
  },
];

const CourseProgressHeader: React.FC = () => (
  <View style={styles.headerContainer}>
    <View style={styles.headerContent2}>
      <Award />
      <StyledText style={styles.headerTitle}>Course Progress</StyledText>
    </View>

    <View style={styles.progressContainer}>
      <View style={styles.progressTextContainer}>
        <StyledText style={styles.progressText}>2 of 6 modules completed</StyledText>
        <StyledText style={styles.progressPercentage}>33%</StyledText>
      </View>

      <View style={styles.progressBar}>
        <View style={[styles.progressFill, { width: '50%' }]} />
      </View>
      <StyledText style={styles.progressSubtext}>Complete all modules to unlock your final certificate.</StyledText>
    </View>
  </View>
);

interface CertificateItemProps {
  item: Certificate;
  index: number;
}

const CertificateItem: React.FC<CertificateItemProps> = React.memo(
  ({ item, index }) => {
    const isCompleted = item.status === 'completed';
    const isLocked = item.status === 'locked';

    const handlePress = useCallback(() => {
      // Navigation or action handler
    }, []);

    return (
      <View style={[styles.certificateItem, isLocked && styles.certificateItemLocked]}>
        <View style={styles.certificateContent}>
          <View style={styles.certificateIconContainer}>
            {isCompleted && (
              <View style={styles.completedIcon}>
                <CircleCheckBig size={24} color="#00A63E" />
              </View>
            )}
            {isLocked && (
              <View style={styles.lockedIcon}>
                <Lock size={20} color="#99A1AF" />
              </View>
            )}
          </View>
          <View style={styles.certificateTextContainer}>
            <StyledText
              style={[
                styles.certificateTitle,
                isLocked && styles.certificateTitleLocked,
              ]}
              numberOfLines={2}
            >
              {item.title}
            </StyledText>
            {!isLocked && (
              <View style={styles.dateContainer}>
                <Calendar size={14} color="#6B7280" />
                <StyledText
                  style={[
                    styles.certificateDate,
                    isLocked && styles.certificateDateLocked,
                  ]}
                >
                  {item.date}
                </StyledText>
              </View>
            )}
            {isLocked && (
              <StyledText style={styles.certificateDateLocked}>
                {item.date}
              </StyledText>
            )}
            {isCompleted && (
              <StyledText style={styles.certificateScore}>Score: 85%</StyledText>
            )}
          </View>
        </View>
        {isCompleted && (
          <TouchableOpacity style={styles.downloadButton} onPress={handlePress}>
            <Download size={16} color="black" />
            <StyledText style={styles.downloadButtonText}>Download</StyledText>
          </TouchableOpacity>
        )}
        {isLocked && (
          <TouchableOpacity style={styles.lockedButton} disabled>
            <Lock size={16} color="#99A1AF" />
            <StyledText style={styles.lockedButtonText}>Locked</StyledText>
          </TouchableOpacity>
        )}
      </View>
    );
  }
);

CertificateItem.displayName = 'CertificateItem';

const CertificatesScreen: React.FC<CourseProgressScreenProps> = () => {
  const keyExtractor = useCallback((item: Certificate) => item.id, []);

  const renderItem = useCallback(
    ({ item, index }: { item: Certificate; index: number }) => (
      <CertificateItem item={item} index={index} />
    ),
    []
  );

  const memoizedData = useMemo(() => MOCK_CERTIFICATES, []);

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <CourseProgressHeader />

        <View style={styles.certificatesContainer}>
          <StyledText style={styles.moduleCertificatesTitle}>Module Certificates</StyledText>
          <FlatList
            data={memoizedData}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={styles.separator} />}
          />
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    // paddingTop: 20,
    margin: 10,
    // paddingBottom: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderRadius: 12,
    borderColor: '#E8EAED',
  },
  headerContent2: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1F2937',
    // marginBottom: 16,
  },
  progressContainer: {
    // backgroundColor: '#F0F4F8',
    borderRadius: 8,
    padding: 12,
  },
  progressTextContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressPercentage: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
  },
  progressBar: {
    height: 8,
    marginVertical:9,
    backgroundColor: '#FAE1E8',
    borderRadius: 4,
    marginBottom: 16,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#E56B8C',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1F2937',
    marginBottom: 4,
  },
  progressSubtext: {
    fontSize: 17,
    color: '#6B7280',
    lineHeight: 26,
  },
  certificatesContainer: {
    paddingHorizontal: 16,
    paddingTop: 24,
  },
  moduleCertificatesTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  certificateItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D1FAE5',
    padding: 16,
    marginBottom: 12,
  },
  certificateItemLocked: {
    borderColor: '#E5E7EB',
  },
  certificateContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  certificateIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  completedIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#D1FAE5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lockedIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    fontSize: 20,
    color: '#10B981',
    fontWeight: 'bold',
  },
  lockmark: {
    fontSize: 18,
  },
  certificateTextContainer: {
    flex: 1,
  },
  certificateTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'black',
    marginBottom: 8,
    lineHeight: 22,
  },
  // certificateTitleLocked: {
  //   color: '#9CA3AF',
  // },
  certificateDate: {
    fontSize: 14,
    color: '#6B7280',
    marginLeft: 4,
  },
  certificateDateLocked: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  certificateScore: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFC',
    paddingHorizontal: 16,
    paddingVertical: 5,
    borderRadius: 5,
    borderWidth:1,
    borderColor: '#D1D5DB',
    alignSelf: 'flex-start',
    gap: 6,
  },
  downloadButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'black',
  },
  lockedButton: {
    width:'100%',
    justifyContent: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FBFCFC',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth:1,
    borderColor: '#F3F4F6',
    alignSelf: 'flex-start',
  },
  lockedButtonText: {
    fontSize: 14,
    paddingLeft: 12,
    fontWeight: '500',
    color: '#9CA3AF',
  },
  separator: {
    height: 8,
  },
});

export default CertificatesScreen;
