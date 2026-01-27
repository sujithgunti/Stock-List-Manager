import { atom } from 'jotai';
import { useAtom, useAtomValue, useSetAtom } from 'jotai';
import { useEffect, useRef } from 'react';
import {
    collection,
    onSnapshot,
    doc,
    setDoc
} from 'firebase/firestore';
import { getFirebaseDb } from '../lib/firebase';
import {
    convertTimestamps,
    saveListToFirestore,
    deleteListFromFirestore
} from '../lib/firestore-utils';
import {
    authUserAtom,
    symbolListsAtom,
    isLoadingAtom,
    errorAtom,
    successMessageAtom
} from './index';
import { SymbolList, PREDEFINED_LISTS } from '../types';

// ==========================================
// Types
// ==========================================
type SyncStatus = 'idle' | 'syncing' | 'error' | 'synced';

// ==========================================
// Atoms
// ==========================================
export const syncStatusAtom = atom<SyncStatus>('idle');

// ==========================================
// Hooks
// ==========================================

// 1. User Profile Sync (Always Active)
// Listens for 'isPremium' status changes
export const useUserProfileSync = () => {
    const [authUser, setAuthUser] = useAtom(authUserAtom);

    useEffect(() => {
        if (!authUser?.uid) return;

        const db = getFirebaseDb();
        const userDocRef = doc(db, 'users', authUser.uid);

        console.log('👤 Listening to User Profile:', authUser.uid);

        const unsubscribe = onSnapshot(userDocRef, (docSnapshot) => {
            if (docSnapshot.exists()) {
                const data = docSnapshot.data();
                const isPremium = data.isPremium === true;
                const trialStartDate = data.trialStartDate;

                // Only update if changed to avoid loops
                if (authUser.isPremium !== isPremium || authUser.trialStartDate !== trialStartDate) {
                    console.log('💎 User Profile Updated (Premium):', isPremium);
                    setAuthUser((prev) => {
                        if (!prev) return prev;
                        return {
                            ...prev,
                            isPremium,
                            trialStartDate
                        };
                    });
                }
            } else {
                console.log('👤 User Profile does not exist. Creating default profile...');
                // Auto-create profile if missing so fields like isPremium exist
                setDoc(userDocRef, {
                    uid: authUser.uid,
                    email: authUser.email || null,
                    displayName: authUser.displayName || null,
                    isPremium: false,
                    createdAt: new Date(),
                    updatedAt: new Date()
                }, { merge: true }).catch(err => {
                    console.error("❌ Failed to create user profile:", err);
                });
            }
        });

        return () => unsubscribe();
    }, [authUser?.uid, setAuthUser]);
};

