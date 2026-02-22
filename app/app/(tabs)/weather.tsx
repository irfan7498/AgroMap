import React, { useEffect, useState } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { useApp } from '@/context/AppContext';
import { Colors, Spacing, Radius } from '@/constants/theme';
import { API } from '@/constants/api';

type WeatherData = {
    temperature_c: number;
    humidity: number;
    rain_probability: number;
    condition: string;
};

function getWeatherEmoji(condition: string): string {
    const c = condition.toLowerCase();
    if (c.includes('sunny') || c.includes('clear')) return '☀️';
    if (c.includes('rain')) return '🌧️';
    if (c.includes('cloud')) return '☁️';
    if (c.includes('storm')) return '⛈️';
    if (c.includes('fog') || c.includes('mist')) return '🌫️';
    return '🌤️';
}

function getHumidityLabel(h: number): string {
    if (h < 40) return 'Low';
    if (h < 70) return 'Moderate';
    return 'High';
}

const FARM_TIPS: Record<string, string[]> = {
    Sunny: ['Best time for spraying pesticides', 'Ensure irrigation is scheduled', 'Avoid transplanting in peak heat'],
    'Partly Cloudy': ['Good day for field work', 'Monitor for sudden showers', 'Ideal for grafting activities'],
    Cloudy: ['Good for transplanting seedlings', 'Reduce irrigation slightly', 'Watch for fungal diseases'],
    'Light Rain': ['Pause irrigation – natural watering!', 'Avoid fertilizer application', 'Good for soil moisture'],
    Clear: ['Perfect day for harvesting', 'Ideal for drying/storing produce', 'Good pest scouting day'],
};

export default function WeatherScreen() {
    const { t, userLocation } = useApp();
    const [weather, setWeather] = useState<WeatherData | null>(null);
    const [loading, setLoading] = useState(false);
    const [lastUpdated, setLastUpdated] = useState<string>('');

    const lat = userLocation?.lat ?? 18.5204;
    const lng = userLocation?.lng ?? 73.8567;

    async function fetchWeather() {
        setLoading(true);
        try {
            const res = await fetch(API.weather(lat, lng));
            if (res.ok) {
                const data = await res.json();
                setWeather(data);
                setLastUpdated(new Date().toLocaleTimeString());
            } else {
                useMockWeather();
            }
        } catch {
            useMockWeather();
        } finally {
            setLoading(false);
        }
    }

    function useMockWeather() {
        const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain', 'Clear'];
        setWeather({
            temperature_c: 28 + Math.round(Math.random() * 8),
            humidity: 55 + Math.round(Math.random() * 30),
            rain_probability: parseFloat((Math.random() * 0.5).toFixed(2)),
            condition: conditions[Math.floor(Math.random() * conditions.length)],
        });
        setLastUpdated(new Date().toLocaleTimeString());
    }

    useEffect(() => { fetchWeather(); }, []);

    const tips = weather ? (FARM_TIPS[weather.condition] ?? FARM_TIPS['Partly Cloudy']) : [];

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>
            {loading && (
                <View style={styles.loadingBox}>
                    <ActivityIndicator color={Colors.primary} size="large" />
                    <Text style={styles.loadingText}>{t('fetchingWeather')}</Text>
                </View>
            )}

            {weather && !loading && (
                <>
                    {/* Main Weather Card */}
                    <View style={styles.mainCard}>
                        <Text style={styles.weatherEmoji}>{getWeatherEmoji(weather.condition)}</Text>
                        <Text style={styles.tempText}>{weather.temperature_c}°C</Text>
                        <Text style={styles.conditionText}>{weather.condition}</Text>
                        <Text style={styles.locationText}>📍 {lat.toFixed(4)}, {lng.toFixed(4)}</Text>
                        <Text style={styles.updatedText}>Updated: {lastUpdated}</Text>
                    </View>

                    {/* Stats Grid */}
                    <View style={styles.statsGrid}>
                        <WeatherStatCard
                            emoji="💧"
                            label={t('humidity')}
                            value={`${weather.humidity}%`}
                            sub={getHumidityLabel(weather.humidity)}
                            color={Colors.sky}
                        />
                        <WeatherStatCard
                            emoji="🌧️"
                            label={t('rainChance')}
                            value={`${Math.round(weather.rain_probability * 100)}%`}
                            sub={weather.rain_probability > 0.4 ? 'High' : weather.rain_probability > 0.2 ? 'Moderate' : 'Low'}
                            color={Colors.accent}
                        />
                        <WeatherStatCard
                            emoji="🌡️"
                            label="Feels Like"
                            value={`${weather.temperature_c + 2}°C`}
                            sub={weather.temperature_c > 32 ? 'Hot' : weather.temperature_c > 26 ? 'Warm' : 'Pleasant'}
                            color={Colors.warning}
                        />
                        <WeatherStatCard
                            emoji="💨"
                            label="Wind"
                            value="12 km/h"
                            sub="NW"
                            color={Colors.primaryLight}
                        />
                    </View>

                    {/* Farm Tips */}
                    <View style={styles.tipsCard}>
                        <Text style={styles.tipsTitle}>🌾 Today's Farm Tips</Text>
                        {tips.map((tip, i) => (
                            <View key={i} style={styles.tipRow}>
                                <Text style={styles.tipBullet}>✓</Text>
                                <Text style={styles.tipText}>{tip}</Text>
                            </View>
                        ))}
                    </View>

                    {/* Rain Bar */}
                    <View style={styles.rainCard}>
                        <Text style={styles.rainTitle}>🌧️ Rain Probability</Text>
                        <View style={styles.rainTrack}>
                            <View style={[styles.rainBar, { width: `${weather.rain_probability * 100}%` }]} />
                        </View>
                        <Text style={styles.rainPct}>{Math.round(weather.rain_probability * 100)}%</Text>
                    </View>

                    {/* Refresh */}
                    <TouchableOpacity style={styles.refreshBtn} onPress={fetchWeather} activeOpacity={0.85}>
                        <Text style={styles.refreshBtnText}>🔄 Refresh Weather</Text>
                    </TouchableOpacity>
                </>
            )}
        </ScrollView>
    );
}

