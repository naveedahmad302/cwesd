import React from 'react';

import { View, StyleSheet, ScrollView } from 'react-native';

import Icon from 'react-native-vector-icons/MaterialIcons';

import StyledText from '../../shared/components/StyledText';

import { LineChart, RadarChart, PieChart, BarChart } from "react-native-gifted-charts";



const stats = [

  {

    title: 'Course Progress',
    value: '65%',
    icon: 'trending-up',

  },

  {

    title: 'Avg Quiz Score',

    value: '82%',

    icon: 'emoji-events',

  },

  {

    title: 'Study Time',

    value: '24h',

    icon: 'schedule',

  },

  {

    title: 'Completion Rate',

    value: '50%',

    icon: 'radio-button-checked',

  },

];



const progressData = [

  { value: 15 },

  { value: 30 },

  { value: 26 },

  { value: 40 },

  { value: 8 },

  { value: 2 },

];



const radarData = [62, 70, 58, 64, 68];

const radarLabels = ['Technical', 'Business', 'Marketing', 'Finance', 'Leadership'];



const AnalyticsScreen = () => {

  return (

    <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>

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

            <StyledText style={styles.footerTitle}>Real-time progress data</StyledText>

            <Icon name="trending-up" size={16} color="#1A1A1A" />

          </View>

          <StyledText style={styles.footerSubtitle}>Updated automatically</StyledText>

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

            <StyledText style={styles.footerTitle}>Above average in all skills</StyledText>

            <Icon name="person" size={16} color="#1A1A1A" />

          </View>

          <StyledText style={styles.footerSubtitle}>Across 5 skill areas</StyledText>

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
            <StyledText style={styles.footerTitle}>Intro leads at 92%</StyledText>
            <Icon name="trending-up" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>Live completion data</StyledText>
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
            <StyledText style={styles.footerTitle}>38 hours this month</StyledText>
            <Icon name="access-time" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>217% increase from January</StyledText>
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
            <StyledText style={styles.footerTitle}>84% completion rate</StyledText>
            <Icon name="bookmark" size={16} color="#1A1A1A" />
          </View>
          <StyledText style={styles.footerSubtitle}>Strong completion rates</StyledText>
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
            data={[
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

