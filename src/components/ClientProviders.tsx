"use client";

import React, { createContext, useState, useEffect } from 'react';
import { AuthProvider } from '../contexts/AuthContext';
import { AppSettings, defaultSettings, Currency } from '../types';
import { currencyService, CurrencyRate } from '../services/currencyService';
import { cacheUtils } from '../utils/cacheUtils';

interface SettingsContextType extends AppSettings {
    t: (key: string) => string;
    setLanguage: (l: 'en' | 'sw') => void;
    setTheme: (t: 'light' | 'dark' | 'system') => void;
    setCurrency: (code: string) => void;
    currencies: CurrencyRate[];
    selectedCurrency: CurrencyRate | null;
    formatPrice: (usdPrice: number) => string;
}

export const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

export default function ClientProviders({ children }: { children: React.ReactNode }) {
    const [settings, setSettings] = useState<AppSettings>(defaultSettings);
    const [currencies, setCurrencies] = useState<CurrencyRate[]>([]);
    const [selectedCurrency, setSelectedCurrency] = useState<CurrencyRate | null>(null);

    useEffect(() => {
        const init = async () => {
            const cachedSettings = await cacheUtils.get<AppSettings>('app_settings');
            if (cachedSettings) setSettings(cachedSettings);

            try {
                const rates = await currencyService.getRates();
                setCurrencies(rates);
                const code = cachedSettings?.currencyCode || 'USD';
                setSelectedCurrency(rates.find(r => r.code === code) || rates[0]);
            } catch (e) {
                console.error("Failed to load currencies", e);
            }
        };
        init();
    }, []);

    const setLanguage = (l: 'en' | 'sw') => {
        const next = { ...settings, language: l };
        setSettings(next);
        cacheUtils.set('app_settings', next);
    };

    const setTheme = (t: 'light' | 'dark' | 'system') => {
        const next = { ...settings, theme: t };
        setSettings(next);
        cacheUtils.set('app_settings', next);
    };

    const setCurrency = (code: string) => {
        const next = { ...settings, currencyCode: code };
        setSettings(next);
        cacheUtils.set('app_settings', next);
        setSelectedCurrency(currencies.find(r => r.code === code) || null);
    };

    const translate = (key: string) => {
        const translations: any = {
            'echoes': settings.language === 'sw' ? 'Mwangwi' : 'Echoes',
            'chats': settings.language === 'sw' ? 'Mazungumzo' : 'Chats',
            'calls': settings.language === 'sw' ? 'Simu' : 'Calls',
            'profile': settings.language === 'sw' ? 'Wasifu' : 'Profile',
            'cascadea': settings.language === 'sw' ? 'Kaskadea' : 'Cascadea',
            'admin': settings.language === 'sw' ? 'Utawala' : 'Admin',
            'search': settings.language === 'sw' ? 'Tafuta' : 'Search',
        };
        return translations[key] || key;
    };

    const formatPrice = (usdPrice: number) => {
        if (!selectedCurrency) return `$${usdPrice}`;
        const converted = usdPrice * selectedCurrency.rate_to_usd;
        return `${selectedCurrency.symbol}${converted.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
    };

    return (
        <SettingsContext.Provider value={{ 
            ...settings, 
            t: translate, 
            setLanguage, 
            setTheme, 
            setCurrency,
            currencies,
            selectedCurrency,
            formatPrice
        }}>
            <AuthProvider>
                {children}
            </AuthProvider>
        </SettingsContext.Provider>
    );
}