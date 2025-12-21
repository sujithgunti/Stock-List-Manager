import {
    doc,
    setDoc,
    deleteDoc
} from 'firebase/firestore';
import { getFirebaseDb } from './firebase';
import { SymbolList } from '../types';

// Helper to convert Firestore Timestamps to Dates
export const convertTimestamps = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj === 'object' && 'seconds' in obj && 'nanoseconds' in obj) {
        return new Date(obj.seconds * 1000);
    }
    if (Array.isArray(obj)) return obj.map(convertTimestamps);
    if (typeof obj === 'object') {
        const res: any = {};
        for (const k in obj) {
            res[k] = convertTimestamps(obj[k]);
        }
        return res;
    }
    return obj;
};

// Helper to remove undefined values (which Firestore rejects)
export const sanitizeForFirestore = (obj: any): any => {
    if (obj === undefined) return undefined;
    if (obj === null) return null;
    if (obj instanceof Date) return obj;
    if (Array.isArray(obj)) return obj.map(v => sanitizeForFirestore(v) ?? null);
    if (typeof obj === 'object') {
        const res: any = {};
        for (const k in obj) {
            const val = sanitizeForFirestore(obj[k]);
            if (val !== undefined) res[k] = val;
        }
        return res;
    }
    return obj;
};

export const saveListToFirestore = async (userId: string, list: SymbolList) => {
    if (!userId) return;
    try {
        const db = getFirebaseDb();
        const listRef = doc(db, 'users', userId, 'lists', list.id);

        // Sanitize to remove undefined fields
        const cleanList = sanitizeForFirestore(list);
        await setDoc(listRef, cleanList, { merge: true });
        console.log('☁️ Saved list to Firestore:', list.name);
    } catch (e) {
        console.error('Failed to save list to cloud:', e);
    }
};

export const deleteListFromFirestore = async (userId: string, listId: string) => {
    if (!userId) return;
    try {
        const db = getFirebaseDb();
        await deleteDoc(doc(db, 'users', userId, 'lists', listId));
        console.log('☁️ Deleted list from Firestore:', listId);
    } catch (e) {
        console.error('Failed to delete list from cloud:', e);
    }
};
