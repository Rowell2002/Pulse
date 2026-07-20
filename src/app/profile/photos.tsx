import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Image,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { ChevronLeft, Camera, Trash2, X, Plus, Calendar, Image as ImageIcon, ChevronDown, ChevronRight } from 'lucide-react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db, storage } from '../../config/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const { width } = Dimensions.get('window');

interface ProgressPhoto {
  id: string;
  url: string;
  angle: 'front' | 'side' | 'back';
  date: string; // YYYY-MM-DD
  createdAt: any;
}

// Fallback high-quality bodybuilding progress stubs
const MOCK_PHOTOS: ProgressPhoto[] = [
  {
    id: 'mock-1-f',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYhKoiAselBiCxRBlzyYMw8xWps4s8qVztGHesADBVYrQk1g5ezkzbi4LjSODMnrMs7yWAWbrVv2jDRH1xVHRXCyb4fokO1k7MR37FiVKEy6wb3gwNawbNjEo8V674fDzvOYaqmqDBEvjM1Tac8mptP7lO1tcKzAhb4xYPmfSt_YeD-oely4V3Ehf-qhPgUh31t6zlxbg_TmyQOy552gi2g-Grdlinw_hS_aMfkFYGfoJiRaMI0QMmyXaJhcAXQvQKbb4VGrDamVbM',
    angle: 'front',
    date: '2026-05-18',
    createdAt: new Date(),
  },
  {
    id: 'mock-1-s',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjJrCKDiFz78HKuK8zbLpR2UXF6wppruzUsLGo8CE1HR8m04G6JKeYPp9cNJRz6oCzailuMycfgP-ReOIk0F3vYe86fFqhTDi58uP3OA0qP--skBmMNAL24UPrNPArWtRXN-SRdkB5-__GMon1teys8JBk2NPjd3SuU4OMs9DwLpZkzxkrD-Xo6rV84L22Mr_2J7JmXIVlIt8SREAbEly6uNR7wyDO0W7fvO1FkbaEp31vYs18wWPlWzihENSDVhOwYs2XmZaNjUbu',
    angle: 'side',
    date: '2026-05-18',
    createdAt: new Date(),
  },
  {
    id: 'mock-1-b',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUv18p0HP1nbaX8Zd4Sg5TnYmfIvejB-9wUNq6acP6TNcWTu_gx1SE0vKK5Gm89GnxzW0ineEZhsDmYEqBywq35LD0q2rYM4uE80gcPLpM-bsgimSFUfzdv1Qf9XddZsOfztWw33vCpgl2TRLBPNiB0EVpiNOSWU8mXgtsUV9yNyYQ3dSU8e_6dUDaI9x9Ug55ieDU4pES7NzX8PyyxyqCjrVy3NiVuT2WXiUEQe3G_UjR7RMoYYPQNYaYaJyIVzNyrJPazrGt2Jp_',
    angle: 'back',
    date: '2026-05-18',
    createdAt: new Date(),
  },
  {
    id: 'mock-2-f',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDXxXkYBF3Q4G56I8Ls6obFGOcBgkhpi6xjYg4LoaEAYOqVQs2SD5LJJzWpYMeCkDk58dDC-aI7tj6bPyLNxf8tjl00oZrvGvIMFYRa2Xb0UK9T2G9JszDPwW87ZE2ELZGkqsfmVuQN4c0wf5UoFC9-shOJKCWtnayz_aqqvUbnPnsLYeoOvy6eJQOVKCMRz8ZbSzvnhnse_d7aLmtL2eNkZqrJ3TUY6D0hTOAEMfbEMpm22z2lS9FWuxFNPM-muYFVwainpEK0-4rj',
    angle: 'front',
    date: '2026-04-28',
    createdAt: new Date(),
  },
  {
    id: 'mock-2-s',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAM7GArMidziW_B5OPNyun-BWa5w0LkhKVXCKqURZybpzPljsKLdjwgNJRvOrwBkZNdLBC7BEm7GFNUcAY-Y5q-LEiHNbjzlMVgRb1mCDfSXCoOrbEE99Au6R5Q1WQv7FKy_6vAmbwrH_F9uQsdrl1H1KJoQXNZkwCnadodGl3n4bSdBETqLFNUnv77BM9tMhbZBBVLcD3S357AlX0dJYBktXV43w4hgMUXPI9KCY-cllW4A9aZrSDtub4snG5c3KUw-TBZZ_Rq8CGp',
    angle: 'side',
    date: '2026-04-28',
    createdAt: new Date(),
  },
  {
    id: 'mock-2-b',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8OvuV7JUz2PjUEzxl0P7rsUcnXZkhyg1Lhw1XJ_5zCG07W60MB8ge6503HflFTM-JtOLGLTIvF6fMRZ7zTh09X5iV1EhAocfpADPm5q4Cl15RhbrevXUnLB-OeN6zayg0BrfbuFAPoX-ehrmsHnIWkQIsWIwiFvQf_Vf5YKqxXUcIECD34C1DzzBsIgUKyn0luuv15YcyL58iIk9_4EO3gbwlSZ_T98rl4j-wDh2uI7fGUj0AeDFlGN2ZjMTkWmCJ70rNn1-cVzVB',
    angle: 'back',
    date: '2026-04-28',
    createdAt: new Date(),
  },
  {
    id: 'mock-3-f',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAYhKoiAselBiCxRBlzyYMw8xWps4s8qVztGHesADBVYrQk1g5ezkzbi4LjSODMnrMs7yWAWbrVv2jDRH1xVHRXCyb4fokO1k7MR37FiVKEy6wb3gwNawbNjEo8V674fDzvOYaqmqDBEvjM1Tac8mptP7lO1tcKzAhb4xYPmfSt_YeD-oely4V3Ehf-qhPgUh31t6zlxbg_TmyQOy552gi2g-Grdlinw_hS_aMfkFYGfoJiRaMI0QMmyXaJhcAXQvQKbb4VGrDamVbM',
    angle: 'front',
    date: '2026-03-29',
    createdAt: new Date(),
  },
  {
    id: 'mock-3-s',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDjJrCKDiFz78HKuK8zbLpR2UXF6wppruzUsLGo8CE1HR8m04G6JKeYPp9cNJRz6oCzailuMycfgP-ReOIk0F3vYe86fFqhTDi58uP3OA0qP--skBmMNAL24UPrNPArWtRXN-SRdkB5-__GMon1teys8JBk2NPjd3SuU4OMs9DwLpZkzxkrD-Xo6rV84L22Mr_2J7JmXIVlIt8SREAbEly6uNR7wyDO0W7fvO1FkbaEp31vYs18wWPlWzihENSDVhOwYs2XmZaNjUbu',
    angle: 'side',
    date: '2026-03-29',
    createdAt: new Date(),
  },
  {
    id: 'mock-3-b',
    url: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAUv18p0HP1nbaX8Zd4Sg5TnYmfIvejB-9wUNq6acP6TNcWTu_gx1SE0vKK5Gm89GnxzW0ineEZhsDmYEqBywq35LD0q2rYM4uE80gcPLpM-bsgimSFUfzdv1Qf9XddZsOfztWw33vCpgl2TRLBPNiB0EVpiNOSWU8mXgtsUV9yNyYQ3dSU8e_6dUDaI9x9Ug55ieDU4pES7NzX8PyyxyqCjrVy3NiVuT2WXiUEQe3G_UjR7RMoYYPQNYaYaJyIVzNyrJPazrGt2Jp_',
    angle: 'back',
    date: '2026-03-29',
    createdAt: new Date(),
  },
];

