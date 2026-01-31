import React from 'react';
import { View, Modal, StyleSheet } from 'react-native';
import StyledText from './StyledText';
import { LDRSBouncy } from './LDRSBouncy';

interface Props {
  isLoading?: boolean;
  indicator?: boolean;
  overlay?: boolean;
  msg?: string;
  subMsg?: string;
  /** Bouncy loader size (default 45). LDRS Bouncy from https://uiball.com/ldrs/ */
  size?: number;
  /** Animation speed – cycle duration in seconds (default 1.75). Higher = faster. */
  speed?: number;
  /** Dot color (default 'white' in overlay, '#E56B8C' inline) */
  color?: string;
}
const Loading = ({
  isLoading = false,
  indicator = true,
  overlay = true,
  msg = 'Loading...',
  subMsg = undefined,
  size = 45,
  speed = 1,
  color,
}: Props) => {
  const dotColor = color ?? (overlay ? 'white' : '#E56B8C');
  const content = (
    <>
      {indicator ? (
        <LDRSBouncy size={size} speed={speed} color={dotColor} />
      ) : null}
      {msg ? <StyledText style={styles.text}>{msg}</StyledText> : null}
      {subMsg ? <StyledText style={styles.text}>{subMsg}</StyledText> : null}
    </>
  );

  return overlay ? (
    <Modal visible={isLoading} transparent statusBarTranslucent>
      <View style={styles.overlayContainer}>{content}</View>
    </Modal>
  ) : (
    <View style={styles.container2}>{content}</View>
  );
};

const styles = StyleSheet.create({
  overlayContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  text: {
    textAlign: 'center',
    color: 'black',
  },
  container2: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  msgContainer: { borderRadius: 16, padding: 16 },
});

export default Loading;
