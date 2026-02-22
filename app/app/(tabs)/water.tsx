import React, { useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator,
} from 'react-native';
import { useApp, CROP_ICONS } from '@/context/AppContext';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { API } from '@/constants/api';

const CROPS_WATER: Record<string, number> = {
    mango: 20, banana: 12, coconut: 30, guava: 15,
    papaya: 10, pomegranate: 8, orange: 18, teak: 5, neem: 4, cashew: 12,
};

const CROP_LIST = Object.keys(CROPS_WATER).map(id => ({
    id,
    name: id.charAt(0).toUpperCase() + id.slice(1),
}));

export default function WaterScreen() {
    const { t } = useApp();
    const [selectedCrop, setSelectedCrop] = useState(CROP_LIST[0]);
    const [plants, setPlants] = useState('100');
    const [result, setResult] = useState<{ water_per_day_l: number; water_per_month_l: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCropPicker, setShowCropPicker] = useState(false);

    async function handleCalc() {
        setLoading(true);
        const numPlants = parseInt(plants) || 0;
        try {
            const res = await fetch(API.water, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ crop: selectedCrop.id, plants: numPlants }),
            });
            if (res.ok) {
                const data = await res.json();
                setResult(data);
            } else {
                calcLocally(numPlants);
            }
        } catch {
            calcLocally(numPlants);
        } finally {
            setLoading(false);
        }
    }

    function calcLocally(numPlants: number) {
        const lpd = CROPS_WATER[selectedCrop.id] ?? 10;
        const daily = lpd * numPlants;
        setResult({ water_per_day_l: daily, water_per_month_l: daily * 30 });
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Header Illustration */}
            <View style={styles.hero}>
                <Text style={styles.heroEmoji}>💧</Text>
                <Text style={styles.heroTitle}>{t('waterCalc')}</Text>
                <Text style={styles.heroSub}>Calculate daily & monthly water for your farm</Text>
            </View>

            {/* Crop Picker */}
            <View style={styles.card}>
                <Text style={styles.label}>{t('selectCrop')}</Text>
                <TouchableOpacity style={styles.picker} onPress={() => setShowCropPicker(!showCropPicker)}>
                    <Text style={styles.pickerIcon}>{CROP_ICONS[selectedCrop.id]}</Text>
                    <Text style={styles.pickerName}>{selectedCrop.name}</Text>
                    <Text style={styles.lpdBadge}>{CROPS_WATER[selectedCrop.id]}L/tree/day</Text>
                    <Text style={styles.dropArrow}>{showCropPicker ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showCropPicker && (
                    <View style={styles.dropdown}>
                        {CROP_LIST.map((c) => (
                            <TouchableOpacity
                                key={c.id}
                                style={[styles.dropItem, selectedCrop.id === c.id && styles.dropItemActive]}
                                onPress={() => { setSelectedCrop(c); setShowCropPicker(false); setResult(null); }}
                            >
                                <Text style={styles.dropIcon}>{CROP_ICONS[c.id]}</Text>
                                <Text style={styles.dropName}>{c.name}</Text>
                                <Text style={styles.dropLpd}>{CROPS_WATER[c.id]}L/day</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Plants Input */}
            <View style={styles.card}>
                <Text style={styles.label}>{t('plants')}</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={plants}
                    onChangeText={v => { setPlants(v); setResult(null); }}
                    placeholder={t('enterPlants')}
                    placeholderTextColor={Colors.textLight}
                />
                <Text style={styles.inputHint}>
                    {selectedCrop.name} × {plants || 0} trees = {CROPS_WATER[selectedCrop.id] * (parseInt(plants) || 0)}L/day
                </Text>
            </View>

            {/* Calculate */}
            <TouchableOpacity style={styles.calcBtn} onPress={handleCalc} activeOpacity={0.85}>
                {loading
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.calcBtnText}>💧 {t('calculate')}</Text>
                }
            </TouchableOpacity>

            {/* Result */}
            {result && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>Water Requirements</Text>
                    <View style={styles.resultRow}>
                        <WaterStat
                            emoji="☀️"
                            label={t('waterPerDay')}
                            value={result.water_per_day_l.toLocaleString()}
                            unit="L"
                            color={Colors.primary}
                        />
                        <View style={styles.resultDivider} />
                        <WaterStat
                            emoji="📅"
                            label={t('waterPerMonth')}
                            value={result.water_per_month_l.toLocaleString()}
                            unit="L"
                            color={Colors.primaryLight}
                        />
                    </View>
                    {/* Tank Equivalents */}
                    <View style={styles.equivalentBox}>
                        <Text style={styles.equivLabel}>≈ Equivalents</Text>
                        <Text style={styles.equivVal}>
                            🚿 {(result.water_per_day_l / 150).toFixed(1)} household days/day
                        </Text>
                        <Text style={styles.equivVal}>
                            🪣 {(result.water_per_day_l / 20).toFixed(0)} buckets/day
                        </Text>
                        <Text style={styles.equivVal}>
                            🚛 {(result.water_per_month_l / 5000).toFixed(1)} water tankers/month
                        </Text>
                    </View>
                </View>
            )}
        </ScrollView>
    );
}

