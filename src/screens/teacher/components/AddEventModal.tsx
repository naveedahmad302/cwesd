import React, { useState } from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView, TextInput } from 'react-native';
import DatePicker from 'react-native-date-picker';
import StyledText from '../../../shared/components/StyledText';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';

interface AddEventModalProps {
  visible: boolean;
  onClose: () => void;
  onAddEvent: (eventData: EventData) => void;
}

interface EventData {
  title: string;
  eventType: string;
  startTime: string;
  endTime: string;
  description: string;
  module: string;
  location: string;
}

const AddEventModal: React.FC<AddEventModalProps> = ({ visible, onClose, onAddEvent }) => {
  const [eventData, setEventData] = useState<EventData>({
    title: '',
    eventType: 'Meeting',
    startTime: '',
    endTime: '',
    description: '',
    module: '',
    location: '',
  });

  const [showEventTypeDropdown, setShowEventTypeDropdown] = useState(false);
  const [showModuleDropdown, setShowModuleDropdown] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());

  const eventTypes = ['Meeting', 'Webinar', 'Assignment', 'Quiz', 'Class', 'Workshop','Exam','Deadline'];
  const modules = ['Module 1', 'Module 2', 'Module 3', 'Module 4', 'Module 5'];

  const handleAddEvent = () => {
    if (eventData.title && eventData.startTime && eventData.endTime) {
      onAddEvent(eventData);
      setEventData({
        title: '',
        eventType: 'Meeting',
        startTime: '',
        endTime: '',
        description: '',
        module: '',
        location: '',
      });
      onClose();
    }
  };

  const updateEventData = (field: keyof EventData, value: string) => {
    setEventData(prev => ({ ...prev, [field]: value }));
  };

  const formatDateTime = (date: Date) => {
    return date.toLocaleString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <StyledText style={styles.headerTitle}>Add Event</StyledText>
            <View style={styles.placeholder} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Icon name="close" size={24} color="#000" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <View style={styles.formSection}>
              {/* Event Title */}
              <View style={styles.formGroup}>
                <StyledText style={styles.label}>Event Title</StyledText>
                <TextInput
                  style={styles.input}
                  value={eventData.title}
                  onChangeText={(value) => updateEventData('title', value)}
                  placeholder=" Enter event title"
                  placeholderTextColor="black"
                />
              </View>

              {/* Event Type */}
              <View style={styles.formGroup}>
                <StyledText style={styles.label}>Event Type</StyledText>
                <TouchableOpacity
                  style={styles.dropdown}
                  onPress={() => setShowEventTypeDropdown(!showEventTypeDropdown)}
                >
                  <StyledText style={styles.dropdownText}>{eventData.eventType}</StyledText>
                  <Icon name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
                
                {showEventTypeDropdown && (
                  <View style={styles.dropdownList}>
                    {eventTypes.map((type) => (
                      <TouchableOpacity
                        key={type}
                        style={[
                          styles.dropdownItem,
                          eventData.eventType === type && styles.dropdownItemSelected,
                        ]}
                        onPress={() => {
                          updateEventData('eventType', type);
                          setShowEventTypeDropdown(false);
                        }}
                      >
                        <StyledText
                          style={[
                            styles.dropdownItemText,
                            eventData.eventType === type && styles.dropdownItemTextSelected,
                          ]}
                        >
                          {type}
                        </StyledText>
                        {eventData.eventType === type && (
                          <Icon name="check" size={20} color="black" />
                        )}
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              </View>

              {/* Start Date & Time */}
              <View style={styles.formGroup}>
                <StyledText style={styles.label}>Start Date & Time</StyledText>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowStartTimePicker(true)}
                >
                  <StyledText style={[styles.inputText, { flex: 1 }]}>
                    {eventData.startTime || 'Select start date & time'}
                  </StyledText>
                  <Icon name="calendar" size={20} color="#666" style={styles.inputIcon} />
                </TouchableOpacity>
              </View>

              {/* End Date & Time */}
              <View style={styles.formGroup}>
                <StyledText style={styles.label}>End Date & Time</StyledText>
                <TouchableOpacity
                  style={styles.input}
                  onPress={() => setShowEndTimePicker(true)}
                >
                  <StyledText style={[styles.inputText, { flex: 1 }]}>
                    {eventData.endTime || 'Select end date & time'}
                  </StyledText>
                  <Icon name="calendar" size={20} color="#666" style={styles.inputIcon} />
                </TouchableOpacity>
              </View>

              {/* Description */}
              <View style={styles.formGroup}>
                <StyledText style={styles.label}>Description</StyledText>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={eventData.description}
                  onChangeText={(value) => updateEventData('description', value)}
                  placeholder=" Enter event description"
                  placeholderTextColor="black"
                  multiline
                  numberOfLines={4}
                />
              </View>

              {/* Module */}
              <View style={styles.formGroup}>
                <StyledText style={styles.label}>Module</StyledText>
                <TextInput
                  style={styles.input}
                  value={eventData.module}
                  onChangeText={(value) => updateEventData('module', value)}
                  placeholder=" Enter module name"
                  placeholderTextColor="black"
                />
              </View>

              {/* Location */}
              <View style={styles.formGroup}>
                <StyledText style={styles.label}>Location</StyledText>
                <TextInput
                  style={styles.input}
                  value={eventData.location}
                  onChangeText={(value) => updateEventData('location', value)}
                  placeholder="  Enter location"
                  placeholderTextColor="black"
                />
              </View>
            </View>

            {/* Buttons */}
            <View style={styles.footer}>
              <TouchableOpacity style={[styles.footerButton, styles.cancelButton]} onPress={onClose}>
                <StyledText style={styles.cancelButtonText}>Cancel</StyledText>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.footerButton, styles.addButton]} onPress={handleAddEvent}>
                <StyledText style={styles.addButtonText}>Add Event</StyledText>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      
      {/* Date Time Pickers */}
      <DatePicker
        modal
        open={showStartTimePicker}
        date={startDate}
        mode="datetime"
        onConfirm={(date) => {
          setShowStartTimePicker(false);
          setStartDate(date);
          updateEventData('startTime', formatDateTime(date));
        }}
        onCancel={() => {
          setShowStartTimePicker(false);
        }}
      />
      
      <DatePicker
        modal
        open={showEndTimePicker}
        date={endDate}
        mode="datetime"
        onConfirm={(date) => {
          setShowEndTimePicker(false);
          setEndDate(date);
          updateEventData('endTime', formatDateTime(date));
        }}
        onCancel={() => {
          setShowEndTimePicker(false);
        }}
      />
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    width: '95%',
    maxWidth: 500,
    maxHeight: '85%',
    minHeight: 700,
    marginHorizontal: 20,
    marginVertical: 40,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'black',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  formSection: {
    marginBottom: 20,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    fontSize: 14,
    color: 'black',
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  dropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
  },
  dropdownText: {
    fontSize: 14,
    color: 'black',
  },
  dropdownList: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    marginTop: 4,
    backgroundColor: '#fff',
    zIndex: 1000,
  },
  dropdownItem: {
    borderRadius:8,
    padding:6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownItemSelected: {
    backgroundColor: '#E56B8C',
  },
  dropdownItemText: {
    fontSize: 14,
    color: 'black',
  },
  dropdownItemTextSelected: {
    color: 'white',
  },
  footer: {
    paddingBottom: 20,
  },
  footerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 10,
  },
  cancelButton: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: 'black',
  },
  addButton: {
    backgroundColor: '#E56B8C',
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  inputText: {
    fontSize: 14,
    color: 'black',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  inputIcon: {
    marginRight: 12,
  },
});

export default AddEventModal;