// 2. Data Sync (Gated by Premium)
// Only syncs symbol lists if user is Premium
export const useDataSync = () => {
    const authUser = useAtomValue(authUserAtom);
    const [symbolLists, setSymbolLists] = useAtom(symbolListsAtom); // Need value to check for initial upload
    const setSyncStatus = useSetAtom(syncStatusAtom);
    const setError = useSetAtom(errorAtom);

    // Keep ref synced with atom state
    const symbolListsRef = useRef(symbolLists);
    useEffect(() => {
        symbolListsRef.current = symbolLists;
    }, [symbolLists]);

    useEffect(() => {
        // 1. Requirement check: Must be logged in
        if (!authUser?.uid) {
            setSyncStatus('idle');
            return;
        }

        // 2. Freemium Gate: Must be Premium to Sync Lists
        if (!authUser.isPremium) {
            // Explicitly set status to idle if not premium
            if (authUser.isPremium === false) {
                setSyncStatus('idle');
            }
            return;
        }

        console.log('🔄 Starting Firestore Sync for user:', authUser.uid);
        setSyncStatus('syncing');

        const db = getFirebaseDb();
        const userListsRef = collection(db, 'users', authUser.uid, 'lists');

        // 3. Real-time Listener (Read from Cloud)
        const unsubscribe = onSnapshot(
            userListsRef,
            (snapshot) => {
                const cloudLists: SymbolList[] = [];
                snapshot.forEach((doc) => {
                    const data = doc.data();
                    cloudLists.push(convertTimestamps(data) as SymbolList);
                });

                // 4. Deduplicate: Cloud might have duplicates from previous aggressive restores
                // We keep the first one found and delete others
                const uniqueListsMap = new Map<string, SymbolList>();
                const duplicatesToDelete: SymbolList[] = [];

                cloudLists.forEach(list => {
                    const key = list.name; // Dedupe by Name (especially for predefined)
                    if (uniqueListsMap.has(key)) {
                        const existing = uniqueListsMap.get(key)!;
                        // Keep the one with more symbols? Or just the first one?
                        if ((list.symbols?.length || 0) > (existing.symbols?.length || 0)) {
                            duplicatesToDelete.push(existing);
                            uniqueListsMap.set(key, list);
                        } else {
                            duplicatesToDelete.push(list);
                        }
                    } else {
                        uniqueListsMap.set(key, list);
                    }
                });

                // Delete duplicates from cloud to clean up
                duplicatesToDelete.forEach(dup => {
                    console.log('🗑️ Deleting duplicate list from cloud:', dup.name, dup.id);
                    deleteListFromFirestore(authUser.uid, dup.id);
                });

                const uniqueLists = Array.from(uniqueListsMap.values());

                // 5. Merge with Predefined Lists (Restore if missing)
                const mergedLists = [...uniqueLists];
                let listsAdded = false;

                PREDEFINED_LISTS.forEach(def => {
                    const exists = mergedLists.find(l => l.name === def.name && l.isPredefined);
                    if (!exists) {
                        // Create fresh default list
                        const newList: SymbolList = {
                            id: crypto.randomUUID(),
                            name: def.name,
                            color: def.color,
                            isPredefined: true,
                            isFavoriteList: def.isFavoriteList || false,
                            symbols: [],
                            createdAt: new Date(),
                            updatedAt: new Date()
                        };
                        mergedLists.push(newList);
                        saveListToFirestore(authUser.uid, newList);
                        listsAdded = true;
                    }
                });

                if (listsAdded) {
                    console.log('✨ Restored missing default lists');
                }

                if (mergedLists.length > 0) {
                    console.log(`☁️ Received ${mergedLists.length} lists from cloud`);

                    // SMART MERGE: Prevent reverting local changes if cloud is stale
                    // Use ref to get latest local state without stale closure or functional update issues
                    const currentLocalLists = symbolListsRef.current || [];

                    const finalListsMap = new Map<string, SymbolList>();
                    const cloudNamesMap = new Map<string, string>(); // Name -> ID matching

                    // 1. Initialize with Cloud Data (mergedLists)
                    mergedLists.forEach(list => {
                        finalListsMap.set(list.id, list);
                        cloudNamesMap.set(list.name, list.id);
                    });

                    // 2. Merge/Override with Local Data if Local is Newer
                    if (Array.isArray(currentLocalLists)) {
                        currentLocalLists.forEach(localList => {
                            let cloudList = finalListsMap.get(localList.id);

                            // 2a. ID Mismatch Check (Fix for duplicating lists)
                            if (!cloudList && cloudNamesMap.has(localList.name)) {
                                const cloudId = cloudNamesMap.get(localList.name)!;
                                cloudList = finalListsMap.get(cloudId);
                                console.log(`🔗 Linking Local '${localList.name}' (ID: ${localList.id}) to Cloud ID: ${cloudId}`);
                            }

                            if (cloudList) {
                                // Conflict: Both exist. Check timestamps.
                                const localTime = new Date(localList.updatedAt || 0).getTime();
                                const cloudTime = new Date(cloudList.updatedAt || 0).getTime();

                                if (localTime > cloudTime) {
                                    console.log(`⚠️ Conflict: Local '${localList.name}' is newer. Keeping Local content.`);

                                    // If IDs matched, simple override.
                                    // If IDs mismatched, we adopt the Cloud ID for the local content
                                    const merged = { ...localList, id: cloudList.id };

                                    finalListsMap.set(cloudList.id, merged);
                                    // Heal Cloud
                                    saveListToFirestore(authUser.uid, merged);
                                }
                            } else {
                                // Local list exists but not in Cloud/Merged set.
                                // Could be a new list created offline. Keep it and sync it.
                                console.log(`➕ New Local List '${localList.name}' detected. Syncing to Cloud.`);
                                finalListsMap.set(localList.id, localList);
                                saveListToFirestore(authUser.uid, localList);
                            }
                        });
                    }

                    // 3. Convert to Array and Sort
                    const finalLists = Array.from(finalListsMap.values());

                    finalLists.sort((a, b) => {
                        if (a.isFavoriteList !== b.isFavoriteList) {
                            return a.isFavoriteList ? -1 : 1;
                        }
                        if (a.isPredefined !== b.isPredefined) {
                            return a.isPredefined ? -1 : 1;
                        }
                        const dateA = new Date(a.updatedAt || 0).getTime();
                        const dateB = new Date(b.updatedAt || 0).getTime();
                        return dateB - dateA;
                    });

                    setSymbolLists(finalLists);
                }
                setSyncStatus('synced');
            },
            (err) => {
                if (err.code === 'permission-denied') {
                    console.error('🚫 Firestore Permission Error: Check your Security Rules in Firebase Console.');
                } else {
                    console.error('❌ Firestore Sync Error:', err);
                }
                setError('Failed to sync with cloud. Working offline.');
                setSyncStatus('error');
            }
        );

        // Cleanup listener on unmount or logout
        return () => unsubscribe();
    }, [authUser?.uid, authUser?.isPremium]); // Re-run if UID or Premium status changes

    return;
};