function WaterStat({ emoji, label, value, unit, color }: any) {
    return (
        <View style={styles.waterStat}>
            <Text style={{ fontSize: 30 }}>{emoji}</Text>
            <Text style={[styles.waterValue, { color }]}>{value}</Text>
            <Text style={styles.waterUnit}>{unit}</Text>
            <Text style={styles.waterLabel}>{label}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.md, paddingBottom: 32 },
    hero: {
        alignItems: 'center', marginBottom: 20,
        backgroundColor: Colors.primaryDark, borderRadius: Radius.xl,
        padding: 24,
    },
    heroEmoji: { fontSize: 48 },
    heroTitle: { color: Colors.white, fontWeight: '800', fontSize: 22, marginTop: 6 },
    heroSub: { color: Colors.textLight, fontSize: 13, marginTop: 4, textAlign: 'center' },
    card: {
        backgroundColor: Colors.white, borderRadius: Radius.lg,
        padding: 16, marginBottom: 14, elevation: 2, shadowColor: Colors.shadow,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    label: { color: Colors.textMuted, fontSize: 12, marginBottom: 8, fontWeight: '600' },
    picker: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: Colors.offWhite, borderRadius: Radius.md, padding: 12,
    },
    pickerIcon: { fontSize: 24 },
    pickerName: { flex: 1, fontWeight: '700', color: Colors.text, fontSize: 15 },
    lpdBadge: {
        backgroundColor: Colors.accentLight, color: Colors.primary,
        fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3,
        borderRadius: Radius.round,
    },
    dropArrow: { color: Colors.primary, fontWeight: '700' },
    dropdown: { marginTop: 8, borderRadius: Radius.md, borderWidth: 1, borderColor: Colors.cardBorder, overflow: 'hidden' },
    dropItem: {
        flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12,
        backgroundColor: Colors.white, borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
    },
    dropItemActive: { backgroundColor: Colors.accentLight },
    dropIcon: { fontSize: 20 },
    dropName: { flex: 1, fontWeight: '600', color: Colors.text },
    dropLpd: { color: Colors.primary, fontSize: 12, fontWeight: '700' },
    input: {
        backgroundColor: Colors.offWhite, borderRadius: Radius.md, padding: 12,
        color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    inputHint: { color: Colors.primary, fontSize: 12, fontWeight: '600', marginTop: 8 },
    calcBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 16,
        alignItems: 'center', marginBottom: 16, elevation: 3,
    },
    calcBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
    resultCard: {
        backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 20,
        elevation: 4, borderTopWidth: 4, borderTopColor: Colors.primaryLight,
    },
    resultTitle: { fontWeight: '800', color: Colors.text, fontSize: 18, textAlign: 'center', marginBottom: 18 },
    resultRow: { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'center' },
    resultDivider: { width: 1, height: 60, backgroundColor: Colors.cardBorder },
    waterStat: { alignItems: 'center', flex: 1 },
    waterValue: { fontWeight: '800', fontSize: 26, marginTop: 4 },
    waterUnit: { color: Colors.textMuted, fontSize: 14, fontWeight: '700' },
    waterLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
    equivalentBox: {
        marginTop: 18, backgroundColor: Colors.offWhite,
        borderRadius: Radius.md, padding: 14,
    },
    equivLabel: { fontWeight: '700', color: Colors.text, fontSize: 13, marginBottom: 8 },
    equivVal: { color: Colors.textMuted, fontSize: 13, marginBottom: 4 },
});
