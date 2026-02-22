import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity,
    TextInput, ActivityIndicator, Alert,
} from 'react-native';
import { useApp, CROP_ICONS } from '@/context/AppContext';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { API } from '@/constants/api';

const CROP_LIST = [
    { id: 'mango', name: 'Mango', spacing: { min: 8, max: 10, recommended: 9 } },
    { id: 'banana', name: 'Banana', spacing: { min: 1.5, max: 2.5, recommended: 1.8 } },
    { id: 'coconut', name: 'Coconut', spacing: { min: 7, max: 9, recommended: 8 } },
    { id: 'guava', name: 'Guava', spacing: { min: 5, max: 8, recommended: 6 } },
    { id: 'papaya', name: 'Papaya', spacing: { min: 2, max: 3, recommended: 2.5 } },
    { id: 'pomegranate', name: 'Pomegranate', spacing: { min: 4, max: 5, recommended: 4.5 } },
    { id: 'orange', name: 'Orange', spacing: { min: 5, max: 7, recommended: 6 } },
    { id: 'teak', name: 'Teak', spacing: { min: 2, max: 4, recommended: 3 } },
    { id: 'neem', name: 'Neem', spacing: { min: 4, max: 6, recommended: 5 } },
    { id: 'cashew', name: 'Cashew', spacing: { min: 7, max: 10, recommended: 8 } },
];

type Estimate = { min_plants: number; max_plants: number; recommended: number };

