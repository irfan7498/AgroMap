import React, { useState, useRef, useEffect } from 'react';
import {
    View, Text, StyleSheet, TouchableOpacity, ScrollView,
    Alert, Platform, Dimensions,
} from 'react-native';
import MapView, {
    Marker, Polygon, MapPressEvent, PROVIDER_GOOGLE, LatLng,
} from 'react-native-maps';
import * as Location from 'expo-location';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useApp } from '@/context/AppContext';

const { width } = Dimensions.get('window');

// ── Area calculation utilities ─────────────────────────────────

/** Shoelace formula on a spherical surface (Google Maps approach) */
function calcPolygonAreaM2(coords: LatLng[]): number {
    if (coords.length < 3) return 0;
    const R = 6371000; // Earth radius in meters
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
        sqm: sqm.toFixed(1),
        sqft: (sqm * 10.7639).toFixed(1),
        acre: (sqm / 4046.86).toFixed(4),
        hectare: (sqm / 10000).toFixed(4),
        bigha: (sqm / 2529.29).toFixed(4),       // North India bigha
        gunta: (sqm / 101.171).toFixed(2),         // Maharashtra gunta
        sqkm: (sqm / 1_000_000).toFixed(6),
    };
}

const UNIT_LABELS: Record<string, string> = {
    sqm: 'sq.m',
    sqft: 'sq.ft',
    acre: 'Acre',
    hectare: 'Hectare',
    bigha: 'Bigha',
    gunta: 'Gunta',
    sqkm: 'sq.km',
};

// ── Component ──────────────────────────────────────────────────

type MarkerPoint = LatLng & { id: number };

