package net.godswillrobwet.dearli;

import android.content.Context;
import android.content.SharedPreferences;
import android.net.ConnectivityManager;
import android.net.NetworkCapabilities;
import android.os.Handler;
import android.os.Looper;
import android.util.Log;
import androidx.annotation.NonNull;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.libraries.ads.mobile.sdk.MobileAds;
import com.google.android.libraries.ads.mobile.sdk.initialization.InitializationConfig;
import com.google.android.libraries.ads.mobile.sdk.common.AdLoadCallback;
import com.google.android.libraries.ads.mobile.sdk.common.AdRequest;
import com.google.android.libraries.ads.mobile.sdk.common.LoadAdError;
import com.google.android.libraries.ads.mobile.sdk.common.FullScreenContentError;
import com.google.android.libraries.ads.mobile.sdk.rewarded.RewardedAd;
import com.google.android.libraries.ads.mobile.sdk.rewarded.RewardedAdEventCallback;
import com.google.android.ump.ConsentInformation;
import com.google.android.ump.ConsentDebugSettings;
import com.google.android.ump.ConsentRequestParameters;
import com.google.android.ump.UserMessagingPlatform;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/** Creator-only, opt-in, one-shot rewarded placement. No web-provided ad IDs. */
@CapacitorPlugin(name = "DearliAds")
public class DearliAdsPlugin extends Plugin {
    private final Handler main = new Handler(Looper.getMainLooper());
    private SharedPreferences preferences;
    private ConsentInformation consent;
    private boolean consentAttempted, consentUpdating, sdkInitialized, showing, destroyed, privacyShowing;
    private final List<Runnable> consentWaiters = new ArrayList<>();
    private PluginCall pending;
    private RewardSession session;
    private RewardedAd ad;
    private Runnable timeout;

    @Override public void load() {
        preferences = getContext().getSharedPreferences("dearli_creator_rewards", Context.MODE_PRIVATE);
        consent = UserMessagingPlatform.getConsentInformation(getContext());
        // Loading the bridge does not initialize MobileAds, request ads, or show consent.
    }

