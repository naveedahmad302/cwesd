import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Dimensions, ScrollView, ActivityIndicator } from 'react-native';
import { Calendar, Clock, Users, Link, X, Video, ChevronDown } from 'lucide-react-native';
import DatePicker from 'react-native-date-picker';
import { useGetCoursesQuery } from '../../../store/api/coursesApi';
import type { Course } from '../../../types/course';

const { width, height } = Dimensions.get('window');

interface ScheduleWebinarModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: () => void;
  form: {
    title: string;
    description: string;
    date: string;
    time: string;
    duration: string;
    meetLink: string;
    courseId: string;
    sectionId: string;
  };
  setForm: (form: any) => void;
}

const ScheduleWebinarModal: React.FC<ScheduleWebinarModalProps> = ({ 
  visible, 
  onClose, 
  onCreate, 
  form, 
  setForm 
}) => {
  const [courseDropdownOpen, setCourseDropdownOpen] = useState(false);
  const [sectionDropdownOpen, setSectionDropdownOpen] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());
  
  // Fetch courses from API
  const { data: coursesData, isLoading: coursesLoading, error: coursesError } = useGetCoursesQuery();
  const courses = coursesData?.courses || [];
  
  const selectedCourse = courses?.find((c: Course) => c._id === form.courseId);

  const formatDate = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const formatTime = (date: Date) => {
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  };

  const handleDatePress = () => {
    setSelectedDate(form.date ? new Date(form.date) : new Date());
    setShowDatePicker(true);
  };

  const handleDateConfirm = (date: Date) => {
    const formattedDate = formatDate(date);
    setForm({ ...form, date: formattedDate });
    setShowDatePicker(false);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleStartTimePress = () => {
    let startTime = new Date();
    
    if (form.time) {
      try {
        const [hours, minutes] = form.time.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          startTime.setHours(hours, minutes);
        } else {
          // Invalid time format, default to current time
          startTime = new Date();
        }
      } catch (error) {
        // If parsing fails, default to current time
        startTime = new Date();
      }
    }
    
    setSelectedStartTime(startTime);
    setShowStartTimePicker(true);
  };

  const handleStartTimeConfirm = (time: Date) => {
    const formattedTime = formatTime(time);
    setForm({ ...form, time: formattedTime });
    setShowStartTimePicker(false);
  };

  const handleStartTimeCancel = () => {
    setShowStartTimePicker(false);
  };

  const handleEndTimePress = () => {
    let endTime = new Date();
    
    if (form.duration) {
      try {
        const [hours, minutes] = form.duration.split(':').map(Number);
        if (!isNaN(hours) && !isNaN(minutes) && hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
          endTime.setHours(hours, minutes);
        } else {
          // Invalid time format, default to current time + 1 hour
          endTime.setHours(endTime.getHours() + 1);
        }
      } catch (error) {
        // If parsing fails, default to current time + 1 hour
        endTime.setHours(endTime.getHours() + 1);
      }
    } else {
      // Default to current time + 1 hour
      endTime.setHours(endTime.getHours() + 1);
    }
    
    setSelectedEndTime(endTime);
    setShowEndTimePicker(true);
  };

  const handleEndTimeConfirm = (time: Date) => {
    const formattedTime = formatTime(time);
    setForm({ ...form, duration: formattedTime });
    setShowEndTimePicker(false);
  };

  const handleEndTimeCancel = () => {
    setShowEndTimePicker(false);
  };
  
  if (!visible) return null;

  return (
    <>
      <View style={styles.overlay}>
        <ScrollView 
          style={styles.scrollContainer} 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContentContainer}
        >
          <View style={styles.modal}>
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.headerContent}>
                {/* <View style={styles.iconContainer}>
                  <Calendar color="#FF69B4" size={24} />
                </View> */}
                <Video color="black" size={20} />
                <View>
                  <Text style={styles.title}>Schedule New Webinar</Text>
                  {/* <Tex</View>t style={styles.subtitle}>Create and schedule a new webinar session</Text> */}
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X color="#666" size={20} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.content}>
              {/* Webinar Title */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Webinar Title</Text>
                <TextInput
                  style={styles.input}
                  value={form.title}
                  onChangeText={(text) => setForm({ ...form, title: text })}
                  placeholder="Enter webinar title"
                  placeholderTextColor="black"
                />
              </View>

              {/* Course Dropdown */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Course</Text>
                {coursesLoading ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#FF69B4" />
                    <Text style={styles.loadingText}>Loading courses...</Text>
                  </View>
                ) : coursesError ? (
                  <View style={styles.errorContainer}>
                    <Text style={styles.errorText}>Failed to load courses</Text>
                  </View>
                ) : (
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setCourseDropdownOpen(!courseDropdownOpen)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          !selectedCourse && styles.placeholderText,
                        ]}
                      >
                        {selectedCourse?.fullname || 'Select course'}
                      </Text>
                      <ChevronDown 
                        size={16} 
                        color="#666" 
                        style={[
                          styles.dropdownIcon,
                          courseDropdownOpen && styles.dropdownIconRotated
                        ]} 
                      />
                    </TouchableOpacity>

                    {courseDropdownOpen && courses.length > 0 && (
                      <View style={styles.dropdownMenu}>
                        {courses.map((course: Course) => (
                          <TouchableOpacity
                            key={course._id}
                            style={styles.dropdownItem}
                            onPress={() => {
                              setForm({ ...form, courseId: course._id });
                              setCourseDropdownOpen(false);
                            }}
                            activeOpacity={0.7}
                          >
                            <Text
                              style={[
                                styles.dropdownItemText,
                                form.courseId === course._id &&
                                  styles.dropdownItemSelected,
                              ]}
                            >
                              {course.fullname}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    )}
                  </View>
                )}
              </View>

              {/* Section Dropdown - Only show if course is selected */}
              {selectedCourse && (
                <View style={styles.inputContainer}>
                  <Text style={styles.inputLabel}>Section</Text>
                  <View style={styles.dropdown}>
                    <TouchableOpacity
                      style={styles.dropdownTrigger}
                      onPress={() => setSectionDropdownOpen(!sectionDropdownOpen)}
                      activeOpacity={0.7}
                    >
                      <Text
                        style={[
                          styles.dropdownText,
                          !form.sectionId && styles.placeholderText,
                        ]}
                      >
                        {form.sectionId ? `Section ${form.sectionId}` : 'Select section'}
                      </Text>
                      <ChevronDown 
                        size={16} 
                        color="#666" 
                        style={[
                          styles.dropdownIcon,
                          sectionDropdownOpen && styles.dropdownIconRotated
                        ]} 
                      />
                    </TouchableOpacity>

                    {sectionDropdownOpen && (
                      <View style={styles.dropdownMenu}>
                        <TouchableOpacity
                          style={styles.dropdownItem}
                          onPress={() => {
                            setForm({ ...form, sectionId: '1' });
                            setSectionDropdownOpen(false);
                          }}
                          activeOpacity={0.7}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              form.sectionId === '1' &&
                                styles.dropdownItemSelected,
                            ]}
                          >
                            Section 1
                          </Text>
                        </TouchableOpacity>
                      </View>
                    )}
                  </View>
                </View>
              )}
              
              

              {/* Webinar Date */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Webinar Date</Text>
                <TouchableOpacity 
                  style={styles.inputWithIcon} 
                  onPress={handleDatePress}
                  activeOpacity={0.7}
                >
                  <Calendar color="#999" size={16} />
                  <Text style={[styles.iconInput, !form.date && styles.placeholderText]}>
                    {form.date || 'Select date'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Start and End Time */}
              <View style={styles.rowContainer}>
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>Start Time</Text>
                  <TouchableOpacity 
                    style={styles.inputWithIcon} 
                    onPress={handleStartTimePress}
                    activeOpacity={0.7}
                  >
                    <Clock color="#999" size={16} />
                    <Text style={[styles.iconInput, !form.time && styles.placeholderText]}>
                      {form.time || '09:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
                
                <View style={[styles.inputContainer, styles.halfWidth]}>
                  <Text style={styles.inputLabel}>End Time</Text>
                  <TouchableOpacity 
                    style={styles.inputWithIcon} 
                    onPress={handleEndTimePress}
                    activeOpacity={0.7}
                  >
                    <Clock color="#999" size={16} />
                    <Text style={[styles.iconInput, !form.duration && styles.placeholderText]}>
                      {form.duration || '10:00'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              {/* Webinar Description */}
              {/* <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Webinar Description</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={form.description}
                  onChangeText={(text) => setForm({ ...form, description: text })}
                  placeholder="Enter webinar description"
                  placeholderTextColor="black"
                  multiline
                  numberOfLines={3}
                />
              </View> */}

              {/* Google Meet Link */}
              {/* <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Google Meet Link</Text>
                <View style={styles.inputWithIcon}>
                  <Link color="#999" size={16} />
                  <TextInput
                    style={styles.iconInput}
                    value={form.meetLink}
                    onChangeText={(text) => setForm({ ...form, meetLink: text })}
                    placeholder="Enter Google Meet link"
                    placeholderTextColor="black"
                  />
                </View>
              </View> */}
              
              {/* Time Zone */}
              <Text style={styles.timeZoneText}>Time zone: IST (India Standard Time)</Text>
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.button, styles.createButton]}
                onPress={onCreate}
                activeOpacity={0.8}
              >
                <Text style={styles.createButtonText}>Schedule Webinar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </View>

      {/* Date Picker */}
      {showDatePicker && (
        <DatePicker
          modal
          open={showDatePicker}
          date={selectedDate}
          mode="date"
          onConfirm={handleDateConfirm}
          onCancel={handleDateCancel}
        />
      )}

      {/* Start Time Picker */}
      {showStartTimePicker && (
        <DatePicker
          modal
          open={showStartTimePicker}
          date={selectedStartTime}
          mode="time"
          onConfirm={handleStartTimeConfirm}
          onCancel={handleStartTimeCancel}
        />
      )}

      {/* End Time Picker */}
      {showEndTimePicker && (
        <DatePicker
          modal
          open={showEndTimePicker}
          date={selectedEndTime}
          mode="time"
          onConfirm={handleEndTimeConfirm}
          onCancel={handleEndTimeCancel}
        />
      )}
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  scrollContainer: {
    width: '100%',
    maxHeight: '90%',
  },
  scrollContentContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 12,
    width: width * 0.92,
    maxWidth: 520,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10000,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    // borderBottomWidth: 1,
    // borderBottomColor: '#F0F0F0',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  title: {
    fontSize: 16,
    paddingLeft: 8,
    fontWeight: '700',
    color: '#1A1A1A',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    // backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 20,
  },
  rowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
   
    padding: 12,
    fontSize: 15,
    color: '#1A1A1A',
    backgroundColor: '#FAFBFC',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  dropdown: {
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FAFBFC',
    overflow: 'visible',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  dropdownText: {
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '400',
    flex: 1,
  },
  placeholderText: {
    color: '#999',
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  dropdownMenu: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderTopWidth: 0,
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    backgroundColor: 'white',
    maxHeight: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    zIndex: 1000,
  },
  dropdownItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  dropdownItemText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  dropdownItemSelected: {
    color: '#FF69B4',
    fontWeight: '600',
  },
  scheduleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 16,
  },
  inputWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    borderRadius: 12,
    backgroundColor: '#FAFBFC',
    paddingHorizontal: 16,
    paddingVertical: 2,
  },
  iconInput: {
    flex: 1,
    fontSize: 15,
    color: '#1A1A1A',
    marginLeft: 12,
    paddingVertical: 14,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    gap: 10,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
  },
  createButton: {
    backgroundColor: '#E56B8C',
  },
  cancelButtonText: {
    color: '#666',
    fontSize: 15,
    fontWeight: '600',
  },
  createButtonText: {
    color: 'white',
    fontSize: 15,
    fontWeight: '600',
  },
  timeZoneText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    marginBottom: 30,
    fontStyle: 'italic',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 15,
    color: '#666',
  },
  errorContainer: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#FEF2F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  errorText: {
    fontSize: 15,
    color: '#DC2626',
    textAlign: 'center',
  },
});

export default ScheduleWebinarModal;