export default function LandMapScreen() {
    const { t, setUserLocation } = useApp();
    const mapRef = useRef<MapView>(null);

    const [markers, setMarkers] = useState<MarkerPoint[]>([]);
    const [placing, setPlacing] = useState(true); // placing mode on by default
    const [areaM2, setAreaM2] = useState<number | null>(null);
    const [userCoords, setUserCoords] = useState<LatLng>({
        latitude: 18.5204,
        longitude: 73.8567,
    });
    const [locating, setLocating] = useState(false);

    // ── Get user location ──────────────────────────────────────
    useEffect(() => {
        (async () => {
            try {
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                    setLocating(true);
                    const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
                    const coords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
                    setUserCoords(coords);
                    setUserLocation({ lat: coords.latitude, lng: coords.longitude });
                    mapRef.current?.animateToRegion({
                        ...coords,
                        latitudeDelta: 0.005,
                        longitudeDelta: 0.005,
                    }, 800);
                }
            } catch (_) { }
            finally { setLocating(false); }
        })();
    }, []);

    // Recalculate area whenever markers change
    useEffect(() => {
        if (markers.length >= 3) {
            setAreaM2(calcPolygonAreaM2(markers));
        } else {
            setAreaM2(null);
        }
    }, [markers]);

    // ── Map press handler ──────────────────────────────────────
    function handleMapPress(e: MapPressEvent) {
        if (!placing) return;
        const { latitude, longitude } = e.nativeEvent.coordinate;
        setMarkers(prev => [...prev, { latitude, longitude, id: Date.now() }]);
    }

    function removeMarker(id: number) {
        setMarkers(prev => prev.filter(m => m.id !== id));
    }

    function resetAll() {
        setMarkers([]);
        setAreaM2(null);
        setPlacing(true);
    }

    function undoLast() {
        setMarkers(prev => prev.slice(0, -1));
    }

    function goToMyLocation() {
        mapRef.current?.animateToRegion({
            ...userCoords,
            latitudeDelta: 0.005,
            longitudeDelta: 0.005,
        }, 600);
    }

    const area = areaM2 !== null ? formatArea(areaM2) : null;
    const polygonCoords = markers.map(m => ({ latitude: m.latitude, longitude: m.longitude }));

    return (
        <View style={styles.container}>
            {/* ── Map ────────────────────────────────────────────── */}
            <MapView
                ref={mapRef}
                style={styles.map}
                provider={PROVIDER_GOOGLE}
                mapType="hybrid"          // satellite + roads = best for farmland
                showsUserLocation
                showsMyLocationButton={false}
                showsCompass
                showsScale
                showsBuildings
                showsTerrain
                initialRegion={{
                    ...userCoords,
                    latitudeDelta: 0.01,
                    longitudeDelta: 0.01,
                }}
                onPress={handleMapPress}
            >
                {/* Land boundary polygon */}
                {markers.length >= 3 && (
                    <Polygon
                        coordinates={polygonCoords}
                        strokeColor={Colors.accent}
                        strokeWidth={2.5}
                        fillColor="rgba(139,195,74,0.25)"
                    />
                )}

                {/* Preview lines (dashed path while marking) */}
                {markers.length >= 2 && markers.length < 3 && (
                    <Polygon
                        coordinates={polygonCoords}
                        strokeColor={Colors.accent}
                        strokeWidth={2}
                        fillColor="transparent"
                    />
                )}

                {/* Markers */}
                {markers.map((m, idx) => (
                    <Marker
                        key={m.id}
                        coordinate={{ latitude: m.latitude, longitude: m.longitude }}
                        title={`Point ${idx + 1}`}
                        description="Long press to remove"
                        onCalloutPress={() => removeMarker(m.id)}
                        pinColor={Colors.primary}
                    >
                        <View style={styles.markerBubble}>
                            <Text style={styles.markerText}>{idx + 1}</Text>
                        </View>
                    </Marker>
                ))}
            </MapView>

            {/* ── Status Banner ───────────────────────────────────── */}
            <View style={styles.banner}>
                {placing ? (
                    <Text style={styles.bannerText}>
                        📍 Tap on map to add points  •  {markers.length} point{markers.length !== 1 ? 's' : ''} added
                        {markers.length >= 3 ? '  ✅ Area calculated!' : '  (Need ≥ 3)'}
                    </Text>
                ) : (
                    <Text style={styles.bannerText}>✋ Placing paused – tap Resume to add more</Text>
                )}
            </View>

            {/* ── Floating Controls ───────────────────────────────── */}
            <View style={styles.floatingLeft}>
                <TouchableOpacity style={styles.fabBtn} onPress={goToMyLocation}>
                    <Text style={styles.fabIcon}>📍</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.fabBtn} onPress={undoLast} disabled={markers.length === 0}>
                    <Text style={[styles.fabIcon, markers.length === 0 && { opacity: 0.3 }]}>↩️</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.fabBtn, styles.fabDanger]} onPress={resetAll}>
                    <Text style={styles.fabIcon}>🗑️</Text>
                </TouchableOpacity>
            </View>

            <TouchableOpacity
                style={[styles.pauseBtn, !placing && styles.resumeBtn]}
                onPress={() => setPlacing(v => !v)}
            >
                <Text style={styles.pauseBtnText}>{placing ? '⏸ Pause' : '▶ Resume'}</Text>
            </TouchableOpacity>

            {/* ── Area Panel ──────────────────────────────────────── */}
            {area && (
                <View style={styles.areaPanel}>
                    <Text style={styles.areaPanelTitle}>📐 Land Area</Text>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                        {Object.entries(area).map(([key, val]) => (
                            <View key={key} style={styles.areaChip}>
                                <Text style={styles.areaChipVal}>{val}</Text>
                                <Text style={styles.areaChipLabel}>{UNIT_LABELS[key]}</Text>
                            </View>
                        ))}
                    </ScrollView>
                    <Text style={styles.areaNote}>
                        {markers.length} corners  •  Tap a marker callout to remove it
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    map: { flex: 1 },

    // Status banner
    banner: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.overlay,
        paddingVertical: 8,
        paddingHorizontal: 16,
        alignItems: 'center',
    },
    bannerText: { color: Colors.white, fontWeight: '600', fontSize: 12, textAlign: 'center' },

    // Floating action buttons (left column)
    floatingLeft: {
        position: 'absolute',
        right: 12,
        top: 50,
        gap: 10,
    },
    fabBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 4,
    },
    fabDanger: { backgroundColor: '#FFEBEE' },
    fabIcon: { fontSize: 20 },

    // Pause/resume button (top left)
    pauseBtn: {
        position: 'absolute',
        top: 50,
        left: 12,
        backgroundColor: Colors.primaryDark,
        borderRadius: Radius.round,
        paddingHorizontal: 16,
        paddingVertical: 10,
        elevation: 4,
    },
    resumeBtn: { backgroundColor: Colors.accent },
    pauseBtnText: { color: Colors.white, fontWeight: '700', fontSize: 13 },

    // Number marker bubble
    markerBubble: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: Colors.primary,
        borderWidth: 2,
        borderColor: Colors.white,
        alignItems: 'center',
        justifyContent: 'center',
    },
    markerText: { color: Colors.white, fontWeight: '800', fontSize: 12 },

    // Area panel at bottom
    areaPanel: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        backgroundColor: Colors.primaryDark,
        paddingTop: 14,
        paddingBottom: Platform.OS === 'ios' ? 28 : 14,
        paddingHorizontal: 14,
        borderTopLeftRadius: Radius.xl,
        borderTopRightRadius: Radius.xl,
        elevation: 12,
    },
    areaPanelTitle: {
        color: Colors.accent,
        fontWeight: '800',
        fontSize: 15,
        marginBottom: 10,
    },
    areaChip: {
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderRadius: Radius.md,
        paddingHorizontal: 14,
        paddingVertical: 10,
        marginRight: 10,
        minWidth: 80,
        borderWidth: 1,
        borderColor: 'rgba(139,195,74,0.4)',
    },
    areaChipVal: { color: Colors.white, fontWeight: '800', fontSize: 16 },
    areaChipLabel: { color: Colors.accent, fontSize: 11, fontWeight: '600', marginTop: 2 },
    areaNote: { color: Colors.textLight, fontSize: 11, marginTop: 10 },
});