function WeatherStatCard({ emoji, label, value, sub, color }: any) {
    return (
        <View style={[styles.statCard, { borderTopColor: color }]}>
            <Text style={{ fontSize: 22 }}>{emoji}</Text>
            <Text style={[styles.statValue, { color }]}>{value}</Text>
            <Text style={styles.statLabel}>{label}</Text>
            <Text style={styles.statSub}>{sub}</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: Colors.bg },
    content: { padding: Spacing.md, paddingBottom: 32 },
    loadingBox: { alignItems: 'center', padding: 40 },
    loadingText: { color: Colors.textMuted, marginTop: 12 },
    mainCard: {
        backgroundColor: Colors.primaryDark, borderRadius: Radius.xl,
        padding: 32, alignItems: 'center', marginBottom: 16,
    },
    weatherEmoji: { fontSize: 72 },
    tempText: { color: Colors.white, fontWeight: '800', fontSize: 48, marginTop: 8 },
    conditionText: { color: Colors.accent, fontWeight: '700', fontSize: 20, marginTop: 4 },
    locationText: { color: Colors.textLight, fontSize: 12, marginTop: 8 },
    updatedText: { color: Colors.textLight, fontSize: 11, marginTop: 4 },
    statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
    statCard: {
        flex: 1, minWidth: '45%',
        backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 14,
        alignItems: 'center', elevation: 2, borderTopWidth: 3,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    statValue: { fontWeight: '800', fontSize: 22, marginTop: 4 },
    statLabel: { color: Colors.textMuted, fontSize: 12, marginTop: 2 },
    statSub: { color: Colors.text, fontSize: 11, fontWeight: '600', marginTop: 2 },
    tipsCard: {
        backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16,
        marginBottom: 14, elevation: 2, borderLeftWidth: 4, borderLeftColor: Colors.primary,
        borderWidth: 1, borderColor: Colors.cardBorder,
    },
    tipsTitle: { fontWeight: '800', color: Colors.text, fontSize: 15, marginBottom: 12 },
    tipRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, marginBottom: 8 },
    tipBullet: { color: Colors.primary, fontWeight: '800', fontSize: 14 },
    tipText: { color: Colors.text, fontSize: 13, flex: 1, lineHeight: 20 },
    rainCard: {
        backgroundColor: Colors.white, borderRadius: Radius.lg, padding: 16,
        marginBottom: 14, elevation: 2, borderWidth: 1, borderColor: Colors.cardBorder,
    },
    rainTitle: { fontWeight: '700', color: Colors.text, marginBottom: 12 },
    rainTrack: {
        height: 12, backgroundColor: Colors.cardBorder, borderRadius: Radius.round, overflow: 'hidden',
    },
    rainBar: { height: '100%', backgroundColor: Colors.sky, borderRadius: Radius.round },
    rainPct: { color: Colors.primaryLight, fontWeight: '700', marginTop: 6 },
    refreshBtn: {
        backgroundColor: Colors.primary, borderRadius: Radius.lg, padding: 14,
        alignItems: 'center', elevation: 2,
    },
    refreshBtnText: { color: Colors.white, fontWeight: '700', fontSize: 15 },
});
