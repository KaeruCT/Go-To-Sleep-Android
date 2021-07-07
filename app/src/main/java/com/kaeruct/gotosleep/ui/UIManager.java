package com.kaeruct.gotosleep.ui;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.res.Resources;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.webkit.WebView;
import android.widget.ProgressBar;

import com.kaeruct.gotosleep.Constants;
import com.kaeruct.gotosleep.R;

import java.io.BufferedReader;
import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.lang.reflect.Field;
import java.lang.reflect.Modifier;
import java.nio.charset.StandardCharsets;

public class UIManager {
    private final Activity activity;
    private final WebView webView;
    private final ProgressBar progressSpinner;
    private final ProgressBar progressBar;
    private boolean pageLoaded = false;

    public UIManager(Activity activity) {
        this.activity = activity;
        this.progressBar = (ProgressBar) activity.findViewById(R.id.progressBarBottom);
        this.progressSpinner = (ProgressBar) activity.findViewById(R.id.progressSpinner);
        this.webView = (WebView) activity.findViewById(R.id.webView);
        String html = "";
        try {
            html = replaceStrings(getIndexFile());
        } catch (IOException e) {
            // ignore
        }
        webView.loadDataWithBaseURL("file:///android_asset/", html, "text/html", "utf-8", null);
    }

    private String getIndexFile() throws IOException {
        StringBuilder sb = new StringBuilder();
        BufferedReader br = null;
        try {
            InputStream is = activity.getAssets().open("index.html");
            br = new BufferedReader(new InputStreamReader(is, StandardCharsets.UTF_8 ));
            String str;
            while ((str = br.readLine()) != null) {
                sb.append(str);
            }
        } finally {
            if (br != null) {
                br.close();
            }
        }
        return sb.toString();
    }

    private String replaceStrings(String content) {
        for (Field field : R.string.class.getDeclaredFields()) {
            if (Modifier.isStatic(field.getModifiers()) && !Modifier.isPrivate(field.getModifiers()) && field.getType().equals(int.class))  {
                try {
                    int id = field.getInt(null);
                    String key = field.getName();
                    String value = this.activity.getString(id);
                    content = content.replaceAll("\\{" + key + "\\}", value);
                } catch (IllegalArgumentException e) {
                    // ignore
                } catch (IllegalAccessException e) {
                    // ignore
                }
            }
        }
        return content;
    }

    // Set Loading Progress for ProgressBar
    public void setLoadingProgress(int progress) {
        // set progress in UI
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            progressBar.setProgress(progress, true);
        } else {
            progressBar.setProgress(progress);
        }

        // hide ProgressBar if not applicable
        if (progress >= 0 && progress < 100) {
            progressBar.setVisibility(View.VISIBLE);
        } else {
            progressBar.setVisibility(View.INVISIBLE);
        }

        // get app screen back if loading is almost complete
        if (progress >= Constants.PROGRESS_THRESHOLD && !pageLoaded) {
            setLoading(false);
        }
    }

    // Show loading animation screen while app is loading/caching the first time
    public void setLoading(boolean isLoading) {
        if (isLoading) {
            progressSpinner.setVisibility(View.VISIBLE);
            webView.animate().translationX(Constants.SLIDE_EFFECT).alpha(0.5F).setInterpolator(new AccelerateInterpolator()).start();
        } else {
            webView.setTranslationX(Constants.SLIDE_EFFECT * -1);
            webView.animate().translationX(0).alpha(1F).setInterpolator(new DecelerateInterpolator()).start();
            progressSpinner.setVisibility(View.INVISIBLE);
        }
        pageLoaded = !isLoading;
    }

    // set icon in recent activity view to a white one to be visible in the app bar
    public void changeRecentAppsIcon() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {

            TypedValue typedValue = new TypedValue();
            Resources.Theme theme = activity.getTheme();
            theme.resolveAttribute(R.attr.colorPrimary, typedValue, true);
            int color = typedValue.data;

            ActivityManager.TaskDescription description = new ActivityManager.TaskDescription(
                    activity.getResources().getString(R.string.app_name),
                    null,
                    color
            );
            activity.setTaskDescription(description);
        }
    }
}
