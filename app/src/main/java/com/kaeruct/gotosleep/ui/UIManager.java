package com.kaeruct.gotosleep.ui;

import android.app.Activity;
import android.app.ActivityManager;
import android.content.res.Resources;
import android.graphics.Bitmap;
import android.graphics.BitmapFactory;
import android.os.Build;
import android.util.TypedValue;
import android.view.View;
import android.view.animation.AccelerateInterpolator;
import android.view.animation.DecelerateInterpolator;
import android.webkit.WebView;
import android.widget.LinearLayout;
import android.widget.ProgressBar;

import com.kaeruct.gotosleep.Constants;
import com.kaeruct.gotosleep.R;

public class UIManager {
    // Instance variables
    private Activity activity;
    private WebView webView;
    private ProgressBar progressSpinner;
    private ProgressBar progressBar;
    private boolean pageLoaded = false;

    public UIManager(Activity activity) {
        this.activity = activity;
        this.progressBar = (ProgressBar) activity.findViewById(R.id.progressBarBottom);
        this.progressSpinner = (ProgressBar) activity.findViewById(R.id.progressSpinner);
        this.webView = (WebView) activity.findViewById(R.id.webView);
        webView.loadUrl(Constants.WEBAPP_URL);
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
