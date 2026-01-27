import { useAtom, useSetAtom } from 'jotai';
import { useEffect, useState } from 'react';
import {
    symbolListsAtom,
    currentListIdAtom,
    settingsAtom,
    authUserAtom,
    isLoadingAtom
} from './index';

export const useStorageSync = () => {
    const [symbolLists, setSymbolLists] = useAtom(symbolListsAtom);
    const [currentListId, setCurrentListId] = useAtom(currentListIdAtom);
    const [settings, setSettings] = useAtom(settingsAtom);
    const [authUser, setAuthUser] = useAtom(authUserAtom);
    const setIsLoading = useSetAtom(isLoadingAtom);

    const [isHydrated, setIsHydrated] = useState(false);

    // Load from storage on mount
    useEffect(() => {
        const loadStorage = async () => {
            try {
                setIsLoading(true);
                const result = await chrome.storage.local.get([
                    'symbolLists',
                    'currentListId',
                    'settings',
                    'authUser'
                ]);

                // Handle symbolLists
                if (result.symbolLists) {
                    let lists = result.symbolLists;
                    if (typeof lists === 'string') {
                        try { lists = JSON.parse(lists); } catch (e) { console.error('Failed to parse symbolLists', e); }
                    }
                    if (Array.isArray(lists)) {
                        setSymbolLists(lists);
                    } else {
                        console.warn('⚠️ Invalid symbolLists format:', typeof lists);
                        setSymbolLists([]);
                    }
                }

                // Handle currentListId
                if (result.currentListId) {
                    let id = result.currentListId;
                    if (typeof id === 'string' && (id.startsWith('"') || id.startsWith('{'))) {
                        // Attempt parse if it looks like JSON, though IDs are usually simple strings.
                        // However, atomWithStorage might quote strings: "\"id\""
                        try { id = JSON.parse(id); } catch (e) { }
                    }
                    setCurrentListId(id);
                }

                // Handle settings
                if (result.settings) {
                    let loadedSettings = result.settings;
                    if (typeof loadedSettings === 'string') {
                        try { loadedSettings = JSON.parse(loadedSettings); } catch (e) { }
                    }
                    setSettings(loadedSettings);
                }

                // Handle authUser
                if (result.authUser) {
                    let finalUser = result.authUser;
                    if (typeof finalUser === 'string') {
                        try { finalUser = JSON.parse(finalUser); } catch (e) { }
                    }
                    setAuthUser(finalUser);
                }

                setIsHydrated(true);
            } catch (error) {
                console.error('Failed to load storage:', error);
            } finally {
                setIsLoading(false);
            }
        };

        loadStorage();
    }, []);

    // Sync back to storage when atoms change (only after hydration)
    useEffect(() => {
        if (!isHydrated) return;
        chrome.storage.local.set({ symbolLists });
    }, [symbolLists, isHydrated]);

    useEffect(() => {
        if (!isHydrated) return;
        // Allow null to be saved to clear selection
        chrome.storage.local.set({ currentListId });
    }, [currentListId, isHydrated]);

    useEffect(() => {
        if (!isHydrated) return;
        chrome.storage.local.set({ settings });
    }, [settings, isHydrated]);

    useEffect(() => {
        if (!isHydrated) return;
        chrome.storage.local.set({ authUser });
    }, [authUser, isHydrated]);

    return isHydrated;
};
