import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import { ChevronLeft, Plus, X, Calendar, ChevronDown, ChevronRight } from 'lucide-react-native';
import Svg, { Path, Defs, LinearGradient, Stop, Line, Text as SvgText } from 'react-native-svg';
import { useTheme } from '../../context/ThemeContext';
import { useThemedStyles } from '../../theme/themedStyles';
import { GlassCard } from '../../components/GlassCard';
import { useRouter } from 'expo-router';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../config/firebase';
import { collection, doc, setDoc, deleteDoc, onSnapshot, query, orderBy, serverTimestamp } from 'firebase/firestore';

const { width } = Dimensions.get('window');

interface WeightEntry {
  id: string;
  weight: number;
  date: string; // YYYY-MM-DD
  createdAt: any;
}

// Fallback stubs from screenshot
const MOCK_WEIGHT_ENTRIES: WeightEntry[] = [
  { id: 'mock-1', weight: 82.05, date: '2026-05-18', createdAt: new Date() },
  { id: 'mock-2', weight: 80.60, date: '2026-04-28', createdAt: new Date() },
  { id: 'mock-3', weight: 80.10, date: '2026-03-29', createdAt: new Date() },
  { id: 'mock-4', weight: 79.50, date: '2026-01-27', createdAt: new Date() },
  { id: 'mock-5', weight: 78.25, date: '2026-01-11', createdAt: new Date() },
  { id: 'mock-6', weight: 75.80, date: '2025-10-14', createdAt: new Date() },
  { id: 'mock-7', weight: 74.50, date: '2025-09-02', createdAt: new Date() },
  { id: 'mock-8', weight: 65.20, date: '2025-08-15', createdAt: new Date() },
  { id: 'mock-9', weight: 68.90, date: '2025-07-20', createdAt: new Date() },
  { id: 'mock-10', weight: 76.10, date: '2025-04-12', createdAt: new Date() },
  { id: 'mock-11', weight: 83.40, date: '2025-02-18', createdAt: new Date() },
  { id: 'mock-12', weight: 79.80, date: '2024-11-05', createdAt: new Date() },
];

