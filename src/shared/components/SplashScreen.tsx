import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, TouchableOpacity, Dimensions, ImageBackground } from 'react-native';
import { ArrowRight } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const bgImage = require('../../assets/icons/48dbe1ff23b52fe02dbe833320dedabe8121d45d.png');

const { width, height } = Dimensions.get('window');

const SplashScreen = () => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const navigation = useNavigation<any>();

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleContinue = () => {
    navigation.navigate('Login');
  };

  return (
    <ImageBackground source={bgImage} style={styles.container} resizeMode="cover">
      {/* White curved shape at bottom */}
      {/* <View style={styles.whiteCurve} /> */}

      {/* Content */}
      <Animated.View style={[
        styles.contentContainer,
        { 
          opacity: fadeAnim, 
          transform: [{ translateY: slideAnim }] 
        }
      ]}>
        <Text style={styles.welcomeText}>Welcome</Text>
        <Text style={styles.subtitleText}>
          Empowering women with skills, confidence, and opportunities to grow and lead.
        </Text>

        <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
          <Text style={styles.continueButtonText}>Continue</Text>
          <View style={styles.arrowCircle}>
            <ArrowRight size={20} color="white" />
          </View>
        </TouchableOpacity>
      </Animated.View>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  whiteCurve: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: height * 0.6, // 60% of screen height
    backgroundColor: 'white',
    borderTopRightRadius: 200,
    borderTopLeftRadius: 200,
  },
  contentContainer: {
    position: 'absolute',
    bottom: height * 0.15, // Position in the white area
    left: 30,
    right: 30,
  },
  welcomeText: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 20,
  },
  subtitleText: {
    fontSize: 16,
    color: '#7F8C8D',
    lineHeight: 24,
    marginBottom: 40,
  },
  continueButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'transparent',
    paddingHorizontal: 10,
  },
  continueButtonText: {
    fontSize: 18,
    color: '#2C3E50',
    fontWeight: '500',
  },
  arrowCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#E56B8C',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SplashScreen;
