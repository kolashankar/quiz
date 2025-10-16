import * as Haptics from 'expo-haptics';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FEEDBACK_SETTINGS_KEY = '@feedback_settings';

interface FeedbackSettings {
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

class FeedbackService {
  private settings: FeedbackSettings = {
    soundEnabled: true,
    vibrationEnabled: true,
  };

  async initialize() {
    try {
      const saved = await AsyncStorage.getItem(FEEDBACK_SETTINGS_KEY);
      if (saved) {
        this.settings = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Error loading feedback settings:', error);
    }
  }

  async updateSettings(settings: Partial<FeedbackSettings>) {
    this.settings = { ...this.settings, ...settings };
    try {
      await AsyncStorage.setItem(FEEDBACK_SETTINGS_KEY, JSON.stringify(this.settings));
    } catch (error) {
      console.error('Error saving feedback settings:', error);
    }
  }

  getSettings(): FeedbackSettings {
    return this.settings;
  }

  // Vibration patterns
  async vibrate(type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error') {
    if (!this.settings.vibrationEnabled) return;

    try {
      switch (type) {
        case 'light':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          break;
        case 'medium':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          break;
        case 'heavy':
          await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          break;
        case 'success':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          break;
        case 'warning':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          break;
        case 'error':
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
          break;
      }
    } catch (error) {
      console.error('Haptic feedback error:', error);
    }
  }

  // Specific feedback actions
  async correctAnswer() {
    await this.vibrate('success');
  }

  async wrongAnswer() {
    await this.vibrate('error');
  }

  async buttonPress() {
    await this.vibrate('light');
  }

  async testComplete() {
    await this.vibrate('success');
  }

  async timerWarning() {
    await this.vibrate('warning');
  }
}

export const feedbackService = new FeedbackService();
