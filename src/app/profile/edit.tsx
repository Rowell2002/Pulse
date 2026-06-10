import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Image,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ArrowLeft, Camera, Link, Share2, Globe, Lock, ChevronRight } from 'lucide-react-native';
import { COLORS } from '../../theme/colors';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, query, where, getDocs, limit } from 'firebase/firestore';

export default function EditProfileScreen() {
  const router = useRouter();
  const { userData, updateProfile } = useAuth();

  const [fullName, setFullName] = useState(userData?.name || '');
  const [username, setUsername] = useState(userData?.username || '');
  const [bio, setBio] = useState(userData?.bio || '');
  const [avatar, setAvatar] = useState(userData?.avatar || '');
  const [instagram, setInstagram] = useState(userData?.instagram || '');
  const [twitter, setTwitter] = useState(userData?.twitter || '');
  const [website, setWebsite] = useState(userData?.website || '');

  const [focusedField, setFocusedField] = useState<string | null>(null);
  const avatarInputRef = React.useRef<TextInput>(null);

  const handleFocusAvatarInput = () => {
    avatarInputRef.current?.focus();
  };
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const trimmedName = fullName.trim();
    const trimmedUsername = username.trim().toLowerCase();

    if (!trimmedName) {
      Alert.alert('Error', 'Full name cannot be empty.');
      return;
    }

    if (!trimmedUsername) {
      Alert.alert('Error', 'Username cannot be empty.');
      return;
    }

    const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;
    if (!usernameRegex.test(trimmedUsername)) {
      Alert.alert(
        'Error',
        'Username must be between 3 and 20 characters and contain only letters, numbers, and underscores.'
      );
      return;
    }

    setIsSaving(true);
    try {
      // Check if username is already taken by another user
      if (trimmedUsername !== userData?.username?.toLowerCase()) {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, where('username', '==', trimmedUsername), limit(1));
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const docUser = querySnapshot.docs[0].data();
          if (docUser.uid !== userData?.uid) {
            Alert.alert('Error', 'This username is already taken. Please choose another.');
            setIsSaving(false);
            return;
          }
        }
      }

      await updateProfile({
        name: trimmedName,
        username: trimmedUsername,
        bio,
        instagram,
        twitter,
        website,
        avatar: avatar.trim(),
      });
      router.back();
    } catch (error: any) {
      console.error('[EditProfile] Error saving profile:', error);
      Alert.alert('Error', error.message || 'Failed to save profile changes.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        {/* Contextual Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => router.back()}
              style={styles.backButton}
              disabled={isSaving}
            >
              <ArrowLeft size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.brandTitle}>PULSE</Text>
          </View>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.back()}
            style={styles.cancelButton}
            disabled={isSaving}
          >
            <Text style={styles.cancelText}>CANCEL</Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Profile Photo Section */}
          <View style={styles.photoSection}>
            <View style={styles.avatarWrapper}>
              <View style={styles.avatarBorder}>
                <Image
                  source={{
                    uri: avatar || 'https://lh3.googleusercontent.com/aida-public/AB6AXuBPLec3e4wQZMTx7tJorZXjjXzORSwVZWYl3y6GCF7eu1mjUrk5QMlPazqaXlZIg18YGqkyIwI2KP_bqGzRtz17XGo6ZflvUS_EzNV3B6NvvyqjfNUKPhSVwcFU5jRkw_fJwkjhL4PeiP8WBV4A9umQRcKxZOIBPp6WHKm7p5Oj6Qfrz7r8PganYgXnXuICVP8l7uYx_JhF5A8VzokaMBjFyE3DXDDd0wZGjj1ds2oieWkK9oxr04-6ScXH2VpeYGjUoLgv8UiGUdJI',
                  }}
                  style={styles.avatarImage}
                />
              </View>
              <TouchableOpacity
                activeOpacity={0.9}
                style={styles.cameraButton}
                disabled={isSaving}
                onPress={handleFocusAvatarInput}
              >
                <Camera size={16} color="#000000" />
              </TouchableOpacity>
            </View>
            <TouchableOpacity activeOpacity={0.8} disabled={isSaving} onPress={handleFocusAvatarInput}>
              <Text style={styles.changePhotoText}>Change Photo</Text>
            </TouchableOpacity>
          </View>

          {/* Basic Info Glass Card */}
          <GlassCard style={styles.card}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Full Name</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'name' && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.input}
                  value={fullName}
                  onChangeText={setFullName}
                  onFocus={() => setFocusedField('name')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={COLORS.textMuted}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Username</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'username' && styles.inputFocused,
                ]}
              >
                <Text style={styles.usernamePrefix}>@</Text>
                <TextInput
                  style={[styles.input, styles.usernameInput]}
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                  onFocus={() => setFocusedField('username')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={COLORS.textMuted}
                  editable={!isSaving}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Profile Photo URL</Text>
              <View
                style={[
                  styles.inputWrapper,
                  focusedField === 'avatar' && styles.inputFocused,
                ]}
              >
                <TextInput
                  ref={avatarInputRef}
                  style={styles.input}
                  value={avatar}
                  onChangeText={setAvatar}
                  onFocus={() => setFocusedField('avatar')}
                  onBlur={() => setFocusedField(null)}
                  placeholder="https://example.com/avatar.jpg"
                  placeholderTextColor={COLORS.textMuted}
                  editable={!isSaving}
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>Bio</Text>
              <View
                style={[
                  styles.textareaWrapper,
                  focusedField === 'bio' && styles.inputFocused,
                ]}
              >
                <TextInput
                  style={styles.textarea}
                  value={bio}
                  onChangeText={setBio}
                  multiline={true}
                  numberOfLines={3}
                  onFocus={() => setFocusedField('bio')}
                  onBlur={() => setFocusedField(null)}
                  placeholderTextColor={COLORS.textMuted}
                  editable={!isSaving}
                />
              </View>
            </View>
          </GlassCard>

          {/* Social Connections Card */}
          <GlassCard style={styles.card}>
            <Text style={styles.cardTitle}>Social Connections</Text>
            <View style={styles.socialList}>
              <View
                style={[
                  styles.socialInputWrapper,
                  focusedField === 'instagram' && styles.inputFocused,
                ]}
              >
                <Link size={18} color={COLORS.textMuted} style={styles.socialIcon} />
                <TextInput
                  style={styles.socialInput}
                  value={instagram}
                  onChangeText={setInstagram}
                  placeholder="Instagram URL"
                  placeholderTextColor={COLORS.textMuted}
                  onFocus={() => setFocusedField('instagram')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>

              <View
                style={[
                  styles.socialInputWrapper,
                  focusedField === 'twitter' && styles.inputFocused,
                ]}
              >
                <Share2 size={18} color={COLORS.textMuted} style={styles.socialIcon} />
                <TextInput
                  style={styles.socialInput}
                  value={twitter}
                  onChangeText={setTwitter}
                  placeholder="Twitter/X Profile"
                  placeholderTextColor={COLORS.textMuted}
                  onFocus={() => setFocusedField('twitter')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>

              <View
                style={[
                  styles.socialInputWrapper,
                  focusedField === 'website' && styles.inputFocused,
                ]}
              >
                <Globe size={18} color={COLORS.textMuted} style={styles.socialIcon} />
                <TextInput
                  style={styles.socialInput}
                  value={website}
                  onChangeText={setWebsite}
                  placeholder="Personal Website"
                  placeholderTextColor={COLORS.textMuted}
                  onFocus={() => setFocusedField('website')}
                  onBlur={() => setFocusedField(null)}
                  autoCapitalize="none"
                  editable={!isSaving}
                />
              </View>
            </View>
          </GlassCard>

          {/* Privacy & Security Link Card */}
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={() => router.push('/profile/settings')}
            style={styles.privacyLinkCard}
            disabled={isSaving}
          >
            <View style={styles.privacyLeft}>
              <Lock size={18} color={COLORS.textMuted} />
              <Text style={styles.privacyText}>Privacy & Security</Text>
            </View>
            <ChevronRight size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        </ScrollView>

        {/* Fixed Save Changes Button Block */}
        <View style={styles.bottomBarContainer}>
          <TouchableOpacity
            activeOpacity={0.9}
            onPress={handleSave}
            style={[styles.saveButton, isSaving && styles.disabledButton]}
            disabled={isSaving}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color="#000000" />
            ) : (
              <Text style={styles.saveButtonText}>SAVE CHANGES</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    height: 64,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    backgroundColor: 'rgba(30, 30, 30, 0.7)',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderGlass,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  brandTitle: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: -1,
    color: COLORS.primary,
  },
  cancelButton: {
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  cancelText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: COLORS.textMuted,
    fontFamily: 'System',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 120,
    gap: 24,
  },
  photoSection: {
    alignItems: 'center',
    gap: 12,
    marginVertical: 10,
  },
  avatarWrapper: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  avatarBorder: {
    width: '100%',
    height: '100%',
    borderRadius: 60,
    borderWidth: 2,
    borderColor: COLORS.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  cameraButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: COLORS.background,
  },
  changePhotoText: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  card: {
    padding: 20,
    gap: 16,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    letterSpacing: 0.5,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 1,
    color: COLORS.textMuted,
    paddingLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  inputFocused: {
    borderColor: COLORS.primary,
  },
  usernamePrefix: {
    fontSize: 15,
    color: COLORS.textMuted,
    marginRight: 2,
  },
  input: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    height: '100%',
  },
  usernameInput: {
    paddingLeft: 0,
  },
  textareaWrapper: {
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    height: 96,
  },
  textarea: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 15,
    height: '100%',
    textAlignVertical: 'top',
  },
  socialList: {
    gap: 12,
  },
  socialInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  socialIcon: {
    marginRight: 10,
  },
  socialInput: {
    flex: 1,
    color: COLORS.textPrimary,
    fontSize: 14,
    height: '100%',
  },
  privacyLinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255,255,255,0.02)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    borderRadius: 8,
    paddingHorizontal: 16,
    height: 56,
  },
  privacyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  privacyText: {
    fontSize: 15,
    color: COLORS.textPrimary,
    fontWeight: '500',
  },
  bottomBarContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#0E0E0E',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    paddingVertical: 20,
    paddingHorizontal: 20,
  },
  saveButton: {
    height: 52,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledButton: {
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
  },
});