export default function PlanScreen() {
    const { t } = useApp();
    const [selectedCrop, setSelectedCrop] = useState(CROP_LIST[0]);
    const [area, setArea] = useState('10000');
    const [rowSpacing, setRowSpacing] = useState(String(CROP_LIST[0].spacing.recommended));
    const [colSpacing, setColSpacing] = useState(String(CROP_LIST[0].spacing.recommended));
    const [estimate, setEstimate] = useState<Estimate | null>(null);
    const [loading, setLoading] = useState(false);
    const [showCropList, setShowCropList] = useState(false);

    function calculateLocally() {
        const areaSqft = parseFloat(area) || 0;
        const row = parseFloat(rowSpacing) || 1;
        const col = parseFloat(colSpacing) || 1;
        const areaSqm = areaSqft * 0.092903;
        const recommended = Math.floor(areaSqm / (row * col));
        setEstimate({
            min_plants: Math.floor(recommended * 0.9),
            max_plants: Math.ceil(recommended * 1.1),
            recommended,
        });
    }

    async function handleCalculate() {
        setLoading(true);
        try {
            const res = await fetch(API.plantationEstimate, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    area_sqft: parseFloat(area) || 0,
                    spacing_row_m: parseFloat(rowSpacing) || 1,
                    spacing_col_m: parseFloat(colSpacing) || 1,
                }),
            });
            if (res.ok) {
                const data = await res.json();
                setEstimate(data);
            } else {
                calculateLocally();
            }
        } catch {
            calculateLocally();
        } finally {
            setLoading(false);
        }
    }

    const selectCrop = (crop: typeof CROP_LIST[0]) => {
        setSelectedCrop(crop);
        setRowSpacing(String(crop.spacing.recommended));
        setColSpacing(String(crop.spacing.recommended));
        setShowCropList(false);
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {/* Crop Selector */}
            <View style={styles.card}>
                <Text style={styles.label}>{t('selectCrop')}</Text>
                <TouchableOpacity style={styles.cropSelector} onPress={() => setShowCropList(!showCropList)}>
                    <Text style={styles.cropSelectorIcon}>{CROP_ICONS[selectedCrop.id]}</Text>
                    <Text style={styles.cropSelectorName}>{selectedCrop.name}</Text>
                    <Text style={styles.dropArrow}>{showCropList ? '▲' : '▼'}</Text>
                </TouchableOpacity>
                {showCropList && (
                    <View style={styles.cropDropdown}>
                        {CROP_LIST.map((c) => (
                            <TouchableOpacity key={c.id} style={styles.cropOption} onPress={() => selectCrop(c)}>
                                <Text style={styles.cropOptionIcon}>{CROP_ICONS[c.id]}</Text>
                                <Text style={styles.cropOptionName}>{c.name}</Text>
                                <Text style={styles.cropOptionSpacing}>
                                    {c.spacing.min}–{c.spacing.max}m
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            {/* Spacing Info */}
            <View style={[styles.card, styles.infoBar]}>
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Min Spacing</Text>
                    <Text style={styles.infoVal}>{selectedCrop.spacing.min}m</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Recommended</Text>
                    <Text style={[styles.infoVal, { color: Colors.primary }]}>{selectedCrop.spacing.recommended}m</Text>
                </View>
                <View style={styles.infoDivider} />
                <View style={styles.infoItem}>
                    <Text style={styles.infoLabel}>Max Spacing</Text>
                    <Text style={styles.infoVal}>{selectedCrop.spacing.max}m</Text>
                </View>
            </View>

            {/* Area Input */}
            <View style={styles.card}>
                <Text style={styles.label}>{t('areaLabel')}</Text>
                <TextInput
                    style={styles.input}
                    keyboardType="numeric"
                    value={area}
                    onChangeText={setArea}
                    placeholder={t('enterArea')}
                    placeholderTextColor={Colors.textLight}
                />
            </View>

            {/* Spacing Inputs */}
            <View style={[styles.card, styles.inputRow]}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{t('rowSpacing')}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={rowSpacing}
                        onChangeText={setRowSpacing}
                        placeholderTextColor={Colors.textLight}
                    />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                    <Text style={styles.label}>{t('colSpacing')}</Text>
                    <TextInput
                        style={styles.input}
                        keyboardType="numeric"
                        value={colSpacing}
                        onChangeText={setColSpacing}
                        placeholderTextColor={Colors.textLight}
                    />
                </View>
            </View>

            {/* Calculate Button */}
            <TouchableOpacity style={styles.calcBtn} onPress={handleCalculate} activeOpacity={0.85}>
                {loading
                    ? <ActivityIndicator color={Colors.white} />
                    : <Text style={styles.calcBtnText}>🧮 {t('calculate')}</Text>
                }
            </TouchableOpacity>

            {/* Estimate Result */}
            {estimate && (
                <View style={styles.resultCard}>
                    <Text style={styles.resultTitle}>{t('estimate')}</Text>
                    <View style={styles.resultRow}>
                        <StatBox label={t('minPlants')} value={String(estimate.min_plants)} color={Colors.warning} />
                        <StatBox label={t('recommended')} value={String(estimate.recommended)} color={Colors.primary} large />
                        <StatBox label={t('maxPlants')} value={String(estimate.max_plants)} color={Colors.accent} />
                    </View>

                    {/* Visual Layout Grid */}
                    <Text style={styles.layoutLabel}>📐 Layout Preview</Text>
                    <PlantationGrid count={Math.min(estimate.recommended, 100)} cropId={selectedCrop.id} />
                </View>
            )}
        </ScrollView>
    );
}

function StatBox({ label, value, color, large }: { label: string; value: string; color: string; large?: boolean }) {
    return (
        <View style={[styles.statBox, large && styles.statBoxLarge]}>
            <Text style={[styles.statValue, { color, fontSize: large ? 28 : 20 }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
        </View>
    );
}

function PlantationGrid({ count, cropId }: { count: number; cropId: string }) {
    const cols = 10;
    const rows = Math.ceil(count / cols);
    const icon = CROP_ICONS[cropId] || '🌱';
    return (
        <ScrollView horizontal>
            <View>
                {Array.from({ length: rows }).map((_, ri) => (
                    <View key={ri} style={styles.gridRow}>
                        {Array.from({ length: cols }).map((_, ci) => {
                            const idx = ri * cols + ci;
                            return idx < count ? (
                                <Text key={ci} style={styles.gridCell}>{icon}</Text>
                            ) : (
                                <View key={ci} style={styles.gridCellEmpty} />
                            );
                        })}
                    </View>
                ))}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.md, paddingBottom: 32 },
    card: {
        backgroundColor: Colors.white, borderRadius: Radius.lg,
        padding: 16, marginBottom: 14, elevation: 2, shadowColor: Colors.shadow,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    infoBar: { flexDirection: 'row', justifyContent: 'space-around', padding: 12 },
    infoItem: { alignItems: 'center', flex: 1 },
    infoLabel: { color: Colors.textMuted, fontSize: 11 },
    infoVal: { fontWeight: '700', fontSize: 16, color: Colors.text, marginTop: 2 },
    infoDivider: { width: 1, backgroundColor: Colors.cardBorder },
    label: { color: Colors.textMuted, fontSize: 12, marginBottom: 8, fontWeight: '600' },
    cropSelector: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        backgroundColor: Colors.offWhite, borderRadius: Radius.md, padding: 12,
    },
    cropSelectorIcon: { fontSize: 24 },
    cropSelectorName: { flex: 1, fontWeight: '700', color: Colors.text, fontSize: 16 },
    dropArrow: { color: Colors.primary, fontWeight: '700' },
    cropDropdown: {
        marginTop: 8, borderRadius: Radius.md, overflow: 'hidden',
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    cropOption: {
        flexDirection: 'row', alignItems: 'center', gap: 10,
        padding: 12, backgroundColor: Colors.white,
        borderBottomWidth: 1, borderBottomColor: Colors.cardBorder,
    },
    cropOptionIcon: { fontSize: 20 },
    cropOptionName: { flex: 1, fontWeight: '600', color: Colors.text },
    cropOptionSpacing: { color: Colors.textMuted, fontSize: 12 },
    inputRow: { flexDirection: 'row' },
    input: {
        backgroundColor: Colors.offWhite, borderRadius: Radius.md, padding: 12,
        color: Colors.text, fontSize: 15, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    calcBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 16,
        alignItems: 'center', marginBottom: 16, elevation: 3,
    },
    calcBtnText: { color: Colors.white, fontWeight: '800', fontSize: 16 },
    resultCard: {
        backgroundColor: Colors.white, borderRadius: Radius.xl, padding: 18,
        elevation: 4, borderWidth: 1, borderColor: Colors.cardBorder,
        borderTopWidth: 4, borderTopColor: Colors.primary,
    },
    resultTitle: { fontWeight: '800', color: Colors.text, fontSize: 18, marginBottom: 16, textAlign: 'center' },
    resultRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 18 },
    statBox: { alignItems: 'center', flex: 1 },
    statBoxLarge: {
        backgroundColor: Colors.offWhite, borderRadius: Radius.md, paddingVertical: 10,
    },
    statValue: { fontWeight: '800' },
    statLabel: { color: Colors.textMuted, fontSize: 11, marginTop: 4, textAlign: 'center' },
    layoutLabel: { fontWeight: '700', color: Colors.text, marginBottom: 10 },
    gridRow: { flexDirection: 'row' },
    gridCell: { fontSize: 16, margin: 1 },
    gridCellEmpty: { width: 18, height: 18, margin: 1 },
});
