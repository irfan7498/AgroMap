import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Platform,
} from 'react-native';
import MapView, {
    Marker, Polygon, Polyline, UrlTile, MapPressEvent, LatLng,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Radius } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

// ── Area calculation (spherical shoelace formula) ──────────────
function calcPolygonAreaM2(coords: LatLng[]): number {
    if (coords.length < 3) return 0;
    const R = 6371000;
    let area = 0;
    const n = coords.length;
    for (let i = 0; i < n; i++) {
        const j = (i + 1) % n;
        const lat1 = (coords[i].latitude * Math.PI) / 180;
        const lat2 = (coords[j].latitude * Math.PI) / 180;
        const dLng = ((coords[j].longitude - coords[i].longitude) * Math.PI) / 180;
        area += (dLng * R * R * Math.sin(lat1 + lat2)) / 2;
    }
    return Math.abs(area);
}

function formatArea(sqm: number) {
    return {
        'sq.m': sqm.toFixed(1),
        'sq.ft': (sqm * 10.7639).toFixed(1),
        'Acre': (sqm / 4046.86).toFixed(4),
        'Hectare': (sqm / 10000).toFixed(4),
        'Bigha': (sqm / 2529.29).toFixed(3),
        'Gunta': (sqm / 101.171).toFixed(2),
        'sq.km': (sqm / 1_000_000).toFixed(6),
    };
}

// ── Component ──────────────────────────────────────────────────
type MarkerPoint = LatLng & { id: number };

