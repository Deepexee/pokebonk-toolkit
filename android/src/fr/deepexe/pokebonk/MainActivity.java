package fr.deepexe.pokebonk;

import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageInfo;
import android.graphics.Color;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.view.KeyEvent;
import android.view.View;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import org.json.JSONObject;

import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;

public class MainActivity extends Activity {

    private static final String HOME = "https://pokebonk.com";
    private static final String UPDATE_URL = "https://pokebonk.deepexe.fr/update/latest.json";
    private static final String[] TOOLKIT_FILES = {"hub.js", "typedex.json", "maps.json", "rpc_index.json"};

    private WebView web;
    private volatile JSONObject apkUpdate;

    @Override
    protected void onCreate(Bundle state) {
        super.onCreate(state);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);
        if (Build.VERSION.SDK_INT >= 28) {
            getWindow().getAttributes().layoutInDisplayCutoutMode =
                    WindowManager.LayoutParams.LAYOUT_IN_DISPLAY_CUTOUT_MODE_SHORT_EDGES;
        }

        web = new WebView(this);
        web.setBackgroundColor(Color.rgb(26, 22, 48));
        setContentView(web);
        hideSystemBars();

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setUseWideViewPort(true);
        s.setLoadWithOverviewMode(true);
        s.setTextZoom(100);
        s.setUserAgentString(s.getUserAgentString() + " PokeBonkToolkit/" + versionName());

        CookieManager.getInstance().setAcceptCookie(true);
        CookieManager.getInstance().setAcceptThirdPartyCookies(web, true);

