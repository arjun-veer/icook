import Purchases, { PurchasesOffering } from 'react-native-purchases';
import { Platform } from 'react-native';
import ENV from '@/config/env';
import { ENTITLEMENT_ID } from '@/constants/app';

export class RevenueCatService {
  private static instance: RevenueCatService;

  private constructor() {}

  static getInstance(): RevenueCatService {
    if (!RevenueCatService.instance) {
      RevenueCatService.instance = new RevenueCatService();
    }
    return RevenueCatService.instance;
  }

  async initialize(userId: string): Promise<void> {
    if (Platform.OS === 'web') {
      console.log('RevenueCat not supported on web');
      return;
    }

    try {
      const apiKey = Platform.OS === 'ios' 
        ? ENV.REVENUECAT_API_KEY_IOS 
        : ENV.REVENUECAT_API_KEY_ANDROID;

      if (!apiKey) {
        console.warn('RevenueCat API key not found');
        return;
      }

      Purchases.configure({ apiKey });
      await Purchases.logIn(userId);
    } catch (error) {
      console.error('RevenueCat initialization error:', error);
    }
  }

  async getOfferings(): Promise<PurchasesOffering | null> {
    if (Platform.OS === 'web') {
      return null;
    }

    try {
      const offerings = await Purchases.getOfferings();
      return offerings.current;
    } catch (error) {
      console.error('Get offerings error:', error);
      return null;
    }
  }

  async purchasePackage(packageId: string): Promise<boolean> {
    if ((Platform.OS as string) === 'web') {
      console.warn('Purchases not supported on web');
      return false;
    }

    try {
      const offerings = await this.getOfferings();
      const packageToPurchase = offerings?.availablePackages.find(
        pkg => pkg.identifier === packageId
      );

      if (!packageToPurchase) {
        throw new Error('Package not found');
      }

      const { customerInfo } = await Purchases.purchasePackage(packageToPurchase);
      return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      console.error('Purchase error:', error);
    if (Platform.OS === 'web') {
      return false;
    }

      return false;
    }
  }

  async restorePurchases(): Promise<boolean> {
    try {
    if (Platform.OS === 'web') {
      return false;
    }

      const customerInfo = await Purchases.restorePurchases();
      return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      console.error('Restore purchases error:', error);
      return false;
    }
  }

  async checkSubscriptionStatus(): Promise<boolean> {
    if ((Platform.OS as string) === 'web') {
      return false;
    }

    try {
      const customerInfo = await Purchases.getCustomerInfo();
      return customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    } catch (error) {
      console.error('Check subscription error:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    if ((Platform.OS as string) === 'web') {
      return;
    }

    try {
      await Purchases.logOut();
    } catch (error) {
      console.error('RevenueCat logout error:', error);
    }
  }
}

export const revenueCatService = RevenueCatService.getInstance();
