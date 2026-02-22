import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Lang, T } from '@/constants/i18n';

// ── Crop icons (emoji) per crop id ───────────────────────────────
export const CROP_ICONS: Record<string, string> = {
    mango: '🥭',
    banana: '🍌',
    coconut: '🥥',
    guava: '🍈',
    papaya: '🍑',
    pomegranate: '🍎',
    orange: '🍊',
    teak: '🌲',
    neem: '🌿',
    cashew: '🌰',
};

export type Crop = {
    id: string;
    name: string;
    spacing: { min: number; max: number; recommended: number };
    water_lpd: number;
};

type AppContextType = {
    lang: Lang;
    setLang: (l: Lang) => void;
    t: (key: string) => string;
    crops: Crop[];
    setCrops: (c: Crop[]) => void;
    userLocation: { lat: number; lng: number } | null;
    setUserLocation: (loc: { lat: number; lng: number } | null) => void;
};

const AppContext = createContext<AppContextType>({} as AppContextType);

export function AppProvider({ children }: { children: ReactNode }) {
    const [lang, setLang] = useState<Lang>('en');
    const [crops, setCrops] = useState<Crop[]>([]);
    const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

    function t(key: string): string {
        return T[lang][key] ?? key;
    }

    return (
        <AppContext.Provider value={{ lang, setLang, t, crops, setCrops, userLocation, setUserLocation }}>
            {children}
        </AppContext.Provider>
    );
}

export const useApp = () => useContext(AppContext);