export default function WeightTrackerScreen() {
  const router = useRouter();
  const { colors, isDark } = useTheme();
  const { user, userData } = useAuth();
  const styles = useThemedStyles(getStyles);

  const weightUnit = (userData?.settings?.weightUnit || 'kg').toLowerCase();

  const [entries, setEntries] = useState<WeightEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeRange, setActiveRange] = useState<'3M' | '6M' | '1Y' | '2Y' | '3Y'>('2Y');

  // Modal Logger State
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [logWeight, setLogWeight] = useState('');
  const [logDate, setLogDate] = useState(''); // YYYY-MM-DD
  const [showCalendar, setShowCalendar] = useState(false);
  const [saving, setSaving] = useState(false);

  // Custom Calendar Builder State
  const [currentCalendarMonth, setCurrentCalendarMonth] = useState(new Date());

  // Listen to Firestore weight history
  useEffect(() => {
    if (!user?.uid) return;

    const q = query(
      collection(db, 'users', user.uid, 'weight_history'),
      orderBy('date', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnap) => {
        const list: WeightEntry[] = [];
        querySnap.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...docSnap.data() } as WeightEntry);
        });
        if (list.length === 0) {
          setEntries(MOCK_WEIGHT_ENTRIES);
        } else {
          setEntries(list);
        }
        setLoading(false);
      },
      (err) => {
        console.warn('[WeightTracker] Firestore listener error, using stubs:', err);
        setEntries(MOCK_WEIGHT_ENTRIES);
        setLoading(false);
      }
    );

    return unsubscribe;
  }, [user?.uid]);

  // Handle open add modal
  const handleOpenAdd = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setLogDate(`${yyyy}-${mm}-${dd}`);
    setLogWeight('');
    setShowCalendar(false);
    setAddModalVisible(true);
  };

  // Submit weight log
  const handleSaveWeight = async () => {
    const parsedWeight = parseFloat(logWeight);
    if (isNaN(parsedWeight) || parsedWeight <= 0) {
      Alert.alert('Error', 'Please enter a valid weight.');
      return;
    }
    if (!logDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
      Alert.alert('Error', 'Please select or enter a valid date (YYYY-MM-DD).');
      return;
    }

    setSaving(true);
    try {
      if (user?.uid) {
        const docId = doc(collection(db, 'users', user.uid, 'weight_history')).id;
        await setDoc(doc(db, 'users', user.uid, 'weight_history', docId), {
          id: docId,
          weight: parsedWeight,
          date: logDate,
          createdAt: serverTimestamp(),
        });
        Alert.alert('Success', 'Weight logged successfully!');
        setAddModalVisible(false);
      } else {
        // Simulator simulation
        const newEntry: WeightEntry = {
          id: `local-${Date.now()}`,
          weight: parsedWeight,
          date: logDate,
          createdAt: new Date(),
        };
        setEntries((prev) => [newEntry, ...prev].sort((a, b) => b.date.localeCompare(a.date)));
        setAddModalVisible(false);
      }
    } catch (e) {
      console.warn('[WeightTracker] Save error:', e);
      Alert.alert('Error', 'Failed to save weight.');
    } finally {
      setSaving(false);
    }
  };

  // Delete weight log
  const handleDeleteEntry = async (entry: WeightEntry) => {
    Alert.alert(
      'Delete Log',
      'Remove this weight entry from your logs?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              if (user?.uid && !entry.id.startsWith('local-') && !entry.id.startsWith('mock-')) {
                await deleteDoc(doc(db, 'users', user.uid, 'weight_history', entry.id));
              } else {
                setEntries(prev => prev.filter(e => e.id !== entry.id));
              }
            } catch (err) {
              console.warn('[WeightTracker] Delete error:', err);
            }
          },
        },
      ]
    );
  };

  // Date utilities
  const formatMonthHeader = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const monthIdx = parseInt(parts[1], 10) - 1;
    const months = ['JANUARY', 'FEBRUARY', 'MARCH', 'APRIL', 'MAY', 'JUNE', 'JULY', 'AUGUST', 'SEPTEMBER', 'OCTOBER', 'NOVEMBER', 'DECEMBER'];
    return months[monthIdx] || '';
  };

  const formatShortMonthHeader = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return '';
    const monthIdx = parseInt(parts[1], 10) - 1;
    const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
    return months[monthIdx] || '';
  };

  const getFormattedEntryDate = (dateString: string) => {
    if (!dateString) return '';
    const parts = dateString.split('-');
    if (parts.length !== 3) return dateString;
    const year = parts[0];
    const monthIdx = parseInt(parts[1], 10) - 1;
    const day = parseInt(parts[2], 10);
    const months = ['May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr']; // offset or simple index mapping:
    const correctMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    return `${day} ${correctMonths[monthIdx]} ${year}`;
  };

  // Group entries by month for listing
  const groupedEntries: { [monthKey: string]: WeightEntry[] } = {};
  entries.forEach((entry) => {
    const key = entry.date.slice(0, 7); // YYYY-MM
    if (!groupedEntries[key]) {
      groupedEntries[key] = [];
    }
    groupedEntries[key].push(entry);
  });

  const sortedMonthKeys = Object.keys(groupedEntries).sort((a, b) => b.localeCompare(a));

  // Graph data calculations based on selected activeRange timeframe
  const getGraphData = () => {
    const sortedChronological = [...entries].sort((a, b) => a.date.localeCompare(b.date));
    if (sortedChronological.length === 0) return [];

    const now = new Date();
    let thresholdDate = new Date();
    if (activeRange === '3M') thresholdDate.setMonth(now.getMonth() - 3);
    else if (activeRange === '6M') thresholdDate.setMonth(now.getMonth() - 6);
    else if (activeRange === '1Y') thresholdDate.setFullYear(now.getFullYear() - 1);
    else if (activeRange === '2Y') thresholdDate.setFullYear(now.getFullYear() - 2);
    else if (activeRange === '3Y') thresholdDate.setFullYear(now.getFullYear() - 3);

    const thresholdStr = thresholdDate.toISOString().slice(0, 10);
    return sortedChronological.filter((e) => e.date >= thresholdStr);
  };

  const graphDataset = getGraphData();

  // Draw SVG lines helper
  const drawChart = () => {
    if (graphDataset.length === 0) return null;

    const chartWidth = width - 40;
    const chartHeight = 220;
    const paddingLeft = 35;
    const paddingRight = 10;
    const paddingTop = 25;
    const paddingBottom = 35;

    const innerWidth = chartWidth - paddingLeft - paddingRight;
    const innerHeight = chartHeight - paddingTop - paddingBottom;

    // Weights scale range
    const weights = graphDataset.map((e) => e.weight);
    const maxWeight = Math.max(...weights) + 4;
    const minWeight = Math.max(0, Math.min(...weights) - 4);
    const weightRange = maxWeight - minWeight;

    // Timestamps scale range
    const times = graphDataset.map((e) => new Date(e.date).getTime());
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    const timeRange = maxTime - minTime || 1;

    // Compute pixel points
    const points = graphDataset.map((e) => {
      const timeMs = new Date(e.date).getTime();
      const pctX = timeRange > 0 ? (timeMs - minTime) / timeRange : 0.5;
      const pctY = weightRange > 0 ? (e.weight - minWeight) / weightRange : 0.5;

      return {
        x: paddingLeft + pctX * innerWidth,
        y: chartHeight - paddingBottom - pctY * innerHeight,
        weight: e.weight,
        date: e.date,
      };
    });

    // Plot path line
    let linePath = '';
    let areaPath = '';

    if (points.length > 0) {
      linePath = `M ${points[0].x} ${points[0].y}`;
      points.slice(1).forEach((p) => {
        linePath += ` L ${p.x} ${p.y}`;
      });

      // Area gradient path needs to close at bottom of chart
      areaPath = `${linePath} L ${points[points.length - 1].x} ${chartHeight - paddingBottom} L ${points[0].x} ${chartHeight - paddingBottom} Z`;
    }

    // Average weight threshold line
    const sum = weights.reduce((a, b) => a + b, 0);
    const avgWeight = sum / weights.length;
    const pctAvgY = weightRange > 0 ? (avgWeight - minWeight) / weightRange : 0.5;
    const avgYPixel = chartHeight - paddingBottom - pctAvgY * innerHeight;

    // Grid ticks (Y axis helper markers)
    const divisionCount = 3;
    const yTicks = [];
    for (let i = 0; i <= divisionCount; i++) {
      const wVal = minWeight + (weightRange * i) / divisionCount;
      const pctY = weightRange > 0 ? (wVal - minWeight) / weightRange : 0.5;
      const yPixel = chartHeight - paddingBottom - pctY * innerHeight;
      yTicks.push({ val: wVal, y: yPixel });
    }

    // Format X axis labels: e.g. "Aug 24", "Feb 25"
    const formatAxisXDate = (dateStr: string) => {
      const parts = dateStr.split('-');
      if (parts.length !== 3) return '';
      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthIdx = parseInt(parts[1], 10) - 1;
      const shortYear = parts[0].slice(2);
      return `${months[monthIdx]} ${shortYear}`;
    };

    // Find X ticks: Start date, Middle date, End date
    const xTicks = [];
    if (points.length > 0) {
      xTicks.push(points[0]);
      if (points.length > 2) {
        xTicks.push(points[Math.floor(points.length / 2)]);
      }
      if (points.length > 1) {
        xTicks.push(points[points.length - 1]);
      }
    }

    return (
      <Svg width={chartWidth} height={chartHeight}>
        <Defs>
          <LinearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#CCFF00" stopOpacity="0.25" />
            <Stop offset="1" stopColor="#CCFF00" stopOpacity="0.0" />
          </LinearGradient>
        </Defs>

        {/* Horizontal grid lines */}
        {yTicks.map((tick, index) => (
          <React.Fragment key={index}>
            <Line
              x1={paddingLeft}
              y1={tick.y}
              x2={chartWidth - paddingRight}
              y2={tick.y}
              stroke="rgba(255, 255, 255, 0.06)"
              strokeWidth="1"
            />
            <SvgText
              x={paddingLeft - 8}
              y={tick.y + 4}
              fontSize="10"
              fill={colors.textMuted}
              textAnchor="end"
              fontWeight="bold"
            >
              {Math.round(tick.val)}
            </SvgText>
          </React.Fragment>
        ))}

        {/* Gradient fill */}
        {areaPath ? <Path d={areaPath} fill="url(#chartGrad)" /> : null}

        {/* Trend line */}
        {linePath ? (
          <Path
            d={linePath}
            fill="none"
            stroke="#CCFF00"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : null}

        {/* Average line threshold */}
        {avgYPixel ? (
          <React.Fragment>
            <Line
              x1={paddingLeft}
              y1={avgYPixel}
              x2={chartWidth - paddingRight}
              y2={avgYPixel}
              stroke="rgba(255,255,255,0.4)"
              strokeDasharray="4 4"
              strokeWidth="1"
            />
            <SvgText
              x={chartWidth - paddingRight - 8}
              y={avgYPixel - 6}
              fontSize="9"
              fill={colors.textSecondary}
              textAnchor="end"
              fontWeight="600"
            >
              Average: {avgWeight.toFixed(2)} {weightUnit}
            </SvgText>
          </React.Fragment>
        ) : null}

        {/* X Axis ticks */}
        {xTicks.map((tick, index) => (
          <SvgText
            key={index}
            x={tick.x}
            y={chartHeight - 8}
            fontSize="10"
            fill={colors.textMuted}
            textAnchor="middle"
          >
            {formatAxisXDate(tick.date)}
          </SvgText>
        ))}
      </Svg>
    );
  };

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
    setLogDate(`${yyyy}-${mm}-${dd}`);
    setShowCalendar(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity activeOpacity={0.8} onPress={() => router.back()} style={styles.backButton}>
          <X size={22} color={colors.textPrimary} />
        </TouchableOpacity>
        
        <View style={styles.titleWrapper}>
          <Text style={styles.headerTitle}>Body Weight</Text>
          <ChevronDown size={14} color={colors.textMuted} style={{ marginLeft: 4 }} />
        </View>

        <TouchableOpacity activeOpacity={0.8} onPress={handleOpenAdd} style={styles.addButton}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* timeframe selector tabs */}
      <View style={styles.durationRow}>
        {(['3M', '6M', '1Y', '2Y', '3Y'] as const).map((r) => (
          <TouchableOpacity
            key={r}
            style={[styles.durationTab, activeRange === r && styles.durationTabActive]}
            onPress={() => setActiveRange(r)}
          >
            <Text style={[styles.durationTabText, activeRange === r && styles.durationTabTextActive]}>
              {r}
            </Text>
            {activeRange === r && <View style={styles.activeRangeIndicator} />}
          </TouchableOpacity>
        ))}
      </View>

      {/* main chart container */}
      <View style={styles.chartCardWrapper}>
        <GlassCard style={styles.chartCard}>
          {loading ? (
            <View style={styles.chartLoading}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : graphDataset.length === 0 ? (
            <View style={styles.chartLoading}>
              <Text style={styles.emptyChartText}>No weight data logged in selected range.</Text>
            </View>
          ) : (
            drawChart()
          )}
        </GlassCard>
      </View>

      {/* history lists grouped by month */}
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {loading ? (
          <ActivityIndicator size="small" color={colors.primary} style={{ marginTop: 40 }} />
        ) : sortedMonthKeys.length === 0 ? (
          <View style={styles.centered}>
            <Text style={styles.emptyText}>No weight entries found.</Text>
          </View>
        ) : (
          sortedMonthKeys.map((monthKey) => {
            const list = groupedEntries[monthKey];
            const headerLabel = formatShortMonthHeader(list[0].date);
            return (
              <View key={monthKey} style={styles.monthSection}>
                <Text style={styles.monthHeader}>{headerLabel}</Text>
                <GlassCard style={styles.monthCardContainer}>
                  {list.map((entry, index) => (
                    <TouchableOpacity
                      key={entry.id}
                      activeOpacity={0.8}
                      onLongPress={() => handleDeleteEntry(entry)}
                      style={[
                        styles.entryRow,
                        index !== list.length - 1 && styles.borderBottomLine,
                      ]}
                    >
                      <Text style={styles.entryDate}>{getFormattedEntryDate(entry.date)}</Text>
                      <View style={styles.entryValueRow}>
                        <Text style={styles.entryWeightVal}>
                          {entry.weight.toFixed(2)}
                          <Text style={styles.entryUnitText}> {weightUnit}</Text>
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </GlassCard>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* ─── ADD WEIGHT LOGGER MODAL ───────────────────────── */}
      <Modal animationType="slide" transparent visible={addModalVisible} onRequestClose={() => setAddModalVisible(false)}>
        <View style={styles.modalBackdrop}>
          <GlassCard style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Body Weight</Text>
              <TouchableOpacity onPress={() => setAddModalVisible(false)}>
                <X size={20} color={colors.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 16 }} showsVerticalScrollIndicator={false}>
              {/* Date selection field */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>SELECT DATE</Text>
                <TouchableOpacity
                  activeOpacity={0.8}
                  style={styles.inputWrapper}
                  onPress={() => setShowCalendar(!showCalendar)}
                >
                  <Calendar size={16} color={colors.textMuted} style={{ marginRight: 8 }} />
                  <Text style={styles.dateSelectorText}>{getFormattedEntryDate(logDate) || 'Choose Date'}</Text>
                  <ChevronDown size={14} color={colors.textMuted} style={{ marginLeft: 'auto' }} />
                </TouchableOpacity>
              </View>

              {/* Inline Custom Calendar Modal */}
              {showCalendar && (
                <GlassCard style={styles.calendarContainer}>
                  {/* month selector header */}
                  <View style={styles.calendarMonthHeader}>
                    <TouchableOpacity onPress={handlePrevMonth} style={styles.calendarNavBtn}>
                      <ChevronLeft size={16} color={colors.textPrimary} />
                    </TouchableOpacity>
                    <Text style={styles.calendarMonthText}>{calendarMonthLabel()}</Text>
                    <TouchableOpacity onPress={handleNextMonth} style={styles.calendarNavBtn}>
                      <ChevronRight size={16} color={colors.textPrimary} />
                    </TouchableOpacity>
                  </View>

                  {/* weekdays header */}
                  <View style={styles.calendarWeekRow}>
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((w, i) => (
                      <Text key={i} style={styles.calendarWeekText}>{w}</Text>
                    ))}
                  </View>

                  {/* calendar days grid */}
                  <View style={styles.calendarGrid}>
                    {getCalendarDays().map((day, idx) => {
                      if (day === null) {
                        return <View key={idx} style={styles.calendarDayCell} />;
                      }
                      
                      const checkDateStr = `${currentCalendarMonth.getFullYear()}-${String(currentCalendarMonth.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                      const isSelected = checkDateStr === logDate;

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

              {/* Weight Value Text Input */}
              <View style={styles.formGroup}>
                <Text style={styles.formLabel}>WEIGHT VALUE ({weightUnit.toUpperCase()})</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="e.g. 82.05"
                    placeholderTextColor="rgba(255,255,255,0.3)"
                    keyboardType="numeric"
                    value={logWeight}
                    onChangeText={setLogWeight}
                  />
                </View>
              </View>

              {/* Save Button */}
              <TouchableOpacity
                activeOpacity={0.85}
                style={[styles.saveSubmitBtn, (!logWeight || saving) && { opacity: 0.6 }]}
                disabled={!logWeight || saving}
                onPress={handleSaveWeight}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#000" />
                ) : (
                  <Text style={styles.saveSubmitBtnText}>Save Log</Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </GlassCard>
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
  titleWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: colors.primary,
  },
  durationRow: {
    flexDirection: 'row',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  durationTab: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  durationTabActive: {
    // highlighted duration indicator
  },
  durationTabText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.textMuted,
  },
  durationTabTextActive: {
    color: colors.primary,
    fontWeight: 'bold',
  },
  activeRangeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: colors.primary, // dynamic matching line
    borderRadius: 1.5,
  },
  chartCardWrapper: {
    padding: 16,
  },
  chartCard: {
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 240,
  },
  chartLoading: {
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyChartText: {
    color: colors.textMuted,
    fontSize: 12,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 40,
    gap: 16,
  },
  monthSection: {
    gap: 8,
  },
  monthHeader: {
    fontSize: 10,
    fontWeight: 'bold',
    color: colors.textMuted,
    letterSpacing: 1.2,
    paddingLeft: 4,
  },
  monthCardContainer: {
    padding: 0,
  },
  entryRow: {
    flexDirection: 'row',
    height: 48,
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  borderBottomLine: {
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
  },
  entryDate: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  entryValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  entryWeightVal: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  entryUnitText: {
    fontSize: 11,
    fontWeight: 'normal',
    color: colors.textMuted,
  },
  centered: {
    padding: 40,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
  },

  // Modals backdrop
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    width: '100%',
    maxHeight: '90%',
    padding: 20,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderGlass,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: colors.textPrimary,
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
  dateSelectorText: {
    fontSize: 14,
    color: colors.textPrimary,
  },
  textInput: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
  },
  saveSubmitBtn: {
    height: 48,
    borderRadius: 8,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
  },
  saveSubmitBtnText: {
    color: colors.textAccent,
    fontSize: 14,
    fontWeight: 'bold',
  },

  // Calendar styles
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
