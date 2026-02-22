import React, { useEffect, useState, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  ActivityIndicator, Dimensions, Alert,
} from 'react-native';
import { useApp, CROP_ICONS } from '@/context/AppContext';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { API } from '@/constants/api';

const { width } = Dimensions.get('window');

// Mock nursery data (fallback if backend is not running)
const MOCK_NURSERIES = [
  { id: 'nur001', name: 'GreenGrow Nursery', lat: 18.5412, lng: 73.8721, distance_km: 2.1, available_plants: 1600, contact: '+91-9876543210' },
  { id: 'nur002', name: 'Sahyadri Plant House', lat: 18.492, lng: 73.81, distance_km: 5.4, available_plants: 2200, contact: '+91-9123456780' },
  { id: 'nur003', name: 'Deccan Agri Nursery', lat: 18.57, lng: 73.92, distance_km: 8.2, available_plants: 1250, contact: '+91-9988776655' },
  { id: 'nur004', name: 'Krishak Vatika', lat: 18.45, lng: 73.85, distance_km: 12.6, available_plants: 2150, contact: '+91-9112233445' },
];

type Nursery = {
  id: string;
  name: string;
  lat: number;
  lng: number;
  distance_km: number;
  available_plants: number;
  contact: string;
};

type CropId = keyof typeof CROP_ICONS;

const CROP_LIST: { id: string; name: string }[] = [
  { id: 'mango', name: 'Mango' },
  { id: 'banana', name: 'Banana' },
  { id: 'coconut', name: 'Coconut' },
  { id: 'guava', name: 'Guava' },
  { id: 'papaya', name: 'Papaya' },
  { id: 'pomegranate', name: 'Pomegranate' },
  { id: 'orange', name: 'Orange' },
  { id: 'teak', name: 'Teak' },
  { id: 'neem', name: 'Neem' },
  { id: 'cashew', name: 'Cashew' },
];

