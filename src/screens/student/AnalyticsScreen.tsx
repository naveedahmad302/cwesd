import React, { useState, useCallback, useEffect } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import StyledText from '../../shared/components/StyledText';
import { useGetAnalyticsQuery, useLazyGetAnalyticsQuery, type AnalyticsResponse } from '../../store/api';
import { Loading, ErrorWithRetry } from '../../shared/components';
import { LineChart, RadarChart, PieChart, BarChart } from "react-native-gifted-charts";






const AnalyticsScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const {
    data: analyticsData,
    isLoading: loading,
    isFetching,
    isError,
    error: queryError,
    refetch,
  } = useGetAnalyticsQuery(undefined, {
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
    refetchOnReconnect: true,
  });
  const [triggerAnalytics] = useLazyGetAnalyticsQuery();

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  // Map API data to stats format
  const getStats = () => {
    if (!analyticsData?.data) return [];
    
    const { course, quizzes } = analyticsData.data;
    
    return [
      {
        title: 'Course Progress',
        value: `${course.progressPercentage}%`,
        icon: 'trending-up',
      },
      {
        title: 'Avg Quiz Score',
        value: `${quizzes.avgQuizPercentage}%`,
        icon: 'emoji-events',
      },
      {
        title: 'Activities',
        value: `${course.completedActivities}/${course.totalActivities}`,
        icon: 'assignment',
      },
      {
        title: 'Quizzes',
        value: `${quizzes.totalQuizzesGiven - quizzes.remainingQuizzes}/${quizzes.totalQuizzesGiven}`,
        icon: 'radio-button-checked',
      },
    ];
  };

  // Generate progress data from sections
  const getProgressData = () => {
    if (!analyticsData?.data?.sections) return [];
    
    return analyticsData.data.sections
      .filter((section: any) => section.totalActivities > 0)
      .map((section: any) => ({
        value: Math.round((section.completedActivities / section.totalActivities) * 100)
      }));
  };

  // Generate radar data from quiz performance
  const getRadarData = () => {
    if (!analyticsData?.data) return [];
    
    const { course, quizzes } = analyticsData.data;
    
    // Create mock radar data based on available metrics
    return [
      course.progressPercentage, // Course completion
      quizzes.avgQuizPercentage, // Quiz performance
      Math.round((course.completedActivities / course.totalActivities) * 100), // Activity completion
      quizzes.totalQuizzesGiven > 0 ? Math.round((quizzes.totalQuizAttempts / quizzes.totalQuizzesGiven) * 100) : 0, // Attempt rate
      course.progressPercentage > 50 ? 70 : 45, // Engagement (estimated)
    ];
  };

  const stats = getStats();
  const progressData = getProgressData();
  const radarData = getRadarData();
  const radarLabels = ['Progress', 'Quizzes', 'Activities', 'Attempts', 'Engagement'];

  if (loading) {
    return <Loading isLoading={loading} overlay={false} />;
  }

  if (isError) {
    return (
      <ErrorWithRetry
        message={(queryError as any)?.message ?? 'Failed to load analytics'}
        onRetry={onRefresh}
      />
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing || isFetching}
          onRefresh={onRefresh}
          colors={['#E56B8C']}
        />
      }
    >

      <View style={styles.grid}>

        {stats.map((stat) => (

          <View key={stat.title} style={styles.card}>

            <View style={styles.cardTopRow}>

              <StyledText style={styles.cardTitle}>{stat.title}</StyledText>

              <Icon name={stat.icon} size={18} color={styles.cardIcon.color} />

            </View>

            <StyledText style={styles.cardValue}>{stat.value}</StyledText>

          </View>

        ))}

      </View>



      <View style={styles.progressCard}>

        <StyledText style={styles.progressTitle}>Student Progress</StyledText>

        <StyledText style={styles.progressSubtitle}>Module completion status over time</StyledText>



        <View style={styles.chartContainer}>

          <LineChart

            data={progressData}

            areaChart

            color="#1DA1FF"

            startFillColor="#B780FF"

            endFillColor="#6FD1FF"

            startOpacity={0.55}

            endOpacity={0.2}

            thickness={2}

            hideDataPoints={false}

            dataPointsColor="#1DA1FF"

            dataPointsRadius={3}

            hideAxesAndRules={false}

            yAxisThickness={0}

            xAxisThickness={1}

            xAxisColor="#E5EAF0"

            yAxisTextStyle={styles.axisText}

            xAxisLabelTextStyle={styles.axisText}

            noOfSections={4}

            spacing={42}

            initialSpacing={6}

            rulesColor="#EEF1F6"

            rulesThickness={1}

          />

        </View>



        <View style={styles.footerRow}>

          <View style={styles.footerTitleRow}>

            <StyledText style={styles.footerTitle}>
              {analyticsData?.data ? `${analyticsData.data.course.progressPercentage}% progress` : 'Real-time progress data'}
            </StyledText>

            <Icon name="trending-up" size={16} color="#1A1A1A" />

          </View>

          <StyledText style={styles.footerSubtitle}>
            {analyticsData?.data ? `${analyticsData.data.course.completedActivities} of ${analyticsData.data.course.totalActivities} activities completed` : 'Updated automatically'}
          </StyledText>

        </View>

      </View>



      

      <View style={styles.moduleCard}>
        <StyledText style={styles.moduleTitle}>Module Completion</StyledText>
        <StyledText style={styles.moduleSubtitle}>Real course completion rates</StyledText>
        <View style={styles.circlesContainer}>
          <View style={[styles.circle, { backgroundColor: '#FFD700', width: 180, height: 180 }]} />
          <View style={[styles.circle, { backgroundColor: '#00CED1', width: 140, height: 140 }]} />
          <View style={[styles.circle, { backgroundColor: '#9370DB', width: 100, height: 100 }]} />
          <View style={[styles.circle, { backgroundColor: '#FF1493', width: 60, height: 60 }]} />
          <View style={[styles.circle, { backgroundColor: '#fff', width: 20, height: 20 }]} />
        </View>
        <View style={styles.footerRow}>
          <View style={styles.footerTitleRow}>
            <StyledText style={styles.footerTitle}>
              {analyticsData?.data ? `${analyticsData.data.course.progressPercentage}% completion rate` : 'Intro leads at 92%'}
            </StyledText>
            <Icon name="trending-up" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>
            {analyticsData?.data ? `${analyticsData.data.sections.length} sections tracked` : 'Live completion data'}
          </StyledText>
        </View>
      </View>

      <View style={styles.dualLineCard}>
        <StyledText style={styles.dualLineTitle}>Study Time</StyledText>
        <StyledText style={styles.dualLineSubtitle}>Your monthly study hours</StyledText>
        <View style={styles.dualLineContainer}>
          <LineChart
            areaChart
            curved
            data={[
              {value: 20, label: 'Jan'},
              {value: 25, label: 'Feb'},
              {value: 30, label: 'Mar'},
              {value: 35, label: 'Apr'},
              {value: 40, label: 'May'},
              {value: 45, label: 'Jun'},
            ]}
            hideDataPoints
            spacing={60}
            color="#FF69B4"
            startFillColor="#FF69B4"
            endFillColor="#FF69B4"
            startOpacity={0.9}
            endOpacity={0.2}
            initialSpacing={0}
            noOfSections={4}
            yAxisColor="transparent"
            yAxisThickness={0}
            rulesType="solid"
            rulesColor="#F0F0F0"
            yAxisTextStyle={{color: 'transparent'}}
            xAxisColor="lightgray"
          />
        </View>
        <View style={styles.footerRow}>
          <View style={styles.footerTitleRow}>
            <StyledText style={styles.footerTitle}>
              {analyticsData?.data ? `${analyticsData.data.course.completedActivities} activities completed` : '38 hours this month'}
            </StyledText>
            <Icon name="access-time" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>
            {analyticsData?.data ? `${analyticsData.data.course.remainingActivities} remaining` : '217% increase from January'}
          </StyledText>
        </View>
      </View>

      <View style={styles.dualLineCard}>
        <StyledText style={styles.dualLineTitle}>Certificate Completion</StyledText>
        <StyledText style={styles.dualLineSubtitle}>Certificates issued vs eligible</StyledText>
        <View style={styles.dualLineContainer}>
          <LineChart
            curved
            data={[
              {value: 20, label: 'Jan'},
              {value: 35, label: 'Feb'},
              {value: 45, label: 'Mar'},
              {value: 60, label: 'Apr'},
              {value: 70, label: 'May'},
              {value: 80, label: 'Jun'},
            ]}
            data2={[
              {value: 10, label: 'Jan'},
              {value: 20, label: 'Feb'},
              {value: 30, label: 'Mar'},
              {value: 40, label: 'Apr'},
              {value: 50, label: 'May'},
              {value: 60, label: 'Jun'},
            ]}
            hideDataPoints
            spacing={60}
            color1="#8a56ce"
            color2="#FF69B4"
            startFillColor1="#8a56ce"
            startFillColor2="#FF69B4"
            endFillColor1="#8a56ce"
            endFillColor2="#FF69B4"
            startOpacity={0.9}
            endOpacity={0.2}
            initialSpacing={0}
            noOfSections={4}
            yAxisColor="transparent"
            yAxisThickness={0}
            rulesType="solid"
            rulesColor="#F0F0F0"
            yAxisTextStyle={{color: 'transparent'}}
            xAxisColor="lightgray"
          />
        </View>
        <View style={styles.footerRow}>
          <View style={styles.footerTitleRow}>
            <StyledText style={styles.footerTitle}>
              {analyticsData?.data ? `${analyticsData.data.quizzes.totalQuizzesGiven} quizzes available` : '84% completion rate'}
            </StyledText>
            <Icon name="bookmark" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>
            {analyticsData?.data ? `${analyticsData.data.quizzes.remainingQuizzes} remaining` : 'Strong completion rates'}
          </StyledText>
        </View>
      </View>

      <View style={styles.dualLineCard}>
        <StyledText style={styles.dualLineTitle}>Module Performance</StyledText>
        <StyledText style={styles.dualLineSubtitle}>Score vs completion by module</StyledText>
        <View style={styles.legendContainer}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#4CAF50'}]} />
            <StyledText style={styles.legendText}>Completed</StyledText>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#FF9800'}]} />
            <StyledText style={styles.legendText}>Pending</StyledText>
          </View>
        </View>
        <View style={styles.dualLineContainer}>
          <BarChart
            data={analyticsData?.data?.sections ? analyticsData.data.sections
              .filter((section: any) => section.totalActivities > 0)
              .map((section: any, index: any) => [
                {
                  value: Math.round((section.completedActivities / section.totalActivities) * 100),
                  label: `Sec ${section.sectionNumber}`,
                  spacing: 2,
                  labelWidth: 30,
                  labelTextStyle: {color: 'gray'},
                  frontColor: '#4CAF50'
                },
                {
                  value: Math.round(((section.totalActivities - section.completedActivities) / section.totalActivities) * 100),
                  frontColor: '#FF9800'
                }
              ])
              .flat() : [
              {value: 65, label: 'Jan', spacing: 2, labelWidth: 30, labelTextStyle: {color: 'gray'}, frontColor: '#4CAF50'},
              {value: 35, frontColor: '#FF9800'},
              {value: 72, label: 'Feb', spacing: 2, labelWidth: 30, labelTextStyle: {color: 'gray'}, frontColor: '#4CAF50'},
              {value: 28, frontColor: '#FF9800'},
              {value: 80, label: 'Mar', spacing: 2, labelWidth: 30, labelTextStyle: {color: 'gray'}, frontColor: '#4CAF50'},
              {value: 20, frontColor: '#FF9800'},
              {value: 68, label: 'Apr', spacing: 2, labelWidth: 30, labelTextStyle: {color: 'gray'}, frontColor: '#4CAF50'},
              {value: 32, frontColor: '#FF9800'},
              {value: 85, label: 'May', spacing: 2, labelWidth: 30, labelTextStyle: {color: 'gray'}, frontColor: '#4CAF50'},
              {value: 15, frontColor: '#FF9800'},
              {value: 90, label: 'Jun', spacing: 2, labelWidth: 30, labelTextStyle: {color: 'gray'}, frontColor: '#4CAF50'},
              {value: 10, frontColor: '#FF9800'},
            ]}
            barWidth={8}
            spacing={24}
            roundedTop
            roundedBottom
            hideRules
            xAxisThickness={0}
            yAxisThickness={0}
            yAxisTextStyle={{color: 'gray'}}
            noOfSections={3}
            maxValue={90}
          />
        </View>
        <View style={styles.footerRow}>
          <View style={styles.footerTitleRow}>
            <StyledText style={styles.footerTitle}>Score vs completion by module</StyledText>
            <Icon name="bar-chart" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>Live data from courses</StyledText>
        </View>
      </View>

      <View style={styles.dualLineCard}>
        <StyledText style={styles.dualLineTitle}>Engagement Metrics</StyledText>
        <StyledText style={styles.dualLineSubtitle}>Weekly engagement trend</StyledText>
        <View style={styles.dualLineContainer}>
          <LineChart
            areaChart
            curved
            data={[
              {value: 45, label: 'Week 1'},
              {value: 52, label: 'Week 2'},
              {value: 48, label: 'Week 3'},
              {value: 65, label: 'Week 4'},
              {value: 72, label: 'Week 5'},
              {value: 78, label: 'Week 6'},
              {value: 85, label: 'Week 7'},
              {value: 82, label: 'Week 8'},
            ]}
            hideDataPoints
            spacing={50}
            color="#9C27B0"
            startFillColor="#9C27B0"
            endFillColor="#E1BEE7"
            startOpacity={0.8}
            endOpacity={0.2}
            initialSpacing={0}
            noOfSections={4}
            yAxisColor="transparent"
            yAxisThickness={0}
            rulesType="solid"
            rulesColor="#F0F0F0"
            yAxisTextStyle={{color: 'transparent'}}
            xAxisColor="lightgray"
          />
        </View>
        <View style={styles.footerRow}>
          <View style={styles.footerTitleRow}>
            <StyledText style={styles.footerTitle}>85% engagement rate</StyledText>
            <Icon name="trending-up" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>Strong upward trend</StyledText>
        </View>
      </View>
      <View style={styles.radarCard}>

        <StyledText style={styles.radarTitle}>Skills Assessment</StyledText>

        <StyledText style={styles.radarSubtitle}>Your performance vs class average</StyledText>

        <View style={styles.radarChartWrapper}>

          <RadarChart
            data={[42, 50, 38, 45, 48]}
            labels={['Technical', 'Business', 'Marketing', 'Finance', 'Leadership']}
            maxValue={60}
          />

        </View>

        <View style={styles.footerRow}>

          <View style={styles.footerTitleRow}>

            <StyledText style={styles.footerTitle}>
              {analyticsData?.data ? `Performance across ${analyticsData.data.sections.length} sections` : 'Above average in all skills'}
            </StyledText>

            <Icon name="person" size={16} color="#1A1A1A" />

          </View>

          <StyledText style={styles.footerSubtitle}>
            {analyticsData?.data ? `${analyticsData.data.course.totalActivities} total activities` : 'Across 5 skill areas'}
          </StyledText>

        </View>

      </View>
    </ScrollView>
  );
};



