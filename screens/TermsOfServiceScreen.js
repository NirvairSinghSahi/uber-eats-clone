import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const TermsOfServiceScreen = () => {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Terms of Service</Text>
        <View style={styles.placeholder} />
      </View>
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.lastUpdated}>Last Updated: {new Date().toLocaleDateString()}</Text>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
          <Text style={styles.paragraph}>
            By accessing and using the Uber Eats Clone application ("App"), you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>2. Description of Service</Text>
          <Text style={styles.paragraph}>
            The App provides a platform for users to discover restaurants, place food orders, and have meals delivered to their specified location. We act as an intermediary between users and restaurants, facilitating the ordering and delivery process.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3. User Accounts</Text>
          <Text style={styles.paragraph}>
            To use certain features of the App, you must register for an account. You agree to:
          </Text>
          <Text style={styles.bulletPoint}>• Provide accurate, current, and complete information</Text>
          <Text style={styles.bulletPoint}>• Maintain and update your account information</Text>
          <Text style={styles.bulletPoint}>• Keep your password secure and confidential</Text>
          <Text style={styles.bulletPoint}>• Notify us immediately of any unauthorized use</Text>
          <Text style={styles.paragraph}>
            You are responsible for all activities that occur under your account.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>4. Orders and Payments</Text>
          <Text style={styles.paragraph}>
            When you place an order through the App:
          </Text>
          <Text style={styles.bulletPoint}>• You agree to pay all charges associated with your order</Text>
          <Text style={styles.bulletPoint}>• Prices are subject to change without notice</Text>
          <Text style={styles.bulletPoint}>• Delivery fees and taxes may apply</Text>
          <Text style={styles.bulletPoint}>• Payment is due at the time of delivery (cash on delivery)</Text>
          <Text style={styles.paragraph}>
            We reserve the right to refuse or cancel any order at our discretion.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>5. Delivery</Text>
          <Text style={styles.paragraph}>
            Delivery times are estimates and not guaranteed. We are not responsible for delays caused by:
          </Text>
          <Text style={styles.bulletPoint}>• Weather conditions</Text>
          <Text style={styles.bulletPoint}>• Traffic or road conditions</Text>
          <Text style={styles.bulletPoint}>• Restaurant preparation times</Text>
          <Text style={styles.bulletPoint}>• Incorrect delivery addresses</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>6. Cancellations and Refunds</Text>
          <Text style={styles.paragraph}>
            Orders may be cancelled before preparation begins. Once an order is being prepared, cancellation may not be possible. Refunds are handled on a case-by-case basis and are subject to restaurant policies.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>7. User Conduct</Text>
          <Text style={styles.paragraph}>
            You agree not to:
          </Text>
          <Text style={styles.bulletPoint}>• Use the App for any illegal purpose</Text>
          <Text style={styles.bulletPoint}>• Violate any laws or regulations</Text>
          <Text style={styles.bulletPoint}>• Infringe on intellectual property rights</Text>
          <Text style={styles.bulletPoint}>• Harass, abuse, or harm other users</Text>
          <Text style={styles.bulletPoint}>• Interfere with the App's operation</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>8. Intellectual Property</Text>
          <Text style={styles.paragraph}>
            All content, features, and functionality of the App are owned by us and are protected by international copyright, trademark, and other intellectual property laws.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>9. Limitation of Liability</Text>
          <Text style={styles.paragraph}>
            To the maximum extent permitted by law, we shall not be liable for any indirect, incidental, special, consequential, or punitive damages, or any loss of profits or revenues, whether incurred directly or indirectly, or any loss of data, use, goodwill, or other intangible losses.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>10. Modifications to Terms</Text>
          <Text style={styles.paragraph}>
            We reserve the right to modify these terms at any time. We will notify users of any material changes. Your continued use of the App after such modifications constitutes acceptance of the updated terms.
          </Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>11. Contact Information</Text>
          <Text style={styles.paragraph}>
            If you have any questions about these Terms of Service, please contact us at:
          </Text>
          <Text style={styles.contactInfo}>Email: support@ubereatsclone.com</Text>
          <Text style={styles.contactInfo}>Phone: 1-800-UberEats</Text>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            By using this App, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
  },
  placeholder: {
    width: 32,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  lastUpdated: {
    fontSize: 12,
    color: '#999',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginBottom: 8,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#333',
    lineHeight: 22,
    marginLeft: 16,
    marginBottom: 6,
  },
  contactInfo: {
    fontSize: 14,
    color: '#000',
    fontWeight: '600',
    marginTop: 8,
  },
  footer: {
    marginTop: 32,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  footerText: {
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
    textAlign: 'center',
    fontStyle: 'italic',
  },
});

export default TermsOfServiceScreen;

