import { getFunctions, httpsCallable, connectFunctionsEmulator } from 'firebase/functions';
import { getFirebaseApp } from './firebase';

export interface SubscriptionResponse {
    subscriptionId: string;
    shortUrl: string;
    paymentUrl: string;
}

export const startSubscriptionFlow = async () => {
    const app = getFirebaseApp();
    // Region MUST match where functions are deployed (usually us-central1 by default)
    const functions = getFunctions(app, 'us-central1');

    // Connect to emulator for local testing
    // You must run: npm run serve (in functions folder)
    if (window.location.hostname === 'localhost' || true) { // Force enable for testing
        console.log('🔗 Connecting to Functions Emulator');
        connectFunctionsEmulator(functions, "localhost", 5001);
    }

    const createSubscriptionLink = httpsCallable<void, SubscriptionResponse>(
        functions,
        'createSubscriptionLink'
    );

    try {
        const result = await createSubscriptionLink();
        const { paymentUrl } = result.data;

        if (paymentUrl) {
            // Redirect user to Razorpay
            window.open(paymentUrl, '_blank');
            return true;
        } else {
            throw new Error('No payment URL received');
        }
    } catch (error) {
        console.error('Failed to start subscription:', error);
        throw error;
    }
};
