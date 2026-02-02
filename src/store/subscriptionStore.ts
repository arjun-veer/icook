import { create } from 'zustand';

interface SubscriptionState {
  isPro: boolean;
  loading: boolean;
  checkSubscription: () => Promise<void>;
  setProStatus: (isPro: boolean) => void;
}

export const useSubscriptionStore = create<SubscriptionState>((set) => ({
  isPro: false,
  loading: false,

  checkSubscription: async () => {
    set({ loading: true });
    try {
      const { revenueCatService } = await import('@/services/revenuecat');
      const isPro = await revenueCatService.checkSubscriptionStatus();
      set({ isPro, loading: false });
    } catch (error) {
      console.error('Check subscription error:', error);
      set({ loading: false });
    }
  },

  setProStatus: (isPro: boolean) => {
    set({ isPro });
  },
}));
