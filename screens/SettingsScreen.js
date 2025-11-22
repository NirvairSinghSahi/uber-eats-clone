import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { logoutUser } from '../store/slices/authSlice';
import { setNotifications, setEmailUpdates, loadSettingsFromStorage, saveSettings } from '../store/slices/settingsSlice';
import { requestNotificationPermissions } from '../services/notificationService';
import { saveEmailPreferences } from '../services/emailService';

const SettingsScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const notifications = useAppSelector((state) => state.settings.notifications);
  const emailUpdates = useAppSelector((state) => state.settings.emailUpdates);

  useEffect(() => {
    dispatch(loadSettingsFromStorage());
  }, []);

  const handleNotificationsToggle = async (value) => {
    dispatch(setNotifications(value));
    await dispatch(saveSettings({ notifications: value, emailUpdates }));
    
    if (value) {
      const hasPermission = await requestNotificationPermissions();
      if (!hasPermission) {
        Alert.alert(
          'Permission Required',
          'Please enable notifications in your device settings to receive order updates.',
          [{ text: 'OK' }]
        );
        dispatch(setNotifications(false));
      } else {
        Alert.alert('Success', 'Notifications enabled! You\'ll receive order updates.');
      }
    }
  };

  const handleEmailUpdatesToggle = async (value) => {
    dispatch(setEmailUpdates(value));
    await dispatch(saveSettings({ notifications, emailUpdates: value }));
    
    if (user?.uid) {
      await saveEmailPreferences(user.uid, value);
    }
    
    Alert.alert(
      value ? 'Email Updates Enabled' : 'Email Updates Disabled',
      value 
        ? 'You\'ll receive email updates about your orders and promotions.'
        : 'You won\'t receive email updates anymore.'
    );
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            await dispatch(logoutUser());
          },
        },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="notifications-outline" size={24} color="#000" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Push Notifications</Text>
              <Text style={styles.settingDescription}>Receive order updates</Text>
            </View>
          </View>
          <Switch
            value={notifications}
            onValueChange={handleNotificationsToggle}
            trackColor={{ false: '#ccc', true: '#000' }}
          />
        </View>
        <View style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="mail-outline" size={24} color="#000" />
            <View style={styles.settingText}>
              <Text style={styles.settingLabel}>Email Updates</Text>
              <Text style={styles.settingDescription}>Order confirmations & promotions</Text>
            </View>
          </View>
          <Switch
            value={emailUpdates}
            onValueChange={handleEmailUpdatesToggle}
            trackColor={{ false: '#ccc', true: '#000' }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <TouchableOpacity style={styles.settingItem}>
          <View style={styles.settingInfo}>
            <Ionicons name="information-circle-outline" size={24} color="#000" />
            <Text style={styles.settingLabel}>App Version</Text>
          </View>
          <Text style={styles.settingValue}>1.0.0</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('TermsOfService')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="document-text-outline" size={24} color="#000" />
            <Text style={styles.settingLabel}>Terms of Service</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.settingItem}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <View style={styles.settingInfo}>
            <Ionicons name="shield-checkmark-outline" size={24} color="#000" />
            <Text style={styles.settingLabel}>Privacy Policy</Text>
          </View>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Sign Out</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    marginLeft: 12,
    flex: 1,
  },
  settingLabel: {
    fontSize: 16,
    color: '#000',
    marginBottom: 2,
  },
  settingDescription: {
    fontSize: 12,
    color: '#666',
  },
  settingValue: {
    fontSize: 14,
    color: '#666',
  },
  logoutButton: {
    margin: 16,
    padding: 16,
    backgroundColor: '#000',
    borderRadius: 8,
    alignItems: 'center',
  },
  logoutButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default SettingsScreen;

