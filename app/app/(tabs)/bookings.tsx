import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert, Modal,
} from 'react-native';
import { useApp, CROP_ICONS } from '@/context/AppContext';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { API } from '@/constants/api';

type Nursery = {
    id: string;
    name: string;
    lat: number;
    lng: number;
    distance_km: number;
    available_plants: number;
    contact: string;
};

const MOCK_NURSERIES: Nursery[] = [
    { id: 'nur001', name: 'GreenGrow Nursery', lat: 18.5412, lng: 73.8721, distance_km: 2.1, available_plants: 1600, contact: '+91-9876543210' },
    { id: 'nur002', name: 'Sahyadri Plant House', lat: 18.492, lng: 73.81, distance_km: 5.4, available_plants: 2200, contact: '+91-9123456780' },
    { id: 'nur003', name: 'Deccan Agri Nursery', lat: 18.57, lng: 73.92, distance_km: 8.2, available_plants: 1250, contact: '+91-9988776655' },
    { id: 'nur004', name: 'Krishak Vatika', lat: 18.45, lng: 73.85, distance_km: 12.6, available_plants: 2150, contact: '+91-9112233445' },
    { id: 'nur005', name: 'Panchgani Flora Hub', lat: 17.924, lng: 73.798, distance_km: 28.4, available_plants: 1600, contact: '+91-9334455667' },
];

