import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { signup, clearError } from '../store/slices/authSlice';

const SignupScreen = () => {
  const navigation = useNavigation();
  const dispatch = useAppDispatch();
  const loading = useAppSelector((state) => state.auth.loading);
  const error = useAppSelector((state) => state.auth.error);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [emailError, setEmailError] = useState('');

  const handleSignup = async () => {
    // Clear any previous errors
    dispatch(clearError());
    setEmailError('');
    setPasswordError('');

    // Validate all fields
    if (!name || !email || !password || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setEmailError('Please enter a valid email address');
      Alert.alert('Error', 'Please enter a valid email address', [
        {
          text: 'OK',
          onPress: () => {
            // Use setTimeout to ensure state updates after alert dismisses
            setTimeout(() => {
              // Clear both email and password fields for email errors
              setEmail('');
              setPassword('');
              setConfirmPassword('');
              setEmailError('');
              setPasswordError('');
            }, 100);
          },
        },
      ]);
      return;
    }

    // Validate password length
    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters', [
        {
          text: 'OK',
          onPress: () => {
            // Use setTimeout to ensure state updates after alert dismisses
            setTimeout(() => {
              // Clear ONLY password fields for password errors (NOT email)
              setPassword('');
              setConfirmPassword('');
              setPasswordError('');
            }, 100);
          },
        },
      ]);
      return;
    }

    // Check if passwords match
    if (password !== confirmPassword) {
      setPasswordError('Passwords do not match');
      Alert.alert('Error', 'Passwords do not match. Please check and try again.', [
        {
          text: 'OK',
          onPress: () => {
            // Use setTimeout to ensure state updates after alert dismisses
            setTimeout(() => {
              // Clear ONLY password fields for password errors (NOT email)
              setPassword('');
              setConfirmPassword('');
              setPasswordError('');
            }, 100);
          },
        },
      ]);
      return;
    }

    try {
      const result = await dispatch(signup(email, password, name));
      
      // The signup thunk returns { success: true, user } or { success: false, error }
      if (result && result.success) {
        // Signup successful - navigation will happen automatically via auth state change
        Alert.alert('Success', 'Account created successfully!');
        return;
      } else {
        // Signup failed
        const errorMessage = result?.error || error || 'Signup failed. Please try again.';
        
        // Provide user-friendly error messages
        let friendlyMessage = errorMessage;
        let isEmailError = false;
        
        if (errorMessage.includes('email-already-in-use')) {
          friendlyMessage = 'This email is already registered. Please sign in instead.';
          isEmailError = true;
        } else if (errorMessage.includes('invalid-email')) {
          friendlyMessage = 'Please enter a valid email address.';
          isEmailError = true;
        } else if (errorMessage.includes('weak-password')) {
          friendlyMessage = 'Password is too weak. Please use a stronger password.';
          isEmailError = false; // Password error
        } else if (errorMessage.includes('network')) {
          friendlyMessage = 'Network error. Please check your internet connection.';
          isEmailError = false; // Don't clear fields for network errors
        }
        
        Alert.alert('Signup Failed', friendlyMessage, [
          {
            text: 'OK',
            onPress: () => {
              // Use setTimeout to ensure state updates after alert dismisses
              setTimeout(() => {
                if (isEmailError) {
                  // Clear both email and password fields for email errors
                  setEmail('');
                  setPassword('');
                  setConfirmPassword('');
                  setEmailError('');
                  setPasswordError('');
                } else if (errorMessage.includes('weak-password')) {
                  // Clear ONLY password fields for password errors (NOT email)
                  setPassword('');
                  setConfirmPassword('');
                  setPasswordError('');
                }
                // For network errors, don't clear any fields
              }, 100);
            },
          },
        ]);
      }
    } catch (err) {
      console.error('Signup error:', err);
      Alert.alert('Error', err.message || 'An unexpected error occurred. Please try again.');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Sign up to get started</Text>

        <TextInput
          style={styles.input}
          placeholder="Full Name"
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />

        <TextInput
          style={[styles.input, emailError && styles.inputError]}
          placeholder="Email"
          value={email}
          onChangeText={(text) => {
            setEmail(text);
            setEmailError('');
            dispatch(clearError());
          }}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />
        {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}

        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Password"
          value={password}
          onChangeText={(text) => {
            setPassword(text);
            setPasswordError('');
            // Clear confirm password error if passwords now match
            if (text === confirmPassword && confirmPassword) {
              setPasswordError('');
            }
          }}
          secureTextEntry
          autoCapitalize="none"
        />
        {password && password.length < 6 && (
          <Text style={styles.hintText}>Password must be at least 6 characters</Text>
        )}

        <TextInput
          style={[styles.input, passwordError && styles.inputError]}
          placeholder="Confirm Password"
          value={confirmPassword}
          onChangeText={(text) => {
            setConfirmPassword(text);
            // Real-time password match validation
            if (text && text !== password) {
              setPasswordError('Passwords do not match');
            } else {
              setPasswordError('');
            }
          }}
          secureTextEntry
          autoCapitalize="none"
        />
        {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}

        <TouchableOpacity
          style={[styles.button, loading && styles.disabledButton]}
          onPress={handleSignup}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Sign Up</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.linkButton}
          onPress={() => navigation.navigate('Login')}
        >
          <Text style={styles.linkText}>
            Already have an account? <Text style={styles.linkTextBold}>Sign In</Text>
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    marginBottom: 32,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    padding: 16,
    fontSize: 16,
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  button: {
    backgroundColor: '#000',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  linkButton: {
    marginTop: 24,
    alignItems: 'center',
  },
  linkText: {
    fontSize: 14,
    color: '#666',
  },
  linkTextBold: {
    fontWeight: '600',
    color: '#000',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 2,
  },
  errorText: {
    color: '#ff4444',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  hintText: {
    color: '#666',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
});

export default SignupScreen;

