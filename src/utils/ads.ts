import { Capacitor, registerPlugin } from '@capacitor/core';
import type { PluginListenerHandle } from '@capacitor/core';

export interface AdStatus {
  supported: boolean;
  unlocked: boolean;
  privacyOptionsRequired: boolean;
  canRequestAds: boolean;
  busy: boolean;
  testMode: boolean;
}
export interface RewardResult extends AdStatus { earned: boolean; completionId?: string; reason?: string; }
export interface DearliAdsPlugin {
  getStatus(): Promise<AdStatus>;
  requestReward(options: { adultConfirmed: boolean }): Promise<RewardResult>;
  cancelReward(): Promise<void>;
  showPrivacyOptions(): Promise<AdStatus>;
  addListener(event: 'consentChanged' | 'rewardEarned', listener: (status: AdStatus) => void): Promise<PluginListenerHandle>;
  addListener(event: 'adState', listener: (event: { phase: string }) => void): Promise<PluginListenerHandle>;
}
export const nativeAds = registerPlugin<DearliAdsPlugin>('DearliAds');
export const hasNativeAds = () => Capacitor.getPlatform() === 'android' && Capacitor.isPluginAvailable('DearliAds');
export const unavailableAds: AdStatus = { supported: false, unlocked: false, privacyOptionsRequired: false, canRequestAds: false, busy: false, testMode: false };

// IDs stay in native build configuration. No web-controlled production/test overrides.
export const SEAL_COLORS = { wine: '#722d40', sage: '#3b6254', gold: '#886629' } as const;
export type SealColor = keyof typeof SEAL_COLORS;

/** One active request and one UI acknowledgement per native completion. Native owns entitlement. */
export class RewardRequest {
  private active = false;
  private completed = new Set<string>();
  private bridge: Pick<DearliAdsPlugin, 'requestReward'>;
  constructor(bridge: Pick<DearliAdsPlugin, 'requestReward'>) { this.bridge = bridge; }
  async run(adultConfirmed: boolean): Promise<RewardResult | null> {
    if (this.active) return null;
    this.active = true;
    try {
      const result = await this.bridge.requestReward({ adultConfirmed });
      if (result.earned && (!result.completionId || this.completed.has(result.completionId))) return { ...result, earned: false };
      if (result.earned && result.completionId) this.completed.add(result.completionId);
      return result;
    } finally { this.active = false; }
  }
}
