import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import StyledText from './StyledText';
import { HelpCircle, FileText, Video, CircleCheckBig, BookOpen, ExternalLink, Check } from 'lucide-react-native';

export interface ContentDetailAction {
  id: string;
  title: string;
  type: 'primary' | 'secondary';
  onPress: () => void;
  icon?: React.ReactNode;
}

export interface ContentDetailCardProps {
  title: string;
  description: string;
  type: 'quiz' | 'assignment' | 'lecture';
  actions: ContentDetailAction[];
}

const ContentDetailCard: React.FC<ContentDetailCardProps> = ({ 
  title, 
  description, 
  type, 
  actions 
}) => {
  const getIcon = () => {
    switch (type) {
      case 'quiz':
        return <HelpCircle size={48} color="#E56B8C" />;
      case 'assignment':
        return <FileText size={48} color="#E56B8C" />;
      case 'lecture':
        return <Video size={48} color="#E56B8C" />;
      default:
        return <FileText size={48} color="#E56B8C" />;
    }
  };

  const getIconBackground = () => {
    switch (type) {
      case 'quiz':
        return '#FFE5E5';
      case 'assignment':
        return '#FFF4E5';
      case 'lecture':
        return '#E5F5E5';
      default:
        return '#E5F3FF';
    }
  };

  const primaryActions = actions.filter(action => action.type === 'primary');
  const secondaryActions = actions.filter(action => action.type === 'secondary');
  const isAssignment = type === 'assignment';

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.card}>
        {/* Icon Section */}
        <View style={[styles.iconContainer, { backgroundColor: getIconBackground() }]}>
          {getIcon()}
        </View>

        {/* Content Section */}
        <View style={styles.contentSection}>
          <StyledText style={styles.title}>{title}</StyledText>
          <StyledText style={styles.description}>{description}</StyledText>
        </View>

        {isAssignment && (
          <View style={styles.actionsContainer}>
            {primaryActions.filter(action => action.id !== 'open-moodle' && action.id !== 'mark-complete').map((action, index) => (
              <TouchableOpacity
                key={action.id}
                style={[
                  styles.assignmentButton,
                  index === 0 ? styles.primaryButton : styles.whiteButton,
                ]}
                onPress={action.onPress}
              >
                {action.icon && <View style={styles.buttonIcon}>{action.icon}</View>}
                <StyledText
                  style={index === 0 ? styles.primaryButtonText : styles.whiteButtonText}
                >
                  {action.title}
                </StyledText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* External Action Buttons - Outside the card */}
      {isAssignment && (
        <View style={styles.externalActionsContainer}>
          {/* Open in Moodle Button */}
          <TouchableOpacity
            style={[styles.externalActionButton, styles.primaryExternalButton]}
            onPress={() => {
              const openMoodleAction = actions.find(action => action.id === 'open-moodle');
              if (openMoodleAction) {
                openMoodleAction.onPress();
              }
            }}
          >
            <View style={styles.buttonIcon}>
              <ExternalLink size={16} color="#ffffff" />
            </View>
            <StyledText style={styles.primaryButtonText}>
              Open in Moodle
            </StyledText>
          </TouchableOpacity>
          
          {/* Mark Complete Button */}
          <TouchableOpacity
            style={[styles.externalActionButton, styles.whiteExternalButton]}
            onPress={() => {
              const markCompleteAction = actions.find(action => action.id === 'mark-complete');
              if (markCompleteAction) {
                markCompleteAction.onPress();
              }
            }}
          >
            <View style={styles.buttonIcon}>
              <CircleCheckBig  size={16} color="#111827" />
            </View>
            <StyledText style={styles.whiteButtonText}>
              Mark Complete
            </StyledText>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  card: {
    backgroundColor: '#FFFFFF',
    margin: 16,
    borderRadius: 20,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginBottom: 24,
  },
  contentSection: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#111827',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 17,
    color: '#4B5563',
    textAlign: 'center',
    lineHeight: 26,
  },
  assignmentActionsRow: {
    flexDirection: 'column',
    justifyContent: 'center',
    gap: 16,
    marginTop: 8,
  },
  assignmentButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 22,
    borderRadius: 8,
    // borderWidth: 1,
    minWidth: 156,
    // shadowColor: '#000',
    // shadowOffset: { width: 0, height: 1 },
    // shadowOpacity: 0.05,
    // shadowRadius: 3,
    // elevation: 2,
  },
  primaryButton: {
    backgroundColor: '#E56B8C',
    shadowColor: '#E56B8C',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  whiteButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DFE6E9',
  },
  buttonIcon: {
    marginRight: 10,
  },
  primaryButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  whiteButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111827',
  },
  actionsContainer: {
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    color: 'black',
  },
  secondaryButton: {
    backgroundColor: '#E56B8C',
    borderWidth: 1,
    borderColor: '#E56B8C',
  },
  secondaryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: 'white',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 20,
  },
  externalActionsContainer: {
    paddingHorizontal: 16,
    paddingBottom: 24,
    gap: 12,
  },
  externalActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 8,
    minWidth: '100%',
  },
  primaryExternalButton: {
    backgroundColor: '#E56B8C',
    shadowColor: '#E56B8C',
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  whiteExternalButton: {
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#DFE6E9',
    shadowColor: '#000',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
});

export default ContentDetailCard;
