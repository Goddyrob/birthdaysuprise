package net.godswillrobwet.dearli;
import android.os.Bundle;
import com.getcapacitor.BridgeActivity;
public class MainActivity extends BridgeActivity {
    @Override public void onCreate(Bundle savedInstanceState) {
        registerPlugin(DearliAdsPlugin.class);
        if (BuildConfig.DEBUG) {
            try { registerPlugin((Class<? extends com.getcapacitor.Plugin>) Class.forName("net.godswillrobwet.dearli.DearliAdsTestPlugin")); }
            catch (ClassNotFoundException ignored) { /* Debug utility is absent from release source sets. */ }
        }
        super.onCreate(savedInstanceState);
    }
}