export default function LandMapScreen() {
    const { setUserLocation } = useApp();
    const mapRef = useRef<MapView>(null);

    const [markers, setMarkers] = useState<MarkerPoint[]>([]);
    const [placing, setPlacing] = useState(true);
    const [areaM2, setAreaM2] = useState<number | null>(null);
    const [userCoords, setUserCoords] = useState<LatLng>({
        latitude: 18.5204,
        longitude: 73.8567,
    });

    // Get user location on mount
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    const coords: LatLng = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setUserCoords(coords);
                    setUserLocation({ lat: coords.latitude, lng: coords.longitude });
                    mapRef.current?.animateToRegion({ ...coords, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 800);
                }
            } catch (_) { }
        })();
    }, []);

    // Recalculate area on marker change
    useEffect(() => {
        setAreaM2(markers.length >= 3 ? calcPolygonAreaM2(markers) : null);
    }, [markers]);

    function handleMapPress(e: MapPressEvent) {
        if (!placing) return;
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkers(prev => [...prev, { latitude, longitude, id: Date.now() }]);
    }

    function undoLast() {
        setMarkers(prev => prev.slice(0, -1));
    }

    function resetAll() {
        setMarkers([]);
        setAreaM2(null);
        setPlacing(true);
    }

    function goToLocation() {
        mapRef.current?.animateToRegion({ ...userCoords, latitudeDelta: 0.005, longitudeDelta: 0.005 }, 600);
    }

    const polygonCoords = markers.map(({ latitude, longitude }) => ({ latitude, longitude }));
    const area = areaM2 !== null ? formatArea(areaM2) : null;

    return (
        <View style={styles.container}>
            {/* ── Map (OpenStreetMap tiles — no API key needed) ── */}
            <MapView
                ref={mapRef}
                style={styles.map}
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass
                showsScale
                initialRegion={{
                    ...userCoords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
            >
                {/* MapTiler satellite tile layer (key from .env) */}
                <UrlTile
                    urlTemplate={`https://api.maptiler.com/tiles/satellite-v2/{z}/{x}/{y}.jpg?key=${process.env.EXPO_PUBLIC_MAPTILER_KEY}`}
                    maximumZ={19}
                    flipY={false}
                    tileSize={256}
                />

                {/* Filled polygon (≥3 points) */}
                {markers.length >= 3 && (
                    <Polygon
                        coordinates={polygonCoords}
                        strokeColor={Colors.accent}
                        strokeWidth={2.5}
                        fillColor="rgba(139,195,74,0.25)"
                    />
                )}

                {/* Preview line while adding 2nd point */}
                {markers.length === 2 && (
                    <Polyline
                        coordinates={polygonCoords}
                        strokeColor={Colors.accent}
                        strokeWidth={2}
                    />
                )}

                {/* Numbered markers */}
                {markers.map((m, idx) => (
                    <Marker
                        key={m.id}
                        coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                        title={`Point ${idx + 1}`}
                        description="Tap callout to remove"
                        onCalloutPress={() => setMarkers(prev => prev.filter(p => p.id !== m.id))}
                    >
                        <View style={styles.markerBubble}>
                            <Text style={styles.markerText}>{idx + 1}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* ── Top banner ── */}
            <View style={styles.banner}>
                <Text style={styles.bannerText}>
                    {placing
                        ? `📍 Tap to add point  •  ${markers.length} added${markers.length >= 3 ? '  ✅' : '  (need ≥3)'}`
                        : '✋ Paused — tap Resume to continue'}
                </Text>
            </View>

            {/* ── Left FAB column ── */}
            <View style={styles.fabCol}>
                <TouchableOpacity style={styles.fab} onPress={goToLocation}>
                    <Text style={styles.fabIcon}>📍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fab, !markers.length && styles.fabDisabled]} onPress={undoLast} disabled={!markers.length}>
                    <Text style={styles.fabIcon}>↩️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fab, styles.fabRed]} onPress={resetAll}>
                    <Text style={styles.fabIcon}>🗑️</Text>
                </TouchableOpacity>
            </View>

            {/* ── Pause / Resume ── */}
            <TouchableOpacity
                style={[styles.pauseBtn, !placing && styles.resumeBtn]}
                onPress={() => setPlacing(v => !v)}
            >
                <Text style={styles.pauseText}>{placing ? '⏸ Pause' : '▶ Resume'}</Text>
            </TouchableOpacity>

            {/* ── Area result panel ── */}
            {area && (
                <View style={styles.areaPanel}>
                    <Text style={styles.areaPanelTitle}>📐 Land Area — {markers.length} corners</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {Object.entries(area).map(([unit, val]) => (
                            <View key={unit} style={styles.areaChip}>
                                <Text style={styles.areaChipVal}>{val}</Text>
                                <Text style={styles.areaChipUnit}>{unit}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <Text style={styles.areaHint}>Tap a marker's callout bubble to remove that point</Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },

    banner: {
        position: 'absolute', top: 0, left: 0, right: 0,
        backgroundColor: Colors.overlay,
        paddingVertical: 8, paddingHorizontal: 16, alignItems: 'center',
    },
    bannerText: { color: Colors.white, fontWeight: '600', fontSize: 12, textAlign: 'center' },

    fabCol: { position: 'absolute', right: 12, top: 50, gap: 10 },
    fab: {
        width: 44, height: 44, borderRadius: 22,
        backgroundColor: Colors.white,
        alignItems: 'center', justifyContent: 'center',
        elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 4,
    },
    fabDisabled: { opacity: 0.35 },
    fabRed: { backgroundColor: '#FFEBEE' },
    fabIcon: { fontSize: 20 },

    pauseBtn: {
        position: 'absolute', top: 50, left: 12,
        backgroundColor: Colors.primaryDark,
        borderRadius: Radius.round, paddingHorizontal: 16, paddingVertical: 10,
        elevation: 4,
    },
    resumeBtn: { backgroundColor: Colors.accent },
    pauseText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

    markerBubble: {
        width: 28, height: 28, borderRadius: 14,
        backgroundColor: Colors.primary, borderWidth: 2, borderColor: Colors.white,
        alignItems: 'center', justifyContent: 'center',
    },
    markerText: { color: Colors.white, fontWeight: '800', fontSize: 12 },

    areaPanel: {
        position: 'absolute', bottom: 0, left: 0, right: 0,
        backgroundColor: Colors.primaryDark,
        paddingTop: 14, paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        paddingHorizontal: 14,
        borderTopLeftRadius: Radius.xl, borderTopRightRadius: Radius.xl,
        elevation: 12,
    },
    areaPanelTitle: { color: Colors.accent, fontWeight: '800', fontSize: 14, marginBottom: 10 },
    areaChip: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: Radius.md, paddingHorizontal: 14, paddingVertical: 10,
        marginRight: 10, minWidth: 80,
        borderWidth: 1, borderColor: 'rgba(139,195,74,0.4)',
    },
    areaChipVal: { color: Colors.white, fontWeight: '800', fontSize: 16 },
    areaChipUnit: { color: Colors.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },
    areaHint: { color: Colors.textLight, fontSize: 11, marginTop: 10 },
});
