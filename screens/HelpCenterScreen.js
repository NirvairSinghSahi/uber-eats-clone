import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const HelpCenterScreen = () => {
  const faqs = [
    {
      question: 'How do I place an order?',
      answer: 'Browse restaurants, add items to your cart, and proceed to checkout.',
    },
    {
      question: 'How long does delivery take?',
      answer: 'Delivery typically takes 30-45 minutes depending on your location.',
    },
    {
      question: 'Can I cancel my order?',
      answer: 'You can cancel your order within 5 minutes of placing it.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept credit/debit cards and cash on delivery.',
    },
    {
      question: 'How do I track my order?',
      answer: 'You can track your order in the Order History section of your profile.',
    },
  ];

  const handleContactSupport = () => {
    Linking.openURL('mailto:support@ubereatsclone.com');
  };

  const handleCallSupport = () => {
    Linking.openURL('tel:+1234567890');
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Help Center</Text>
        <Text style={styles.headerSubtitle}>How can we help you?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index} style={styles.faqItem}>
            <Text style={styles.faqQuestion}>{faq.question}</Text>
            <Text style={styles.faqAnswer}>{faq.answer}</Text>
          </View>
        ))}
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Contact Support</Text>
        <TouchableOpacity style={styles.contactButton} onPress={handleContactSupport}>
          <Ionicons name="mail-outline" size={24} color="#000" />
          <Text style={styles.contactButtonText}>Email Support</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.contactButton} onPress={handleCallSupport}>
          <Ionicons name="call-outline" size={24} color="#000" />
          <Text style={styles.contactButtonText}>Call Support</Text>
          <Ionicons name="chevron-forward" size={24} color="#ccc" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 16,
  },
  faqItem: {
    marginBottom: 24,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  faqQuestion: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  faqAnswer: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    marginBottom: 12,
  },
  contactButtonText: {
    fontSize: 16,
    color: '#000',
    marginLeft: 12,
    flex: 1,
  },
});

export default HelpCenterScreen;

