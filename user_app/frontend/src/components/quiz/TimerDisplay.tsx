import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TimerDisplayProps {
  timeLeft: number;
  isRunning: boolean;
  onPause: () => void;
  onResume: () => void;
  formatTime: (seconds: number) => string;
  getTimeStatus: () => 'normal' | 'warning' | 'critical';
}

export const TimerDisplay: React.FC<TimerDisplayProps> = ({
  timeLeft,
  isRunning,
  onPause,
  onResume,
  formatTime,
  getTimeStatus,
}) => {
  const status = getTimeStatus();

  const getStatusColor = () => {
    switch (status) {
      case 'critical':
        return '#FF3B30';
      case 'warning':
        return '#FF9500';
      default:
        return '#34C759';
    }
  };

  return (
    <View style={styles.container}>
      <View style={[styles.timerContainer, { borderColor: getStatusColor() }]}>
        <Ionicons
          name="time-outline"
          size={18}
          color={getStatusColor()}
        />
        <Text style={[styles.timerText, { color: getStatusColor() }]}>
          {formatTime(timeLeft)}
        </Text>
        <TouchableOpacity
          onPress={isRunning ? onPause : onResume}
          style={styles.pauseButton}
        >
          <Ionicons
            name={isRunning ? 'pause' : 'play'}
            size={16}
            color={getStatusColor()}
          />
        </TouchableOpacity>
      </View>
      
      {status === 'critical' && (
        <View style={styles.warningContainer}>
          <Ionicons name="warning" size={16} color="#FF3B30" />
          <Text style={styles.warningText}>Time is running out!</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 2,
    backgroundColor: '#FFFFFF',
  },
  timerText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
    minWidth: 60,
    textAlign: 'center',
  },
  pauseButton: {
    padding: 4,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  warningText: {
    fontSize: 12,
    color: '#FF3B30',
    marginLeft: 4,
    fontWeight: '500',
  },
});