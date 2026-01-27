import React from 'react';
import { PricingOverlay } from './PricingOverlay';

export const TrialExpiredScreen = () => {
    return (
        <div className="w-full h-full bg-background">
            <PricingOverlay isBlocked={true} />
        </div>
    );
};
