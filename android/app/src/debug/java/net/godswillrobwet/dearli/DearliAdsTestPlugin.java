package net.godswillrobwet.dearli;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.google.android.ump.UserMessagingPlatform;
/** Debug source set only: resets SDK test consent, never grants a reward. */
@CapacitorPlugin(name = "DearliAdsTest")
public class DearliAdsTestPlugin extends Plugin {
    @PluginMethod public void resetConsent(PluginCall call) {
        if (!BuildConfig.DEBUG || !getContext().getString(R.string.dearli_admob_app_id).startsWith("ca-app-pub-3940256099942544")) {
            call.reject("Only Google test-ID debug builds support this test utility."); return;
        }
        getActivity().runOnUiThread(() -> { UserMessagingPlatform.getConsentInformation(getContext()).reset(); call.resolve(); });
    }
}