export default function HomeScreen() {
  const { t, userLocation, setUserLocation } = useApp();
  const [nurseries, setNurseries] = useState<Nursery[]>(MOCK_NURSERIES);
  const [selectedNursery, setSelectedNursery] = useState<Nursery | null>(null);
  const [selectedCropFilter, setSelectedCropFilter] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Default to Pune, Maharashtra
    setUserLocation({ lat: 18.5204, lng: 73.8567 });
    fetchNurseries(18.5204, 73.8567);
  }, []);

  async function fetchNurseries(lat: number, lng: number, crop?: string) {
    setLoading(true);
    try {
      const url = API.nurseries(lat, lng, 300, crop);
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setNurseries(data.nurseries || MOCK_NURSERIES);
      } else {
        setNurseries(MOCK_NURSERIES);
      }
    } catch {
      setNurseries(MOCK_NURSERIES);
    } finally {
      setLoading(false);
    }
  }

  const handleCropFilter = (cropId: string | null) => {
    setSelectedCropFilter(cropId);
    const { lat, lng } = userLocation || { lat: 18.5204, lng: 73.8567 };
    fetchNurseries(lat, lng, cropId || undefined);
  };

  return (
    <View style={styles.container}>
      {/* Map Placeholder – shows nursery positions as a visual grid */}
      <View style={styles.mapArea}>
        <Text style={styles.mapTitle}>🗺️ Maharashtra Farm Map</Text>
        <View style={styles.mapGrid}>
          {nurseries.map((n, i) => (
            <TouchableOpacity
              key={n.id}
              style={[styles.mapPin, selectedNursery?.id === n.id && styles.mapPinActive]}
              onPress={() => setSelectedNursery(selectedNursery?.id === n.id ? null : n)}
            >
              <Text style={styles.mapPinEmoji}>
                {selectedCropFilter ? CROP_ICONS[selectedCropFilter as CropId] ?? '🌿' : '🏡'}
              </Text>
              <Text style={styles.mapPinName} numberOfLines={1}>{n.name.split(' ')[0]}</Text>
              <Text style={styles.mapPinDist}>{n.distance_km} km</Text>
            </TouchableOpacity>
          ))}
          {/* User Location Marker */}
          <View style={styles.userMarker}>
            <Text style={{ fontSize: 28 }}>📍</Text>
            <Text style={styles.userLabel}>{t('yourLocation')}</Text>
          </View>
        </View>
        <Text style={styles.mapNote}>{t('mapNote')}</Text>
      </View>

      {/* Crop Filter Chips */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipBar} contentContainerStyle={styles.chipContent}>
        <TouchableOpacity
          style={[styles.chip, !selectedCropFilter && styles.chipActive]}
          onPress={() => handleCropFilter(null)}
        >
          <Text style={[styles.chipText, !selectedCropFilter && styles.chipTextActive]}>All 🌾</Text>
        </TouchableOpacity>
        {CROP_LIST.map((c) => (
          <TouchableOpacity
            key={c.id}
            style={[styles.chip, selectedCropFilter === c.id && styles.chipActive]}
            onPress={() => handleCropFilter(c.id)}
          >
            <Text style={[styles.chipText, selectedCropFilter === c.id && styles.chipTextActive]}>
              {CROP_ICONS[c.id]} {c.name}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Nursery Detail Panel */}
      {selectedNursery && (
        <View style={styles.detailCard}>
          <Text style={styles.detailTitle}>{selectedNursery.name}</Text>
          <View style={styles.detailRow}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('distance')}</Text>
              <Text style={styles.detailValue}>{selectedNursery.distance_km} km</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('available')}</Text>
              <Text style={styles.detailValue}>{selectedNursery.available_plants}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>{t('contact')}</Text>
              <Text style={[styles.detailValue, { fontSize: 11 }]}>{selectedNursery.contact}</Text>
            </View>
          </View>
        </View>
      )}

      {/* Nursery List */}
      <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 24 }}>
        <Text style={styles.sectionTitle}>{t('nearbyNurseries')}</Text>
        {loading && <ActivityIndicator color={Colors.primary} style={{ marginTop: 16 }} />}
        {nurseries.map((n) => (
          <TouchableOpacity
            key={n.id}
            style={[styles.nurseryCard, selectedNursery?.id === n.id && styles.nurseryCardActive]}
            onPress={() => setSelectedNursery(selectedNursery?.id === n.id ? null : n)}
            activeOpacity={0.8}
          >
            <View style={styles.nurseryLeft}>
              <Text style={styles.nurseryEmoji}>
                {selectedCropFilter ? CROP_ICONS[selectedCropFilter as CropId] ?? '🌿' : '🏡'}
              </Text>
              <View>
                <Text style={styles.nurseryName}>{n.name}</Text>
                <Text style={styles.nurserySub}>{t('available')}: {n.available_plants} plants</Text>
              </View>
            </View>
            <View style={styles.nurseryRight}>
              <Text style={styles.nurseryDist}>{n.distance_km} km</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  mapArea: {
    backgroundColor: Colors.primaryDark,
    paddingTop: 12,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  mapTitle: { color: Colors.accent, fontWeight: '700', fontSize: 14, marginBottom: 10 },
  mapGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    justifyContent: 'space-around',
    alignItems: 'center',
    minHeight: 140,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: Radius.md,
    padding: 12,
  },
  mapPin: {
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: Radius.md,
    padding: 8,
    minWidth: 72,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  mapPinActive: {
    borderColor: Colors.accent,
    backgroundColor: 'rgba(139,195,74,0.2)',
  },
  mapPinEmoji: { fontSize: 24 },
  mapPinName: { color: Colors.white, fontSize: 10, fontWeight: '600', marginTop: 2, textAlign: 'center' },
  mapPinDist: { color: Colors.textLight, fontSize: 9, textAlign: 'center' },
  userMarker: { alignItems: 'center' },
  userLabel: { color: Colors.accent, fontSize: 9, fontWeight: '700' },
  mapNote: { color: Colors.textLight, fontSize: 11, textAlign: 'center', marginTop: 8 },
  chipBar: { maxHeight: 50, marginVertical: 8 },
  chipContent: { paddingHorizontal: 14, gap: 8, alignItems: 'center' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.round,
    backgroundColor: Colors.white, borderWidth: 1, borderColor: Colors.cardBorder,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { color: Colors.text, fontWeight: '600', fontSize: 13 },
  chipTextActive: { color: Colors.white },
  detailCard: {
    marginHorizontal: 14, marginBottom: 6,
    backgroundColor: Colors.white, borderRadius: Radius.lg,
    padding: 14, elevation: 4, shadowColor: Colors.shadow,
    borderLeftWidth: 4, borderLeftColor: Colors.primary,
  },
  detailTitle: { fontWeight: '700', color: Colors.text, fontSize: 15, marginBottom: 10 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between' },
  detailItem: { alignItems: 'center', flex: 1 },
  detailLabel: { color: Colors.textMuted, fontSize: 11, marginBottom: 2 },
  detailValue: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
  list: { flex: 1, paddingHorizontal: 14 },
  sectionTitle: { fontWeight: '700', color: Colors.text, fontSize: 16, marginVertical: 10 },
  nurseryCard: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14,
    marginBottom: 10, elevation: 2, shadowColor: Colors.shadow,
    borderWidth: 1, borderColor: Colors.cardBorder,
  },
  nurseryCardActive: { borderColor: Colors.primary, backgroundColor: Colors.accentLight },
  nurseryLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  nurseryEmoji: { fontSize: 28 },
  nurseryName: { fontWeight: '700', color: Colors.text, fontSize: 14 },
  nurserySub: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
  nurseryRight: {},
  nurseryDist: { color: Colors.primary, fontWeight: '700', fontSize: 14 },
});
