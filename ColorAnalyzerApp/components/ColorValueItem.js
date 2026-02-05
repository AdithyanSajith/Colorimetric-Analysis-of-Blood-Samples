import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Easing } from 'react-native';

export default function ColorValueItem({ label, value, color, onCopy, delay = 0 }) {
  const itemAnim = useRef(new Animated.Value(0)).current;
  const itemTranslateY = useRef(new Animated.Value(10)).current;
  const pressAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(itemAnim, {
          toValue: 1,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
        Animated.timing(itemTranslateY, {
          toValue: 0,
          duration: 400,
          easing: Easing.out(Easing.cubic),
          useNativeDriver: true,
        }),
      ]).start();
    }, delay);

    return () => clearTimeout(timer);
  }, [delay, itemAnim, itemTranslateY]);

  const handlePress = () => {
    if (onCopy) {
      Animated.sequence([
        Animated.spring(pressAnim, {
          toValue: 0.97,
          tension: 300,
          friction: 3,
          useNativeDriver: true,
        }),
        Animated.spring(pressAnim, {
          toValue: 1,
          tension: 300,
          friction: 3,
          useNativeDriver: true,
        }),
      ]).start();
      onCopy(value, label);
    }
  };

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: itemAnim,
          transform: [{ translateY: itemTranslateY }],
        },
      ]}
    >
      <TouchableOpacity
        style={styles.valueItem}
        onPress={handlePress}
        onPressIn={() => {
          Animated.spring(pressAnim, {
            toValue: 0.97,
            useNativeDriver: true,
          }).start();
        }}
        onPressOut={() => {
          Animated.spring(pressAnim, {
            toValue: 1,
            friction: 3,
            tension: 300,
            useNativeDriver: true,
          }).start();
        }}
        activeOpacity={0.8}
        accessibilityLabel={`${label}: ${value}. Tap to copy`}
      >
        <Animated.View
          style={[
            styles.valueItemContent,
            {
              transform: [{ scale: pressAnim }],
            },
          ]}
        >
          <Animated.View
            style={[
              styles.colorDot,
              { backgroundColor: color },
              {
                transform: [
                  {
                    scale: itemAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, 1],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={styles.valueLabel}>{label}:</Text>
          <Text style={styles.valueText}>{value}</Text>
          {onCopy && (
            <Animated.Text
              style={[
                styles.copyHint,
                {
                  opacity: itemAnim.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0, 0, 1],
                  }),
                },
              ]}
            >
              Tap to copy
            </Animated.Text>
          )}
        </Animated.View>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  valueItem: {
    borderRadius: 10,
    overflow: 'hidden',
  },
  valueItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  colorDot: {
    width: 26,
    height: 26,
    borderRadius: 13,
    marginRight: 14,
    borderWidth: 2.5,
    borderColor: '#ffffff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  valueLabel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#666',
    marginRight: 12,
    minWidth: 35,
  },
  valueText: {
    fontSize: 17,
    color: '#1a1a1a',
    fontWeight: '600',
    flex: 1,
  },
  copyHint: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic',
    marginLeft: 8,
  },
});
