import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import StyledText from './StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface WebinarCardProps {
  title: string;
  date: string;
  time: string;
  participants: number;
  status: 'upcoming' | 'live' | 'completed';
  onStartWebinar?: () => void;
}

const WebinarCard: React.FC<WebinarCardProps> = ({
  title,
  date,
  time,
  participants,
  status,
  onStartWebinar,
}) => {
  const getStatusColor = () => {
    switch (status) {
      case 'upcoming':
        return 'black';
      case 'live':
        return 'black';
      case 'completed':
        return 'black';
      default:
        return 'black';
    }
  };

  const getStatusText = () => {
    switch (status) {
      case 'upcoming':
        return 'upcoming';
      case 'live':
        return 'live';
      case 'completed':
        return 'completed';
      default:
        return 'upcoming';
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <StyledText style={[styles.status, { color: getStatusColor() }]}>
          {getStatusText()}
        </StyledText>
        <View style={styles.participants}>
          <Icon name="account-group-outline" size={16} color="black" />
          <StyledText style={styles.participantsText}>{participants}</StyledText>
        </View>
      </View>
      
      <StyledText style={styles.title}>{title}</StyledText>
      
      <View style={styles.dateTimeContainer}>
        <View style={styles.dateTimeItem}>
          <Icon name="calendar" size={16} color="black" />
          <StyledText style={styles.dateTimeText}>{date}</StyledText>
        </View>
        <View style={styles.dateTimeItem}>
          <Icon name="clock-outline" size={16} color="black" />
          <StyledText style={styles.dateTimeText}>{time}</StyledText>
        </View>
      </View>
      
      {status === 'upcoming' && onStartWebinar && (
        <TouchableOpacity style={styles.startButton} onPress={onStartWebinar}>
          <StyledText style={styles.startButtonText}>Start Webinar</StyledText>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  status: {
    borderWidth:1,
    borderRadius:16,
    borderColor:'#EFF3F4',
    paddingVertical:4,
    paddingHorizontal:10,
    fontSize: 12,
    fontWeight: '600',
    // textTransform: 'uppercase',
  },
  participants: {
    backgroundColor:'#F0F0FF',
    borderRadius:16,
    paddingVertical:4,
    paddingHorizontal:10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  participantsText: {
    fontSize: 14,
    color: 'black',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 12,
  },
  dateTimeContainer: {
    flexDirection: 'column',
    gap: 16,
    marginBottom: 16,
  },
  dateTimeItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dateTimeText: {
    fontSize: 14,
    color: 'black',
  },
  startButton: {
    backgroundColor: '#E56B8C',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  startButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default WebinarCard;