const CROP_LIST = [
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

export default function BookingsScreen() {
    const { t, userLocation } = useApp();
    const [nurseries, setNurseries] = useState<Nursery[]>(MOCK_NURSERIES);
    const [loading, setLoading] = useState(false);
    const [selectedNursery, setSelectedNursery] = useState<Nursery | null>(null);
    const [selectedCrop, setSelectedCrop] = useState(CROP_LIST[0]);
    const [quantity, setQuantity] = useState('50');
    const [bookingResult, setBookingResult] = useState<{ booking_id: string; status: string } | null>(null);
    const [showModal, setShowModal] = useState(false);
    const [showCropPicker, setShowCropPicker] = useState(false);
    const [bookings, setBookings] = useState<Array<{ booking_id: string; nursery: string; crop: string; qty: number; status: string }>>([]);

    const lat = userLocation?.lat ?? 18.5204;
    const lng = userLocation?.lng ?? 73.8567;

    async function fetchNurseries() {
        setLoading(true);
        try {
            const res = await fetch(API.nurseries(lat, lng, 300));
            if (res.ok) {
                const data = await res.json();
                setNurseries(data.nurseries?.length ? data.nurseries : MOCK_NURSERIES);
            } else {
                setNurseries(MOCK_NURSERIES);
            }
        } catch {
            setNurseries(MOCK_NURSERIES);
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => { fetchNurseries(); }, []);

    async function handleBook() {
        if (!selectedNursery) return;
        setLoading(true);
        try {
            const res = await fetch(API.bookings, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nursery_id: selectedNursery.id,
                    crop: selectedCrop.id,
                    quantity: parseInt(quantity) || 1,
                }),
            });
            let bookId = 'BK' + Math.random().toString(36).substring(2, 8).toUpperCase();
            let status = 'CONFIRMED';
            if (res.ok) {
                const data = await res.json();
                bookId = data.booking_id;
                status = data.status;
            }
            setBookingResult({ booking_id: bookId, status });
            setBookings(prev => [{
                booking_id: bookId,
                nursery: selectedNursery.name,
                crop: selectedCrop.name,
                qty: parseInt(quantity) || 1,
                status,
            }, ...prev]);
            setShowModal(true);
        } catch {
            Alert.alert('Error', 'Failed to place booking. Please try again.');
        } finally {
            setLoading(false);
        }
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Nursery List */}
                <Text style={styles.sectionTitle}>{t('nearbyNurseries')}</Text>
                {loading && <ActivityIndicator color={Colors.primary} style={{ marginBottom: 12 }} />}
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.nurseryScroll}>
                    {nurseries.map((n) => (
                        <TouchableOpacity
                            key={n.id}
                            style={[styles.nurseryCard, selectedNursery?.id === n.id && styles.nurseryCardActive]}
                            onPress={() => setSelectedNursery(n)}
                            activeOpacity={0.8}
                        >
                            <Text style={styles.nurseryEmoji}>🏡</Text>
                            <Text style={styles.nurseryName} numberOfLines={2}>{n.name}</Text>
                            <Text style={styles.nurserySub}>{n.distance_km} km away</Text>
                            <Text style={styles.nurseryStock}>📦 {n.available_plants}</Text>
                            <Text style={styles.nurseryContact}>{n.contact}</Text>
                            {selectedNursery?.id === n.id && (
                                <View style={styles.selectedBadge}>
                                    <Text style={styles.selectedBadgeText}>✓ Selected</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                    ))}
                </ScrollView>

                {selectedNursery ? (
                    <View style={styles.bookCard}>
                        <Text style={styles.bookTitle}>📦 {t('bookNow')}</Text>
                        <Text style={styles.bookNursery}>{selectedNursery.name}</Text>

                        {/* Crop Selector */}
                        <Text style={styles.label}>{t('selectCrop')}</Text>
                        <TouchableOpacity style={styles.picker} onPress={() => setShowCropPicker(!showCropPicker)}>
                            <Text style={{ fontSize: 22 }}>{CROP_ICONS[selectedCrop.id]}</Text>
                            <Text style={styles.pickerName}>{selectedCrop.name}</Text>
                            <Text style={styles.dropArrow}>{showCropPicker ? '▲' : '▼'}</Text>
                        </TouchableOpacity>
                        {showCropPicker && (
                            <View style={styles.dropdown}>
                                {CROP_LIST.map((c) => (
                                    <TouchableOpacity
                                        key={c.id}
                                        style={[styles.dropItem, selectedCrop.id === c.id && styles.dropItemActive]}
                                        onPress={() => { setSelectedCrop(c); setShowCropPicker(false); }}
                                    >
                                        <Text style={{ fontSize: 18 }}>{CROP_ICONS[c.id]}</Text>
                                        <Text style={styles.dropName}>{c.name}</Text>
                                    </TouchableOpacity>
                                ))}
                            </View>
                        )}

                        {/* Quantity */}
                        <Text style={[styles.label, { marginTop: 14 }]}>{t('quantity')}</Text>
                        <TextInput
                            style={styles.input}
                            keyboardType="numeric"
                            value={quantity}
                            onChangeText={setQuantity}
                            placeholder="e.g. 50"
                            placeholderTextColor={Colors.textLight}
                        />

                        <TouchableOpacity
                            style={[styles.bookBtn, loading && { opacity: 0.6 }]}
                            onPress={handleBook}
                            activeOpacity={0.85}
                            disabled={loading}
                        >
                            {loading
                                ? <ActivityIndicator color={Colors.white} />
                                : <Text style={styles.bookBtnText}>✅ {t('confirmBooking')}</Text>
                            }
                        </TouchableOpacity>
                    </View>
                ) : (
                    <View style={styles.emptySelect}>
                        <Text style={{ fontSize: 40 }}>👆</Text>
                        <Text style={styles.emptySelectText}>Select a nursery above to place a booking</Text>
                    </View>
                )}

                {/* My Bookings */}
                {bookings.length > 0 && (
                    <View style={styles.myBookings}>
                        <Text style={styles.sectionTitle}>📋 My Bookings</Text>
                        {bookings.map((b, i) => (
                            <View key={i} style={styles.bookingRow}>
                                <View style={styles.bookingLeft}>
                                    <Text style={styles.bookingEmoji}>{CROP_ICONS[b.crop.toLowerCase()] ?? '🌱'}</Text>
                                    <View>
                                        <Text style={styles.bookingCrop}>{b.crop} × {b.qty}</Text>
                                        <Text style={styles.bookingNursery}>{b.nursery}</Text>
                                        <Text style={styles.bookingId}>ID: {b.booking_id}</Text>
                                    </View>
                                </View>
                                <View style={styles.statusBadge}>
                                    <Text style={styles.statusText}>{b.status}</Text>
                                </View>
                            </View>
                        ))}
                    </View>
                )}
            </ScrollView>

            {/* Success Modal */}
            <Modal visible={showModal} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalCard}>
                        <Text style={styles.modalEmoji}>🎉</Text>
                        <Text style={styles.modalTitle}>{t('bookingConfirmed')}</Text>
                        <Text style={styles.modalId}>{t('bookingId')}: {bookingResult?.booking_id}</Text>
                        <Text style={styles.modalStatus}>Status: {bookingResult?.status}</Text>
                        <TouchableOpacity style={styles.modalBtn} onPress={() => setShowModal(false)}>
                            <Text style={styles.modalBtnText}>Done</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.md, paddingBottom: 32 },
    sectionTitle: { fontWeight: '800', color: Colors.text, fontSize: 16, marginBottom: 12 },
    nurseryScroll: { marginBottom: 16 },
    nurseryCard: {
        width: 160, marginRight: 12, backgroundColor: Colors.white,
        borderRadius: Radius.lg, padding: 14, alignItems: 'center',
        elevation: 2, borderWidth: 2, borderColor: Colors.cardBorder,
    },
    nurseryCardActive: { borderColor: Colors.primary, backgroundColor: Colors.accentLight },
    nurseryEmoji: { fontSize: 32, marginBottom: 6 },
    nurseryName: { fontWeight: '700', color: Colors.text, fontSize: 13, textAlign: 'center', marginBottom: 4 },
    nurserySub: { color: Colors.primary, fontWeight: '700', fontSize: 12 },
    nurseryStock: { color: Colors.textMuted, fontSize: 11, marginTop: 4 },
    nurseryContact: { color: Colors.textMuted, fontSize: 10, marginTop: 2 },
    selectedBadge: {
        marginTop: 8, backgroundColor: Colors.primary, borderRadius: Radius.round,
        paddingHorizontal: 10, paddingVertical: 3,
    },
    selectedBadgeText: { color: Colors.white, fontWeight: '700', fontSize: 11 },
    bookCard: {
        backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 18,
        marginBottom: 16, elevation: 4, borderTopWidth: 4, borderTopColor: Colors.primary,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    bookTitle: { fontWeight: '800', color: Colors.text, fontSize: 18, marginBottom: 4 },
    bookNursery: { color: Colors.primary, fontWeight: '600', fontSize: 13, marginBottom: 14 },
    label: { color: Colors.textMuted, fontSize: 12, fontWeight: '600', marginBottom: 8 },
    picker: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: Colors.offWhite, borderRadius: Radius.md, padding: 12,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    pickerName: { flex: 1, fontWeight: '700', color: Colors.text, fontSize: 15 },
    dropArrow: { color: Colors.primary, fontWeight: '700' },
    dropdown: { marginTop: 6, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
    dropItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
        backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
    },
    dropItemActive: { backgroundColor: Colors.accentLight },
    dropName: { fontWeight: '600', color: Colors.text, fontSize: 14 },
    input: {
        backgroundColor: Colors.offWhite, borderRadius: Radius.md, padding: 12,
        color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    bookBtn: {
        marginTop: 16, backgroundColor: Colors.primary, borderRadius: Radius.lg,
        padding: 16, alignItems: 'center', elevation: 3,
    },
    bookBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
    emptySelect: {
        alignItems: 'center', padding: 32, backgroundColor: Colors.white,
        borderRadius: Radius.xl, marginBottom: 16, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    emptySelectText: { color: Colors.textMuted, marginTop: 10, textAlign: 'center', fontSize: 14 },
    myBookings: { marginTop: 8 },
    bookingRow: {
        flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
        backgroundColor: Colors.white, borderRadius: Radius.md, padding: 14, marginBottom: 10,
        elevation: 2, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    bookingLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
    bookingEmoji: { fontSize: 28 },
    bookingCrop: { fontWeight: '700', color: Colors.text, fontSize: 14 },
    bookingNursery: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
    bookingId: { color: Colors.primary, fontSize: 11, fontWeight: '600', marginTop: 2 },
    statusBadge: {
        backgroundColor: Colors.accentLight, borderRadius: Radius.round,
        paddingHorizontal: 12, paddingVertical: 5,
    },
    statusText: { color: Colors.primary, fontWeight: '800', fontSize: 12 },
    modalOverlay: {
        flex: 1, backgroundColor: Colors.overlay,
        justifyContent: 'center', alignItems: 'center',
    },
    modalCard: {
        backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 32,
        alignItems: 'center', width: '80%', elevation: 10,
    },
    modalEmoji: { fontSize: 56 },
    modalTitle: { fontWeight: '800', fontSize: 22, color: Colors.primary, marginTop: 12, textAlign: 'center' },
    modalId: { color: Colors.text, fontWeight: '600', marginTop: 10, fontSize: 15 },
    modalStatus: { color: Colors.textMuted, marginTop: 4 },
    modalBtn: {
        marginTop: 20, backgroundColor: Colors.primary, borderRadius: Radius.lg,
        paddingHorizontal: 32, paddingVertical: 14,
    },
    modalBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
});