export default function ProgressPhotosScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user } = useAuth();
  const styles = useThemedStyles(getStyles);

  const [photos, setPhotos] = useState<ProgressPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  // Upload state
  const [uploadModalVisible, setUploadModalVisible] = useState(false);
  const [uploadAngle, setUploadAngle] = useState<'front' | 'side' | 'back'>('front');
  const [uploadDate, setUploadDate] = useState('');
  const [selectedImageUri, setSelectedImageUri] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  // Custom Calendar Generator Logic
  const getCalendarDays = () => {
    const year = currentCalendarMonth.getFullYear();
    const month = currentCalendarMonth.getMonth();

    // First day of current month
    const firstDay = new Date(year, month, 1);
    const startOffset = firstDay.getDay(); // 0 is Sun, 6 is Sat

    // Total days in current month
    const totalDays = new Date(year, month + 1, 0).getDate();

    const days = [];

    // Add empty slots for start offset days
    for (let i = 0; i < startOffset; i++) {
      days.push(null);
    }

    // Add actual days
    for (let day = 1; day <= totalDays; day++) {
      days.push(day);
    }

    return days;
  };

  const calendarMonthLabel = () => {
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    return `${months[currentCalendarMonth.getMonth()]} ${currentCalendarMonth.getFullYear()}`;
  };

  const handleNextMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() + 1, 1));
  };

  const handlePrevMonth = () => {
    setCurrentCalendarMonth(new Date(currentCalendarMonth.getFullYear(), currentCalendarMonth.getMonth() - 1, 1));
  };

  const handleSelectDay = (day: number) => {
    const yyyy = currentCalendarMonth.getFullYear();
    const mm = String(currentCalendarMonth.getMonth() + 1).padStart(2, '0');
    const dd = String(day).padStart(2, '0');
    setUploadDate(`${yyyy}-${mm}-${dd}`);
    setShowCalendar(false);
  };

  // Viewer state
  const [selectedPhoto, setSelectedPhoto] = useState<ProgressPhoto | null>(null);
  
  // Comparison state
  const [compareMode, setCompareMode] = useState(false);
  const [comparePhoto, setComparePhoto] = useState<ProgressPhoto | null>(null);

  // Fetch photos timeline
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'users', user.uid, 'progress_photos'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const list: ProgressPhoto[] = [];
        querySnap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as ProgressPhoto);
        });

        // Use stubs if database list is empty
        if (list.length === 0) {
          setPhotos(MOCK_PHOTOS);
        } else {
          setPhotos(list);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[ProgressPhotos] Error loading photos:', err);
        setPhotos(MOCK_PHOTOS);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Request library & camera permissions
  const requestMediaPermissions = async () => {
    const { status: libraryStatus } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    const { status: cameraStatus } = await ImagePicker.requestCameraPermissionsAsync();
    if (libraryStatus !== 'granted' || cameraStatus !== 'granted') {
      Alert.alert(
        'Permissions Needed',
        'Please allow camera and gallery permissions in your settings to upload progress photos.'
      );
      return false;
    }
    return true;
  };

  // Launch gallery selector
  const handleSelectFromLibrary = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('[ProgressPhotos] Error launching image library:', e);
    }
  };

  // Launch camera
  const handleTakePhoto = async () => {
    const hasPermission = await requestMediaPermissions();
    if (!hasPermission) return;

    try {
      const result = await ImagePicker.launchCameraAsync({
        allowsEditing: true,
        aspect: [3, 4],
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImageUri(result.assets[0].uri);
      }
    } catch (e) {
      console.warn('[ProgressPhotos] Error launching camera:', e);
    }
  };

  // Format YYYY-MM-DD input cleanly to user dates like "18 May"
  const getFormattedDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const year = parts[0];
    const monthIndex = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    if (monthIndex < 0 || monthIndex > 11 || isNaN(day)) return dateString;
    return `${day} ${months[monthIndex]}`;
  };

  // Preset default upload date to today
  const handleOpenUpload = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setUploadDate(`${yyyy}-${mm}-${dd}`);
    setSelectedImageUri(null);
    setUploadAngle('front');
    setShowCalendar(false);
    setUploadModalVisible(true);
  };

  // Upload process
  const handleUploadPhoto = async () => {
    if (!selectedImageUri) {
      Alert.alert('Error', 'Please capture or choose a photo first.');
      return;
    }
    if (!uploadDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Error', 'Please enter date in YYYY-MM-DD format.');
      return;
    }

    setUploading(true);
    try {
      let finalUrl = selectedImageUri;

      // Try uploading to Firebase Storage if online
      if (storage && user?.uid) {
        try {
          const response = await fetch(selectedImageUri);
          const blob = await response.blob();
          const filename = `${Date.now()}_${uploadAngle}.jpg`;
          const storageRef = ref(storage, `users/${user.uid}/progress_photos/${filename}`);
          
          await uploadBytes(storageRef, blob);
          finalUrl = await getDownloadURL(storageRef);
        } catch (storageErr) {
          console.warn('[ProgressPhotos] Firebase Storage upload failed, falling back to local file URI:', storageErr);
        }
      }

      // Write record to Firestore
      if (user?.uid) {
        const photoId = doc(collection(db, 'users', user.uid, 'progress_photos')).id;
        await setDoc(doc(db, 'users', user.uid, 'progress_photos', photoId), {
          id: photoId,
          url: finalUrl,
          angle: uploadAngle,
          date: uploadDate,
          createdAt: serverTimestamp(),
        });
      }

      Alert.alert('Success', 'Progress photo saved successfully!');
      setUploadModalVisible(false);
    } catch (e) {
      console.warn('[ProgressPhotos] Upload failed:', e);
      Alert.alert('Error', 'Failed to save progress photo.');
    } finally {
      setUploading(false);
    }
  };

  // Delete handler
  const handleDeletePhoto = async (photo: ProgressPhoto) => {
    if (!user?.uid) return;
    if (photo.id.startsWith('mock-')) {
      // Mock data delete simulation
      setPhotos(prev => prev.filter(p => p.id !== photo.id));
      setSelectedPhoto(null);
      setCompareMode(false);
      setComparePhoto(null);
      return;
    }

    Alert.alert(
      'Delete Photo',
      'Are you sure you want to permanently remove this progress photo?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteDoc(doc(db, 'users', user.uid, 'progress_photos', photo.id));
              setSelectedPhoto(null);
              setCompareMode(false);
              setComparePhoto(null);
            } catch (err) {
              console.warn('[ProgressPhotos] Delete failed:', err);
              Alert.alert('Error', 'Failed to delete photo.');
            }
          },
        },
      ]
    );
  };

  // Group photos by date
  const groupedPhotos: { [date: string]: { front?: ProgressPhoto; side?: ProgressPhoto; back?: ProgressPhoto } } = {};
  photos.forEach((photo) => {
    if (!groupedPhotos[photo.date]) {
      groupedPhotos[photo.date] = {};
    }
    groupedPhotos[photo.date][photo.angle] = photo;
  });

  const sortedDates = Object.keys(groupedPhotos).sort((a, b) => b.localeCompare(a));

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={styles.backButton}>
          <ChevronLeft size={20} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Photos</Text>
        <TouchableOpacity activeOpacity={0.8} onPress={handleOpenUpload} style={styles.cameraButton}>
          <Camera size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {/* Tabs Header (Columns labels) */}
      <View style={styles.columnHeader}>
        <Text style={styles.columnHeaderText}>Front</Text>
        <Text style={styles.columnHeaderText}>Side</Text>
        <Text style={styles.columnHeaderText}>Back</Text>
      </View>

      {/* Grid Timeline */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="small" color={colors.primary} />
        </View>
      ) : sortedDates.length === 0 ? (
        <View style={styles.centered}>
          <Text style={styles.emptyText}>No progress photos uploaded yet.</Text>
          <TouchableOpacity style={styles.emptyButton} onPress={handleOpenUpload}>
            <Text style={styles.emptyButtonText}>Upload First Photo</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {sortedDates.map((dateKey) => {
            const group = groupedPhotos[dateKey];
            const formattedDate = getFormattedDate(dateKey);
            return (
              <View key={dateKey} style={styles.gridRow}>
                {/* Front angle */}
                <View style={styles.gridCell}>
                  {group.front ? (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedPhoto(group.front!)} style={styles.polaroid}>
                      <Image source={{ uri: group.front.url }} style={styles.polaroidImage} />
                      <Text style={styles.polaroidDate}>{formattedDate}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.polaroidPlaceholder}>
                      <Text style={styles.placeholderLabel}>FRONT</Text>
                    </View>
                  )}
                </View>

                {/* Side angle */}
                <View style={styles.gridCell}>
                  {group.side ? (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedPhoto(group.side!)} style={styles.polaroid}>
                      <Image source={{ uri: group.side.url }} style={styles.polaroidImage} />
                      <Text style={styles.polaroidDate}>{formattedDate}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.polaroidPlaceholder}>
                      <Text style={styles.placeholderLabel}>SIDE</Text>
                    </View>
                  )}
                </View>

                {/* Back angle */}
                <View style={styles.gridCell}>
                  {group.back ? (
                    <TouchableOpacity activeOpacity={0.9} onPress={() => setSelectedPhoto(group.back!)} style={styles.polaroid}>
                      <Image source={{ uri: group.back.url }} style={styles.polaroidImage} />
                      <Text style={styles.polaroidDate}>{formattedDate}</Text>
                    </TouchableOpacity>
                  ) : (
                    <View style={styles.polaroidPlaceholder}>
                      <Text style={styles.placeholderLabel}>BACK</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </ScrollView>
      )}

      {/* ─── UPLOAD MODAL ────────────────────────────────────── */}
      <Modal animationType="slide" transparent visible={uploadModalVisible} onRequestClose={() => setUploadModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.uploadCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Upload Progress Photo</Text>
              <TouchableOpacity onPress={() => setUploadModalVisible(false)}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
              {/* Date Selection Trigger */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>DATE</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.inputWrapper}
                  onPress={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <Text style={styles.dateSelectorText}>{getFormattedDate(uploadDate) || 'Choose Date'}</Text>
                  <ChevronDown size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>

              {/* Custom Inline Calendar */}
              {showCalendar && (
                <GlassCard style={styles.calendarContainer}>
                  {/* Month header navigation */}
                  <View style={styles.calendarMonthHeader}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                      <ChevronLeft size={16} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.calendarMonthText}>{calendarMonthLabel()}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                      <ChevronRight size={16} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* Days header list */}
                  <View style={styles.calendarWeekRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
                      <Text key={i} style={styles.calendarWeekText}>{w}</Text>
                    ))}
                  </View>

                  {/* Days calendar cells grid */}
                  <View style={styles.calendarGrid}>
                    {getCalendarDays().map((day, idx) => {
                      if (day === null) {
                        return <View key={idx} style={styles.calendarDayCell} />;
                      }
                      
                      const checkDateStr = `${currentCalendarMonth.getFullYear()}-${String(currentCalendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = checkDateStr === uploadDate;

                      return (
                        <TouchableOpacity
                          key={idx}
                          activeOpacity={0.8}
                          style={[
                            styles.calendarDayCell,
                            styles.calendarDayBtn,
                            isSelected && styles.calendarDayBtnActive,
                          ]}
                          onPress={() => handleSelectDay(day)}
                        >
                          <Text style={[styles.calendarDayText, isSelected && styles.calendarDayTextActive]}>
                            {day}
                          </Text>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </GlassCard>
              )}

              {/* Angle selector */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SELECT ANGLE</Text>
                <View style={styles.angleRow}>
                  {(['front', 'side', 'back'] as const).map((ang) => (
                    <TouchableOpacity
                      key={ang}
                      style={[styles.angleBtn, uploadAngle === ang && styles.angleBtnActive]}
                      onPress={() => setUploadAngle(ang)}
                    >
                      <Text style={[styles.angleBtnText, uploadAngle === ang && styles.angleBtnTextActive]}>
                        {ang.toUpperCase()}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Image Preview / Picker */}
              <View style={styles.imagePickerSection}>
                {selectedImageUri ? (
                  <View style={styles.pickerPreviewWrapper}>
                    <Image source={{ uri: selectedImageUri }} style={styles.pickerPreview} />
                    <TouchableOpacity style={styles.pickerRemove} onPress={() => setSelectedImageUri(null)}>
                      <X size={14} color="#FFF" />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={styles.pickerPlaceholder}>
                    <ImageIcon size={32} color={colors.textMuted} />
                    <Text style={styles.pickerLabel}>Choose an image to upload</Text>
                  </View>
                )}

                <View style={styles.pickerActionsRow}>
                  <TouchableOpacity style={styles.pickerSourceBtn} onPress={handleTakePhoto}>
                    <Camera size={14} color={colors.primary} />
                    <Text style={styles.pickerSourceText}>Take Photo</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.pickerSourceBtn} onPress={handleSelectFromLibrary}>
                    <ImageIcon size={14} color={colors.primary} />
                    <Text style={styles.pickerSourceText}>Gallery</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Action Buttons */}
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.uploadSubmitBtn, (!selectedImageUri || uploading) && { opacity: 0.6 }]}
                disabled={!selectedImageUri || uploading}
                onPress={handleUploadPhoto}
              >
                {uploading ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.uploadSubmitBtnText}>Upload Photo</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </GlassCard>
        </View>
      </Modal>

      {/* ─── DETAILS & COMPARISON MODAL ───────────────────────── */}
      <Modal animationType="fade" transparent visible={selectedPhoto !== null} onRequestClose={() => { setSelectedPhoto(null); setCompareMode(false); setComparePhoto(null); }}>
        <View style={styles.modalBackdrop}>
          {selectedPhoto && (
            <GlassCard style={styles.detailsCard}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>
                  {compareMode ? 'Side-by-Side Comparison' : `Photo Details — ${selectedPhoto.angle.toUpperCase()}`}
                </Text>
                <TouchableOpacity onPress={() => { setSelectedPhoto(null); setCompareMode(false); setComparePhoto(null); }}>
                  <X size={20} color={colors.textPrimary} />
                </TouchableOpacity>
              </View>

              {!compareMode ? (
                // standard details view
                <View style={{ flex: 1, gap: 16, alignItems: 'center' }}>
                  <Image source={{ uri: selectedPhoto.url }} style={styles.detailImage} />
                  
                  <View style={styles.detailMetaRow}>
                    <View>
                      <Text style={styles.detailDate}>{getFormattedDate(selectedPhoto.date)}</Text>
                      <Text style={styles.detailLabel}>{selectedPhoto.angle.toUpperCase()} VIEW</Text>
                    </View>
                    <TouchableOpacity style={styles.deletePhotoBtn} onPress={() => handleDeletePhoto(selectedPhoto)}>
                      <Trash2 size={16} color={colors.error} />
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity style={styles.compareBtn} onPress={() => setCompareMode(true)}>
                    <Text style={styles.compareBtnText}>Compare with another photo</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                // comparison view
                <View style={{ flex: 1, gap: 16 }}>
                  {!comparePhoto ? (
                    // selector mode: choose other dates
                    <View style={{ flex: 1 }}>
                      <Text style={styles.compareSelectLabel}>Choose photo to compare with:</Text>
                      <ScrollView contentContainerStyle={{ gap: 8 }} showsVerticalScrollIndicator={false}>
                        {photos
                          .filter((p) => p.angle === selectedPhoto.angle && p.id !== selectedPhoto.id)
                          .map((p) => (
                            <TouchableOpacity key={p.id} style={styles.compareListItem} onPress={() => setComparePhoto(p)}>
                              <Image source={{ uri: p.url }} style={styles.compareListThumb} />
                              <Text style={styles.compareListText}>{getFormattedDate(p.date)}</Text>
                            </TouchableOpacity>
                          ))}
                        {photos.filter((p) => p.angle === selectedPhoto.angle && p.id !== selectedPhoto.id).length === 0 && (
                          <Text style={styles.compareEmptyText}>No other {selectedPhoto.angle} view photos to compare.</Text>
                        )}
                      </ScrollView>
                      <TouchableOpacity style={[styles.compareBtn, { marginTop: 12 }]} onPress={() => setCompareMode(false)}>
                        <Text style={styles.compareBtnText}>Back</Text>
                      </TouchableOpacity>
                    </View>
                  ) : (
                    // render side-by-side comparison
                    <View style={{ flex: 1, gap: 16, alignItems: 'center' }}>
                      {/* Determine Before & After order based on dates */}
                      {(() => {
                        const isSelectedEarlier = selectedPhoto.date.localeCompare(comparePhoto.date) < 0;
                        const before = isSelectedEarlier ? selectedPhoto : comparePhoto;
                        const after = isSelectedEarlier ? comparePhoto : selectedPhoto;

                        return (
                          <View style={styles.comparisonGrid}>
                            {/* Before Panel */}
                            <View style={styles.comparisonCol}>
                              <Text style={styles.compareBadgeText}>BEFORE ({getFormattedDate(before.date)})</Text>
                              <Image source={{ uri: before.url }} style={styles.compareColImage} />
                            </View>

                            {/* After Panel */}
                            <View style={styles.comparisonCol}>
                              <Text style={[styles.compareBadgeText, { color: colors.primary }]}>AFTER ({getFormattedDate(after.date)})</Text>
                              <Image source={{ uri: after.url }} style={styles.compareColImage} />
                            </View>
                          </View>
                        );
                      })()}

                      <View style={{ flexDirection: 'row', gap: 12, width: '100%' }}>
                        <TouchableOpacity style={[styles.compareBtn, { flex: 1 }]} onPress={() => setComparePhoto(null)}>
                          <Text style={styles.compareBtnText}>Select Different Photo</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.compareBtn, { flex: 1, backgroundColor: 'rgba(255,255,255,0.06)' }]} onPress={() => setCompareMode(false)}>
                          <Text style={styles.compareBtnText}>Exit Comparison</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  )}
                </View>
              )}
            </GlassCard>
          )}
        </View>
      </Modal>
    </SafeAreaView>
  );
}

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
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  cameraButton: {
    padding: 4,
  },
  columnHeader: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    backgroundColor: isDark ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)',
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  columnHeaderText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  scrollContent: {
    padding: 12,
    gap: 12,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
  },
  gridCell: {
    flex: 1,
    aspectRatio: 0.75,
  },
  polaroid: {
    flex: 1,
    backgroundColor: '#FFFFFF', // standard white borders for polaroids (matches visual reference)
    padding: 6,
    paddingBottom: 10,
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
    alignItems: 'center',
    gap: 6,
  },
  polaroidImage: {
    flex: 1,
    width: '100%',
    borderRadius: 2,
    backgroundColor: '#EAEAEA',
  },
  polaroidDate: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#0258B3', // premium blue tint for date labels on stubs
  },
  polaroidPlaceholder: {
    flex: 1,
    backgroundColor: isDark ? 'rgba(255,255,255,0.03)' : 'rgba(0,0,0,0.03)',
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 4,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.textMuted,
    opacity: 0.5,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    padding: 40,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    textAlign: 'center',
  },
  emptyButton: {
    height: 40,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    color: colors.textAccent,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Modals Core
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
    marginBottom: 16,
    width: '100%',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },

  // Upload Styles
  uploadCard: {
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    borderRadius: 16,
  },
  formGroup: {
    gap: 6,
  },
  formLabel: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceCard,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 48,
  },
  textInput: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 14,
  },
  angleRow: {
    flexDirection: 'row',
    gap: 10,
  },
  angleBtn: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: colors.surfaceCard,
    justifyContent: 'center',
    alignItems: 'center',
  },
  angleBtnActive: {
    borderColor: colors.primary,
    backgroundColor: isDark ? 'rgba(204,255,0,0.1)' : 'rgba(118,158,0,0.1)',
  },
  angleBtnText: {
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  angleBtnTextActive: {
    color: colors.primary,
  },
  imagePickerSection: {
    gap: 12,
    alignItems: 'center',
  },
  pickerPlaceholder: {
    height: 160,
    width: '100%',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: colors.borderGlass,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.surfaceCard,
  },
  pickerLabel: {
    fontSize: 12,
    color: colors.textMuted,
  },
  pickerPreviewWrapper: {
    height: 160,
    aspectRatio: 0.75,
    borderRadius: 8,
    overflow: 'hidden',
    position: 'relative',
  },
  pickerPreview: {
    width: '100%',
    height: '100%',
  },
  pickerRemove: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(0,0,0,0.6)',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerActionsRow: {
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'center',
    width: '100%',
  },
  pickerSourceBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 38,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: colors.surfaceCard,
  },
  pickerSourceText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  uploadSubmitBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  uploadSubmitBtnText: {
    color: colors.textAccent,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Details Modal
  detailsCard: {
    width: '100%',
    height: '85%',
    padding: 20,
    borderRadius: 16,
  },
  detailImage: {
    flex: 1,
    width: '100%',
    borderRadius: 8,
    backgroundColor: '#EAEAEA',
  },
  detailMetaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 4,
  },
  detailDate: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  detailLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: colors.primary,
    letterSpacing: 1.2,
    marginTop: 2,
  },
  deletePhotoBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(239, 68, 68, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareBtn: {
    height: 46,
    width: '100%',
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  compareBtnText: {
    color: colors.textAccent,
    fontSize: 13,
    fontWeight: 'bold',
  },

  // Comparison Selector Lists
  compareSelectLabel: {
    fontSize: 13,
    color: colors.textSecondary,
    marginBottom: 12,
    fontWeight: '600',
  },
  compareListItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.borderGlass,
    backgroundColor: colors.surfaceCard,
    gap: 12,
  },
  compareListThumb: {
    width: 40,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#EAEAEA',
  },
  compareListText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  compareEmptyText: {
    textAlign: 'center',
    color: colors.textMuted,
    fontSize: 12,
    marginTop: 32,
  },

  // Comparison Grid
  comparisonGrid: {
    flex: 1,
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  comparisonCol: {
    flex: 1,
    gap: 8,
    alignItems: 'center',
  },
  compareBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 1,
  },
  compareColImage: {
    flex: 1,
    width: '100%',
    borderRadius: 6,
    backgroundColor: '#EAEAEA',
  },
  // Calendar specific styles
  dateSelectorText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  calendarContainer: {
    backgroundColor: 'rgba(255,255,255,0.02)',
    padding: 12,
    borderRadius: 10,
    gap: 10,
  },
  calendarMonthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  calendarNavBtn: {
    padding: 6,
  },
  calendarMonthText: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  calendarWeekRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarWeekText: {
    width: (width - 100) / 7,
    textAlign: 'center',
    fontSize: 11,
    fontWeight: 'bold',
    color: colors.textMuted,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDayCell: {
    width: (width - 92) / 7,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayBtn: {
    borderRadius: 18,
  },
  calendarDayBtnActive: {
    backgroundColor: colors.primary,
  },
  calendarDayText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  calendarDayTextActive: {
    color: colors.textAccent,
  },
});