        web.addJavascriptInterface(new Bridge(), "PBAndroid");
        web.setWebChromeClient(new WebChromeClient());
        web.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (isGame(u)) return false;
                openInBrowser(u);
                return true;
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                if (isGame(Uri.parse(url))) view.evaluateJavascript(buildInject(), null);
            }
        });

        checkUpdates();
        if (state != null) web.restoreState(state);
        else web.loadUrl(HOME);
    }

    private static boolean isGame(Uri u) {
        String h = u.getHost();
        return h != null && (h.equals("pokebonk.com") || h.endsWith(".pokebonk.com"));
    }

    private void openInBrowser(Uri u) {
        try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
    }

    private static byte[] readAll(InputStream in) throws Exception {
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        byte[] buf = new byte[16384];
        int n;
        while ((n = in.read(buf)) > 0) out.write(buf, 0, n);
        return out.toByteArray();
    }

    private String asset(String name) {
        try (InputStream in = getAssets().open(name)) {
            return new String(readAll(in), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private static String readFile(File f) {
        try (InputStream in = new FileInputStream(f)) {
            return new String(readAll(in), StandardCharsets.UTF_8);
        } catch (Exception e) {
            return "";
        }
    }

    private static void writeFile(File f, byte[] data) throws Exception {
        try (FileOutputStream out = new FileOutputStream(f)) {
            out.write(data);
        }
    }

    private static String sha256(byte[] data) throws Exception {
        StringBuilder hex = new StringBuilder();
        for (byte b : MessageDigest.getInstance("SHA-256").digest(data)) hex.append(String.format("%02x", b));
        return hex.toString();
    }

    private static String sha256(File f) {
        try (InputStream in = new FileInputStream(f)) {
            return sha256(readAll(in));
        } catch (Exception e) {
            return "";
        }
    }

    private int versionCode() {
        try {
            PackageInfo p = getPackageManager().getPackageInfo(getPackageName(), 0);
            return Build.VERSION.SDK_INT >= 28 ? (int) p.getLongVersionCode() : p.versionCode;
        } catch (Exception e) {
            return 0;
        }
    }

    private String versionName() {
        try {
            return getPackageManager().getPackageInfo(getPackageName(), 0).versionName;
        } catch (Exception e) {
            return "?";
        }
    }

    private int bundledToolkit() {
        try {
            return new JSONObject(asset("version.json")).optInt("toolkit", 0);
        } catch (Exception e) {
            return 0;
        }
    }

    private File toolkitDir() { return new File(getFilesDir(), "toolkit"); }

    private JSONObject installedToolkit() {
        try {
            JSONObject m = new JSONObject(readFile(new File(toolkitDir(), "manifest.json")));
            if (m.optInt("build") <= bundledToolkit() || m.optInt("min_android") > versionCode()) return null;
            JSONObject files = m.getJSONObject("files");
            for (String name : TOOLKIT_FILES) {
                File f = new File(toolkitDir(), name);
                if (!f.exists() || !sha256(f).equals(files.getJSONObject(name).getString("sha256"))) return null;
            }
            return m;
        } catch (Exception e) {
            return null;
        }
    }

    private String buildInject() {
        JSONObject update = installedToolkit();
        int build = update != null ? update.optInt("build") : bundledToolkit();
        String typedex = update != null ? readFile(new File(toolkitDir(), "typedex.json")) : asset("typedex.json");
        String maps = update != null ? readFile(new File(toolkitDir(), "maps.json")) : asset("maps.json");
        String hub = update != null ? readFile(new File(toolkitDir(), "hub.js")) : asset("hub.js");
        String app = "{\"version\":" + JSONObject.quote(versionName()) + ",\"toolkit\":" + build + ",\"platform\":\"android\"}";
        return "window.__PBApp=" + app + ";"
                + "window.__PBTypedex=" + (typedex.isEmpty() ? "null" : typedex) + ";"
                + "window.__PBMaps=" + (maps.isEmpty() ? "null" : maps) + ";\n"
                + asset("android_shim.js") + "\n" + hub;
    }

    private static byte[] httpGet(String url) throws Exception {
        HttpURLConnection c = (HttpURLConnection) new URL(url).openConnection();
        c.setConnectTimeout(15000);
        c.setReadTimeout(30000);
        c.setRequestProperty("Cache-Control", "no-cache");
        try (InputStream in = c.getInputStream()) {
            return readAll(in);
        } finally {
            c.disconnect();
        }
    }

    private void checkUpdates() {
        new Thread(() -> {
            try {
                JSONObject latest = new JSONObject(new String(
                        httpGet(UPDATE_URL + "?t=" + System.currentTimeMillis()), StandardCharsets.UTF_8));
                JSONObject toolkit = latest.optJSONObject("toolkit");
                if (toolkit != null) updateToolkit(toolkit);
                JSONObject apk = latest.optJSONObject("android");
                if (apk != null && apk.optInt("code") > versionCode()) apkUpdate = apk;
            } catch (Exception ignored) { }
        }).start();
    }

    private void updateToolkit(JSONObject t) throws Exception {
        JSONObject installed = installedToolkit();
        int current = installed != null ? installed.optInt("build") : bundledToolkit();
        if (t.optInt("build") <= current || t.optInt("min_android") > versionCode()) return;
        File dir = toolkitDir();
        File staging = new File(dir, "staging");
        if (!staging.isDirectory() && !staging.mkdirs()) return;
        JSONObject files = t.getJSONObject("files");
        for (String name : TOOLKIT_FILES) {
            byte[] data = httpGet(t.getString("base") + name);
            if (!sha256(data).equals(files.getJSONObject(name).getString("sha256"))) return;
            writeFile(new File(staging, name), data);
        }
        for (String name : TOOLKIT_FILES) {
            File target = new File(dir, name);
            if (target.exists() && !target.delete()) return;
            if (!new File(staging, name).renameTo(target)) return;
        }
        JSONObject manifest = new JSONObject();
        manifest.put("build", t.optInt("build"));
        manifest.put("min_android", t.optInt("min_android"));
        manifest.put("files", files);
        writeFile(new File(dir, "manifest.json"), manifest.toString().getBytes(StandardCharsets.UTF_8));
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.statusBars() | WindowInsets.Type.navigationBars());
                c.setSystemBarsBehavior(WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_STABLE
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN);
        }
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    @Override
    public void onBackPressed() {
        web.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_DOWN, KeyEvent.KEYCODE_ESCAPE));
        web.dispatchKeyEvent(new KeyEvent(KeyEvent.ACTION_UP, KeyEvent.KEYCODE_ESCAPE));
    }

    @Override
    protected void onPause() {
        web.onPause();
        CookieManager.getInstance().flush();
        super.onPause();
    }

    @Override
    protected void onResume() {
        super.onResume();
        web.onResume();
        hideSystemBars();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        web.saveState(out);
    }

    private class Bridge {
        private File runsFile() { return new File(getFilesDir(), "runs.json"); }

        @JavascriptInterface
        public boolean saveRuns(String text) {
            File f = runsFile();
            File tmp = new File(f.getPath() + ".tmp");
            try {
                writeFile(tmp, text.getBytes(StandardCharsets.UTF_8));
            } catch (Exception e) {
                return false;
            }
            return tmp.renameTo(f);
        }

        @JavascriptInterface
        public String loadRuns() {
            File f = runsFile();
            if (!f.exists()) return "[]";
            String text = readFile(f);
            return text.isEmpty() ? "[]" : text;
        }

        @JavascriptInterface
        public void shareRuns(String text) {
            Intent send = new Intent(Intent.ACTION_SEND);
            send.setType("application/json");
            send.putExtra(Intent.EXTRA_SUBJECT, "pokebonk-runs.json");
            send.putExtra(Intent.EXTRA_TEXT, text);
            startActivity(Intent.createChooser(send, "PokéBonk runs"));
        }

        @JavascriptInterface
        public String updateInfo() {
            JSONObject apk = apkUpdate;
            if (apk == null) return "null";
            return "{\"version\":" + JSONObject.quote(apk.optString("name")) + ",\"action\":\"download\"}";
        }

        @JavascriptInterface
        public void applyUpdate() {
            JSONObject apk = apkUpdate;
            if (apk != null) runOnUiThread(() -> openInBrowser(Uri.parse(apk.optString("url"))));
        }
    }
}