    private void ui(Runnable task) { main.post(() -> { if (!destroyed) task.run(); }); }
    private boolean online() {
        ConnectivityManager manager = (ConnectivityManager) getContext().getSystemService(Context.CONNECTIVITY_SERVICE);
        NetworkCapabilities network = manager.getNetworkCapabilities(manager.getActiveNetwork());
        return network != null && network.hasCapability(NetworkCapabilities.NET_CAPABILITY_INTERNET) && network.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED);
    }
    private boolean unlocked() { return preferences.getBoolean("seal_palette", false); }
    private boolean privacyRequired() {
        return consent.getPrivacyOptionsRequirementStatus() == ConsentInformation.PrivacyOptionsRequirementStatus.REQUIRED;
    }
    private JSObject state() {
        JSObject value = new JSObject();
        value.put("supported", true); value.put("unlocked", unlocked());
        value.put("privacyOptionsRequired", privacyRequired());
        value.put("canRequestAds", consent.canRequestAds());
        value.put("busy", pending != null || privacyShowing); value.put("testMode", BuildConfig.DEBUG);
        if (BuildConfig.DEBUG) { value.put("earnedCount", preferences.getInt("earned_count", 0)); value.put("online", online()); }
        return value;
    }
    private void consentChanged() { notifyListeners("consentChanged", state()); }
    private void stage(String phase) {
        JSObject event = new JSObject(); event.put("phase", phase);
        notifyListeners("adState", event);
        if (BuildConfig.DEBUG) Log.i("DearliAds", "phase=" + phase + " testMode=true");
    }
    private void updateConsent(Runnable continuation) {
        if (consentAttempted && !consentUpdating) { continuation.run(); return; }
        consentWaiters.add(continuation);
        if (consentUpdating) return;
        consentUpdating = true;
        ConsentRequestParameters.Builder builder = new ConsentRequestParameters.Builder().setTagForUnderAgeOfConsent(false);
        // Explicit, local debug configuration only. Release resources are always empty.
        if (BuildConfig.DEBUG && !getContext().getString(R.string.dearli_ump_test_device).isEmpty()) {
            ConsentDebugSettings.Builder debug = new ConsentDebugSettings.Builder(getContext())
                .addTestDeviceHashedId(getContext().getString(R.string.dearli_ump_test_device));
            if ("EEA".equals(getContext().getString(R.string.dearli_ump_geography)))
                debug.setDebugGeography(ConsentDebugSettings.DebugGeography.DEBUG_GEOGRAPHY_EEA);
            builder.setConsentDebugSettings(debug.build());
        }
        ConsentRequestParameters parameters = builder.build();
        consent.requestConsentInfoUpdate(getActivity(), parameters,
            () -> ui(this::finishConsentUpdate),
            error -> ui(() -> {
                if (BuildConfig.DEBUG) Log.i("DearliAds", "consent_update_error=" + error.getErrorCode());
                finishConsentUpdate(); // canRequestAds remains authoritative, including cached consent.
                consentAttempted = false; // An offline attempt must not prevent a later retry.
            }));
    }
    private void finishConsentUpdate() {
        consentAttempted = true; consentUpdating = false;
        List<Runnable> waiting = new ArrayList<>(consentWaiters); consentWaiters.clear();
        consentChanged();
        for (Runnable task : waiting) task.run();
    }
    @PluginMethod public void getStatus(PluginCall call) {
        ui(() -> {
            if (preferences.getBoolean("adult_opt_in", false)) updateConsent(() -> call.resolve(state()));
            else call.resolve(state());
        });
    }
    private boolean current(RewardSession value) { return !destroyed && pending != null && session == value; }
    private void finish(RewardSession value, String reason) {
        if (!current(value)) return;
        boolean earned = value.isEarned(); value.close();
        if (timeout != null) main.removeCallbacks(timeout);
        PluginCall call = pending; pending = null; session = null; ad = null; showing = false;
        JSObject result = state(); result.put("earned", earned);
        result.put("completionId", earned ? value.id : ""); result.put("reason", reason);
        stage("idle"); consentChanged(); call.resolve(result);
    }
    @PluginMethod public void requestReward(PluginCall call) {
        ui(() -> {
            if (pending != null || privacyShowing) { JSObject r = state(); r.put("earned", false); r.put("reason", "busy"); call.resolve(r); return; }
            if (unlocked()) { JSObject r = state(); r.put("earned", false); r.put("reason", "already_unlocked"); call.resolve(r); return; }
            if (!Boolean.TRUE.equals(call.getBoolean("adultConfirmed", false))) {
                JSObject r = state(); r.put("earned", false); r.put("reason", "adult_confirmation_required"); call.resolve(r); return;
            }
            if (!online()) { JSObject r = state(); r.put("earned", false); r.put("reason", "offline"); call.resolve(r); return; }
            preferences.edit().putBoolean("adult_opt_in", true).apply();
            RewardSession value = new RewardSession(UUID.randomUUID().toString()); session = value; pending = call;
            timeout = () -> finish(value, "unavailable"); main.postDelayed(timeout, 45000);
            stage("consent");
            updateConsent(() -> {
                if (!current(value)) return;
                if (consent.getConsentStatus() != ConsentInformation.ConsentStatus.REQUIRED) {
                    if (consent.canRequestAds()) initializeAndLoad(value);
                    else finish(value, "consent_unavailable");
                    return;
                }
                // Load separately so a cancelled creator request cannot present a late form.
                UserMessagingPlatform.loadConsentForm(getContext(), form -> ui(() -> {
                    if (!current(value)) return;
                    // Never rush a person's privacy decision with the network-load timeout.
                    main.removeCallbacks(timeout);
                    form.show(getActivity(), error -> ui(() -> {
                        consentChanged();
                        if (!current(value)) return;
                        if (!consent.canRequestAds()) { finish(value, "consent_unavailable"); return; }
                        main.postDelayed(timeout, 45000);
                        initializeAndLoad(value);
                    }));
                }), error -> ui(() -> finish(value, "consent_unavailable")));
            });
        });
    }
    private void initializeAndLoad(RewardSession value) {
        if (!current(value)) return;
        if (sdkInitialized) { loadAd(value); return; }
        stage("initializing");
        String appId = getContext().getString(R.string.dearli_admob_app_id);
        new Thread(() -> {
            try {
                // Next-Gen SDK requires initialization on a background thread.
                MobileAds.initialize(getContext().getApplicationContext(), new InitializationConfig.Builder(appId).build(), status -> {});
                ui(() -> { sdkInitialized = true; if (current(value)) loadAd(value); });
            } catch (Exception ignored) { ui(() -> finish(value, "unavailable")); }
        }, "DearliAdsInit").start();
    }
    private void loadAd(RewardSession value) {
        if (!current(value) || !consent.canRequestAds()) { finish(value, "consent_unavailable"); return; }
        stage("loading");
        RewardedAd.load(new AdRequest.Builder(getContext().getString(R.string.dearli_admob_rewarded_id)).build(),
            new AdLoadCallback<RewardedAd>() {
                @Override public void onAdLoaded(@NonNull RewardedAd loaded) { ui(() -> present(value, loaded)); }
                @Override public void onAdFailedToLoad(@NonNull LoadAdError error) {
                    ui(() -> { if (BuildConfig.DEBUG) Log.i("DearliAds", "load_error=" + error.getCode()); finish(value, "unavailable"); });
                }
            });
    }
    private void present(RewardSession value, RewardedAd loaded) {
        if (!current(value)) return;
        if (!consent.canRequestAds() || getActivity().isFinishing()) { finish(value, "unavailable"); return; }
        ad = loaded;
        loaded.setAdEventCallback(new RewardedAdEventCallback() {
            @Override public void onAdShowedFullScreenContent() { ui(() -> { if (current(value)) { showing = true; main.removeCallbacks(timeout); stage("showing"); } }); }
            @Override public void onAdDismissedFullScreenContent() { ui(() -> finish(value, value.isEarned() ? "earned" : "dismissed")); }
            @Override public void onAdFailedToShowFullScreenContent(@NonNull FullScreenContentError error) { ui(() -> finish(value, "unavailable")); }
        });
        try {
            loaded.show(getActivity(), reward -> ui(() -> {
                // This callback is the ONLY entitlement-granting path. Dismissal never grants.
                if (!current(value) || !value.earn()) return;
                preferences.edit().putBoolean("seal_palette", true)
                    .putInt("earned_count", preferences.getInt("earned_count", 0) + 1)
                    .putString("last_completion", value.id).apply();
                JSObject event = state(); event.put("completionId", value.id);
                notifyListeners("rewardEarned", event);
                if (BuildConfig.DEBUG) Log.i("DearliAds", "earned_callback_granted_once");
            }));
        } catch (Exception ignored) { finish(value, "unavailable"); }
    }
    @PluginMethod public void cancelReward(PluginCall call) {
        ui(() -> { if (session != null && !showing) finish(session, "cancelled"); call.resolve(); });
    }
    @PluginMethod public void showPrivacyOptions(PluginCall call) {
        ui(() -> {
            if (pending != null || privacyShowing) { call.reject("Finish or close the optional ad first."); return; }
            if (!privacyRequired()) { call.resolve(state()); return; }
            privacyShowing = true;
            UserMessagingPlatform.showPrivacyOptionsForm(getActivity(), error -> ui(() -> {
                privacyShowing = false;
                consentChanged();
                if (error == null) call.resolve(state()); else call.reject("Privacy choices are unavailable. Please try again later.");
            }));
        });
    }
    @Override protected void handleOnDestroy() {
        if (session != null) finish(session, "interrupted");
        destroyed = true; if (timeout != null) main.removeCallbacks(timeout);
        consentWaiters.clear(); ad = null;
    }
}