const styles = StyleSheet.create({

  container: {

    flexGrow: 1,

    backgroundColor: '#F6F7FB',

    padding: 16,

  },

  grid: {

    flexDirection: 'row',

    flexWrap: 'wrap',

    justifyContent: 'space-between',

  },

  card: {

    width: '48%',

    backgroundColor: '#fff',

    borderRadius: 14,

    paddingVertical: 18,

    paddingHorizontal: 16,

    marginBottom: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 4 },

    shadowOpacity: 0.06,

    shadowRadius: 12,

    elevation: 4,

  },

  cardTopRow: {

    flexDirection: 'row',

    alignItems: 'center',

    justifyContent: 'space-between',

    marginBottom: 12,

  },

  cardTitle: {

    fontSize: 13,

    color: '#1A1A1A',

    letterSpacing: 0.2,

  },

  cardValue: {

    fontSize: 26,

    fontWeight: '700',

    color: '#0B0B0B',

  },

  cardIcon: {

    color: '#1A1A1A',

  },

  progressCard: {

    backgroundColor: '#fff',

    borderRadius: 16,

    padding: 18,

    marginTop: 8,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 6 },

    shadowOpacity: 0.08,

    shadowRadius: 14,

    elevation: 5,

  },

  progressTitle: {

    fontSize: 18,

    fontWeight: '700',

    color: '#141414',

  },

  progressSubtitle: {

    marginTop: 6,

    fontSize: 13,

    color: '#4D4D4D',

  },

  chartContainer: {

    marginTop: 12,

  },

  axisText: {

    fontSize: 10,

    color: '#1F1F1F',

  },

  footerRow: {

    marginTop: 16,

  },

  footerTitleRow: {

    flexDirection: 'row',

    alignItems: 'center',

    gap: 6,

  },

  footerTitle: {

    fontSize: 13,

    fontWeight: '600',

    color: '#121212',

  },

  footerSubtitle: {

    marginTop: 4,

    fontSize: 12,

    color: '#6E6E6E',

  },

  radarCard: {

    backgroundColor: '#fff',

    borderRadius: 16,

    padding: 18,

    marginTop: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 6 },

    shadowOpacity: 0.08,

    shadowRadius: 14,

    elevation: 5,

  },

  radarTitle: {

    fontSize: 18,

    fontWeight: '700',

    color: '#141414',

  },

  radarSubtitle: {

    marginTop: 6,

    fontSize: 13,

    color: '#4D4D4D',

  },

  radarChartWrapper: {

    marginTop: 16,

    alignItems: 'center',

    justifyContent: 'center',

    alignSelf: 'center',

    width: 260,

    height: 260,

    transform: [{ rotate: '-20deg' }],

  },

  moduleCard: {

    backgroundColor: '#fff',

    borderRadius: 16,

    padding: 18,

    marginTop: 16,

    shadowColor: '#000',

    shadowOffset: { width: 0, height: 6 },

    shadowOpacity: 0.08,

    shadowRadius: 14,

    elevation: 5,

  },

  moduleTitle: {

    fontSize: 18,

    fontWeight: '700',

    color: '#141414',

  },

  moduleSubtitle: {

    marginTop: 6,

    fontSize: 13,

    color: '#4D4D4D',

  },

  circlesContainer: {

    marginTop: 20,

    alignItems: 'center',

    justifyContent: 'center',

    height: 200,

  },

  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 4,
    borderColor: 'white',
  },
  dualLineCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 18,
    marginTop: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 5,
  },
  dualLineTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#141414',
  },
  dualLineSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#4D4D4D',
  },
  dualLineContainer: {
    marginTop: 12,
  },
  legendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    marginTop: 8,
    marginBottom: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6B7280',
  },

});



export default AnalyticsScreen;

