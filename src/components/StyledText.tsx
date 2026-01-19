import React from 'react';
import { Text, StyleSheet, TextProps } from 'react-native';
import { typography } from '../theme/typography';

interface StyledTextProps extends TextProps {
  children: React.ReactNode;
}

const StyledText: React.FC<StyledTextProps> = ({ style, ...props }) => {
  return <Text style={[styles.text, style]} {...props} />;
};

const styles = StyleSheet.create({
  text: {
    fontFamily: typography.primary,
  },
});

export default StyledText;
