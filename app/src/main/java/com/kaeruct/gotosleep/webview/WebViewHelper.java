package com.kaeruct.gotosleep.webview;

import android.annotation.TargetApi;
import android.app.Activity;
import android.app.AlertDialog;
import android.content.Intent;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Build;
import android.os.Handler;
import android.os.Message;
import android.webkit.CookieManager;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import com.kaeruct.gotosleep.Constants;
import com.kaeruct.gotosleep.R;
import com.kaeruct.gotosleep.ui.UIManager;

public class WebViewHelper {
    private final Activity activity;
    private final UIManager uiManager;
    private final WebView webView;
    private final WebSettings webSettings;

    public WebViewHelper(Activity activity, UIManager uiManager) {
        this.activity = activity;
        this.uiManager = uiManager;
        this.webView = (WebView) activity.findViewById(R.id.webView);
        this.webSettings = webView.getSettings();
    }

    // handles initial setup of webview
    public void setupWebView() {
        // accept cookies
        CookieManager.getInstance().setAcceptCookie(true);
        // enable JS
        webSettings.setJavaScriptEnabled(true);
        // must be set for our js-popup-blocker:
        webSettings.setSupportMultipleWindows(true);

        // PWA settings
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.KITKAT) {
            webSettings.setDatabasePath(activity.getApplicationContext().getFilesDir().getAbsolutePath());
        }
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.JELLY_BEAN_MR2) {
            webSettings.setAppCacheMaxSize(Long.MAX_VALUE);
        }
        webSettings.setDomStorageEnabled(true);
        webSettings.setAppCachePath(activity.getApplicationContext().getCacheDir().getAbsolutePath());
        webSettings.setAppCacheEnabled(true);

        // enable mixed content mode conditionally
        if (Constants.ENABLE_MIXED_CONTENT
                && Build.VERSION.SDK_INT >= Build.VERSION_CODES.LOLLIPOP) {
            webSettings.setMixedContentMode(WebSettings.MIXED_CONTENT_COMPATIBILITY_MODE);
        }

        // set User Agent
        if (Constants.OVERRIDE_USER_AGENT || Constants.POSTFIX_USER_AGENT) {
            String userAgent = webSettings.getUserAgentString();
            if (Constants.OVERRIDE_USER_AGENT) {
                userAgent = Constants.USER_AGENT;
            }
            if (Constants.POSTFIX_USER_AGENT) {
                userAgent = userAgent + " " + Constants.USER_AGENT_POSTFIX;
            }
            webSettings.setUserAgentString(userAgent);
        }

        // enable HTML5-support
        webView.setWebChromeClient(new WebChromeClient() {
            //simple yet effective redirect/popup blocker
            @Override
            public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                Message href = view.getHandler().obtainMessage();
                view.requestFocusNodeHref(href);
                final String popupUrl = href.getData().getString("url");
                if (popupUrl != null) {
                    //it's null for most rouge browser hijack ads
                    webView.loadUrl(popupUrl);
                    return true;
                }
                return false;
            }

            // update ProgressBar
            @Override
            public void onProgressChanged(WebView view, int newProgress) {
                uiManager.setLoadingProgress(newProgress);
                super.onProgressChanged(view, newProgress);
            }
        });

        // Set up Webview client
        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, Bitmap favicon) {
                super.onPageStarted(view, url, favicon);
                handleUrlLoad(view, url);
            }

            // handle loading error by showing the offline screen
            @Deprecated
            @Override
            public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                if (Build.VERSION.SDK_INT < Build.VERSION_CODES.M) {
                    handleLoadError(errorCode);
                }
            }

            @TargetApi(Build.VERSION_CODES.M)
            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
                    // new API method calls this on every error for each resource.
                    // we only want to interfere if the page itself got problems.
                    String url = request.getUrl().toString();
                    if (view.getUrl().equals(url)) {
                        handleLoadError(error.getErrorCode());
                    }
                }
            }
        });
    }

    // Lifecycle callbacks
    public void onPause() {
        webView.onPause();
    }

    public void onResume() {
        webView.onResume();
    }

    // show "no app found" dialog
    private void showNoAppDialog(Activity thisActivity) {
        new AlertDialog.Builder(thisActivity)
            .setTitle(R.string.noapp_heading)
            .setMessage(R.string.noapp_description)
            .show();
    }
    // handle load errors
    private void handleLoadError(int errorCode) {
        new Handler().postDelayed(new Runnable() {
            @Override
            public void run() {
                goBack();
            }
        }, 100);
    }

    // handle external urls
    private boolean handleUrlLoad(WebView view, String url) {
        // prevent loading content that isn't ours
        if (!url.startsWith("data") && !url.startsWith("file:///android_asset/")) {
            // stop loading
            // stopping only would cause the PWA to freeze, need to reload the app as a workaround
            view.stopLoading();
            view.reload();

            // open external URL in Browser/3rd party apps instead
            try {
                Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                if (intent.resolveActivity(activity.getPackageManager()) != null) {
                    activity.startActivity(intent);
                } else {
                    showNoAppDialog(activity);
                }
            } catch (Exception e) {
                showNoAppDialog(activity);
            }
            // return value for shouldOverrideUrlLoading
            return true;
        } else {
            // let WebView load the page!
            // activate loading animation screen
            uiManager.setLoading(true);
            // return value for shouldOverrideUrlLoading
            return false;
        }
    }

    // handle back button press
    public boolean goBack() {
        if (webView.canGoBack()) {
            webView.goBack();
            return true;
        }
        return false;
    }
}
