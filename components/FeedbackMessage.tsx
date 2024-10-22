import { Ionicons } from '@expo/vector-icons';
import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';

export type FeedbackMessageProps = {
  message: string;
  type: 'success' | 'failure';
  duration?: number;
  onAnimationEnd?: () => void; 
};

export function FeedbackMessage({ message, type, duration = 2500, onAnimationEnd }: FeedbackMessageProps) {
  const translateX = useRef(new Animated.Value(300)).current; 
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateX, {
        toValue: 0,
        friction: 5,
        tension: 50,
        useNativeDriver: true,
      }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      })
    ]).start();

    const timeoutId = setTimeout(() => {
      Animated.parallel([
        Animated.timing(translateX, {
          toValue: 300,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        })
      ]).start(() => {
        if (onAnimationEnd) {
          onAnimationEnd(); 
        }
      });
    }, duration);

    return () => clearTimeout(timeoutId);
  }, [translateX, opacity, duration, onAnimationEnd]);


  const icon = type === 'success' ? 'checkmark' : 'close';
  const backgroundColor = type === 'success' ? '#28a745' : '#dc3545';
  const textColor = type === 'success' ? '#155724' : '#721c24'; 
  const containerColor = type === 'success' ? '#f0fff4' : '#f8d7da';

  return (
    <Animated.View style={[styles.container, { backgroundColor: containerColor, transform: [{ translateX }], opacity }]}>
      <View style={[styles.iconContainer, { backgroundColor }]}>
        <Ionicons name={icon} size={28} color="white" />
      </View>
      <Text style={[styles.message, { color: textColor }]}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
    container: {
      position: 'absolute', 
      bottom: 80,
      right: 30,
      zIndex: 100,
      flexDirection: 'row',
      alignItems: 'center',
      padding: 15,
      borderRadius: 50,
      marginBottom: 10,
      marginHorizontal: 20,
    },
    iconContainer: {
      width: 40,
      height: 40,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center',
      marginRight: 10,
    },
    message: {
      fontWeight: 'bold',
      fontSize: 16,
    },
});