import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import {
  ChevronLeft,
  Bell,
  Mail,
  Smartphone,
  Moon,
  Shield,
  User,
  ChevronRight,
  LogOut,
  Crown,
  Download,
  Eye,
} from 'lucide-react-native';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';

export default function SettingsScreen() {
  const router = useRouter();
  const { userData, signOut, updateProfile } = useAuth();
  const { colors, isDark } = useTheme();
  const styles = useThemedStyles(getStyles);

  // Safeguard default values from user data or fallback to defaults
  const settings = userData?.settings || {
    pushNotifications: true,
    emailReports: false,
    darkMode: true,
    profileVisibility: true,
  };

  // Local values or fallback
  const pushNotifs = settings.pushNotifications;
  const emailReports = settings.emailReports;
  const bluetooth = (settings as any).bluetooth !== undefined ? (settings as any).bluetooth : false;
  const darkMode = settings.darkMode;
  const metricUnits = (settings as any).metricUnits !== undefined ? (settings as any).metricUnits : true;

  const handleToggleSetting = async (key: string, value: boolean) => {
    try {
      await updateProfile({
        settings: {
          ...settings,
          [key]: value,
        },
      });
    } catch (error) {
      console.error(`[Settings] Failed to update toggle ${key}:`, error);
    }
  };

  const handleToggleTrainerRole = () => {
    const currentRole = userData?.role || 'athlete';
    const newRole = currentRole === 'trainer' ? 'athlete' : 'trainer';

    Alert.alert(
      newRole === 'trainer' ? 'Become a Trainer' : 'Switch to Athlete',
      newRole === 'trainer'
        ? 'Are you sure you want to activate Trainer Mode? This will give you access to the Coach Dashboard and client assignment interfaces.'
        : 'Are you sure you want to switch back to Athlete Mode?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              await updateProfile({ role: newRole });
            } catch (err) {
              console.error('[Settings] Error switching role:', err);
              Alert.alert('Error', 'Failed to update account role.');
            }
          },
        },
      ]
    );
  };

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out of PULSE?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              // Auth Guard will redirect automatically, but replace path as double safety
              router.replace('/');
            } catch (err) {
              console.error('[Settings] Error signing out:', err);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => router.back()}
          style={styles.backButton}
        >
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings & Account</Text>
        <View style={styles.headerPlaceholder} />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Subscription Premium Card */}
        <GlassCard style={styles.premiumCard} active>
          <View style={styles.premiumGlow} />
          <View style={styles.premiumTop}>
            <View style={styles.premiumLeft}>
              <Text style={styles.premiumPlanLabel}>CURRENT PLAN</Text>
              <Text style={styles.premiumPlanName}>Elite Performer</Text>
              <Text style={styles.premiumRenewal}>Renewal on Sept 12, 2024</Text>
            </View>
            <Crown size={28} color={colors.primary} fill={isDark ? "rgba(204,255,0,0.15)" : "rgba(118,158,0,0.15)"} />
          </View>
          <TouchableOpacity activeOpacity={0.85} style={styles.manageSubButton}>
            <Text style={styles.manageSubText}>Manage Subscription</Text>
          </TouchableOpacity>
        </GlassCard>

        {/* Account Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>
          <GlassCard style={styles.listCard}>
            <RowLink
              icon={<User size={18} color={colors.textMuted} />}
              label="Personal Information"
              bordered
              onPress={() => router.push('/profile/edit')}
            />
            <RowLink
              icon={<Mail size={18} color={colors.textMuted} />}
              label="Email & Sign In"
              bordered
              onPress={() => {}}
            />
            <RowLink
              icon={<Smartphone size={18} color={colors.textMuted} />}
              label="Device & Sync"
              onPress={() => {}}
            />
          </GlassCard>
        </View>

        {/* Notifications Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>NOTIFICATIONS</Text>
          <GlassCard style={styles.listCard}>
            <ToggleRow
              icon={<Bell size={18} color={colors.textMuted} />}
              label="Push Notifications"
              description="Alerts for workouts and coach updates"
              value={pushNotifs}
              bordered
              onValueChange={(val) => handleToggleSetting('pushNotifications', val)}
            />
            <ToggleRow
              icon={<Mail size={18} color={colors.textMuted} />}
              label="Weekly Digest"
              description="Progress summaries and stats in your inbox"
              value={emailReports}
              bordered
              onValueChange={(val) => handleToggleSetting('emailReports', val)}
            />
            <ToggleRow
              icon={<Smartphone size={18} color={colors.textMuted} />}
              label="Bluetooth Accessories"
              description="Connect heart rate monitors & vital trackers"
              value={bluetooth}
              bordered
              onValueChange={(val) => handleToggleSetting('bluetooth', val)}
            />
            <ToggleRow
              icon={<Moon size={18} color={colors.textMuted} />}
              label="High-Contrast Dark Mode"
              description="OLED black layout optimization"
              value={darkMode}
              bordered
              onValueChange={(val) => handleToggleSetting('darkMode', val)}
            />
            <ToggleRow
              icon={<Shield size={18} color={colors.textMuted} />}
              label="Metric Units (kg/km)"
              description="Toggle standard metric vs imperial units"
              value={metricUnits}
              onValueChange={(val) => handleToggleSetting('metricUnits', val)}
            />
          </GlassCard>
        </View>

        {/* Privacy Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PRIVACY</Text>
          <GlassCard style={styles.listCard}>
            <TouchableOpacity
              activeOpacity={0.8}
              style={styles.rowItem}
              onPress={() => handleToggleSetting('profileVisibility', !settings.profileVisibility)}
            >
              <View style={styles.rowLeft}>
                <Eye size={18} color={colors.textMuted} />
                <Text style={styles.rowLabel}>Profile Visibility</Text>
              </View>
              <View style={settings.profileVisibility ? styles.publicBadge : styles.privateBadge}>
                <Text style={settings.profileVisibility ? styles.publicBadgeText : styles.privateBadgeText}>
                  {settings.profileVisibility ? 'PUBLIC' : 'PRIVATE'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity activeOpacity={0.8} style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Download size={18} color={colors.textMuted} />
                <Text style={styles.rowLabel}>Export Personal Data</Text>
              </View>
              <Download size={16} color={colors.textMuted} />
            </TouchableOpacity>
          </GlassCard>
        </View>

        {/* Trainer Access Section */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>TRAINER ACCREDITATION</Text>
          <GlassCard style={styles.listCard}>
            <View style={styles.rowItem}>
              <View style={styles.rowLeft}>
                <Crown size={18} color={colors.primary} fill={isDark ? "rgba(204,255,0,0.15)" : "rgba(118,158,0,0.15)"} />
                <View style={styles.rowMeta}>
                  <Text style={styles.rowLabel}>Trainer Mode</Text>
                  <Text style={styles.rowDescription}>Access dashboard & client controls</Text>
                </View>
              </View>
              <Switch
                value={userData?.role === 'trainer'}
                onValueChange={handleToggleTrainerRole}
                trackColor={{ false: '#3E3E3E', true: colors.primary }}
                thumbColor={userData?.role === 'trainer' ? '#000000' : '#888888'}
              />
            </View>
          </GlassCard>
        </View>

        {/* Sign Out */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSignOut}
          style={styles.signOutButton}
        >
          <LogOut size={18} color={colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>

        {/* Version Footer */}
        <Text style={styles.footerText}>
          PULSE v1.0.0 • Google Labs Stitch SDK
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

/* ─── Reusable sub-components ──────────────────────────────── */

function RowLink({
  icon,
  label,
  bordered = false,
  onPress,
}: {
  icon: React.ReactNode;
  label: string;
  bordered?: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(getStyles);
  return (
    <>
      <TouchableOpacity activeOpacity={0.7} onPress={onPress} style={styles.rowItem}>
        <View style={styles.rowLeft}>
          {icon}
          <Text style={styles.rowLabel}>{label}</Text>
        </View>
        <ChevronRight size={16} color={colors.textMuted} />
      </TouchableOpacity>
      {bordered && <View style={styles.divider} />}
    </>
  );
}

function ToggleRow({
  icon,
  label,
  description,
  value,
  onValueChange,
  bordered = false,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  bordered?: boolean;
}) {
  const { colors } = useTheme();
  const styles = useThemedStyles(getStyles);
  return (
    <>
      <View style={styles.rowItem}>
        <View style={styles.rowLeft}>
          {icon}
          <View style={styles.rowMeta}>
            <Text style={styles.rowLabel}>{label}</Text>
            <Text style={styles.rowDescription}>{description}</Text>
          </View>
        </View>
        <Switch
          value={value}
          onValueChange={onValueChange}
          trackColor={{ false: '#3E3E3E', true: colors.primary }}
          thumbColor={value ? '#000000' : '#888888'}
        />
      </View>
      {bordered && <View style={styles.divider} />}
    </>
  );
}

/* ─── Styles ────────────────────────────────────────────────── */

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  headerPlaceholder: {
    width: 36,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 48,
    gap: 24,
  },
  premiumCard: {
    padding: 20,
    gap: 16,
    overflow: 'hidden',
  },
  premiumGlow: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: isDark ? 'rgba(204, 255, 0, 0.08)' : 'rgba(118, 158, 0, 0.08)',
  },
  premiumTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  premiumLeft: {
    gap: 4,
  },
  premiumPlanLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1.5,
  },
  premiumPlanName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  premiumRenewal: {
    fontSize: 12,
    color: colors.textMuted,
  },
  manageSubButton: {
    height: 40,
    borderRadius: 6,
    backgroundColor: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  manageSubText: {
    color: colors.textPrimary,
    fontSize: 13,
    fontWeight: '600',
  },
  section: {
    gap: 8,
  },
  sectionLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 2,
    paddingLeft: 4,
  },
  listCard: {
    paddingVertical: 4,
  },
  rowItem: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rowMeta: {
    gap: 2,
  },
  rowLabel: {
    fontSize: 15,
    color: colors.textPrimary,
    fontWeight: '500',
  },
  rowDescription: {
    fontSize: 11,
    color: colors.textMuted,
  },
  publicBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: isDark ? 'rgba(204, 255, 0, 0.1)' : 'rgba(118, 158, 0, 0.1)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(204, 255, 0, 0.2)' : 'rgba(118, 158, 0, 0.2)',
  },
  publicBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
  },
  privateBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.05)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
  },
  privateBadgeText: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  divider: {
    height: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
    marginHorizontal: 16,
  },
  signOutButton: {
    height: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    backgroundColor: 'rgba(239, 68, 68, 0.04)',
    marginTop: 8,
  },
  signOutText: {
    color: colors.error,
    fontSize: 15,
    fontWeight: 'bold',
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
    opacity: 0.4,
    marginTop: 16,
  },
});
