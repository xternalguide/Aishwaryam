package com.aishwaryam.app;

import android.os.Bundle;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebView;
import android.webkit.WebChromeClient;
import android.webkit.WebViewClient;
import android.os.Message;
import android.app.Dialog;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;
import com.getcapacitor.BridgeWebChromeClient;
import android.view.WindowManager;
import android.graphics.Color;
import com.ionicframework.capacitor.Checkout;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        registerPlugin(Checkout.class);
        
        getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        getWindow().setStatusBarColor(Color.parseColor("#4A0E4E"));
        getWindow().getDecorView().setSystemUiVisibility(android.view.View.SYSTEM_UI_FLAG_VISIBLE);
        
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            webView.setFitsSystemWindows(false);
            
            // Enable multiple windows support (required for Razorpay bank authentication/popups)
            webView.getSettings().setSupportMultipleWindows(true);
            webView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
            
            // Enable DOM storage and database on main WebView (CRITICAL for Razorpay session persistence)
            webView.getSettings().setDomStorageEnabled(true);
            webView.getSettings().setDatabaseEnabled(true);
            webView.getSettings().setAllowFileAccess(true);
            webView.getSettings().setAllowContentAccess(true);
            
            // Configure Cookies and Mixed Content on main WebView
            android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
            cookieManager.setAcceptCookie(true);
            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                cookieManager.setAcceptThirdPartyCookies(webView, true);
                webView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
            }
            
            webView.setDownloadListener(new android.webkit.DownloadListener() {
                @Override
                public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                    MainActivity.this.startNativeDownload(url, userAgent, contentDisposition, mimetype);
                }
            });
            
            webView.setWebViewClient(new BridgeWebViewClient(this.getBridge()) {
                @Override
                public boolean shouldOverrideUrlLoading(WebView view, String url) {
                    if (url != null && !url.startsWith("http://") && !url.startsWith("https://")) {
                        try {
                            android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                            view.getContext().startActivity(intent);
                            return true;
                        } catch (Exception e) {
                            return true;
                        }
                    }
                    return super.shouldOverrideUrlLoading(view, url);
                }

                @Override
                public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                        String url = request.getUrl().toString();
                        if (url != null && !url.startsWith("http://") && !url.startsWith("https://")) {
                            try {
                                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                                view.getContext().startActivity(intent);
                                return true;
                            } catch (Exception e) {
                                return true;
                            }
                        }
                    }
                    return super.shouldOverrideUrlLoading(view, request);
                }

                @Override
                public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                    if (request.isForMainFrame()) {
                        view.loadUrl("file:///android_asset/public/offline.html");
                    } else {
                        super.onReceivedError(view, request, error);
                    }
                }

                @SuppressWarnings("deprecation")
                @Override
                public void onReceivedError(WebView view, int errorCode, String description, String failingUrl) {
                    if (failingUrl != null && (failingUrl.equals("https://aishwaryam-web.pages.dev") || failingUrl.equals("https://aishwaryam-web.pages.dev/"))) {
                        view.loadUrl("file:///android_asset/public/offline.html");
                    } else {
                        super.onReceivedError(view, errorCode, description, failingUrl);
                    }
                }
            });

            // Set custom WebChromeClient to handle onCreateWindow
            webView.setWebChromeClient(new BridgeWebChromeClient(this.getBridge()) {
                @Override
                public boolean onCreateWindow(WebView view, boolean isDialog, boolean isUserGesture, Message resultMsg) {
                    // Create new WebView instance for the popup
                    WebView newWebView = new WebView(MainActivity.this);
                    
                    // Enable JavaScript and popup windows
                    newWebView.getSettings().setJavaScriptEnabled(true);
                    newWebView.getSettings().setSupportMultipleWindows(true);
                    newWebView.getSettings().setJavaScriptCanOpenWindowsAutomatically(true);
                    
                    // Enable DOM storage and database (CRITICAL for Razorpay/banking session persistence)
                    newWebView.getSettings().setDomStorageEnabled(true);
                    newWebView.getSettings().setDatabaseEnabled(true);
                    
                    // Allow file and content access
                    newWebView.getSettings().setAllowFileAccess(true);
                    newWebView.getSettings().setAllowContentAccess(true);
                    
                    // Inherit the main WebView's User Agent
                    newWebView.getSettings().setUserAgentString(view.getSettings().getUserAgentString());
                    
                    // Configure Cookies and Mixed Content (CRITICAL for modern 3DS bank pages)
                    android.webkit.CookieManager cookieManager = android.webkit.CookieManager.getInstance();
                    cookieManager.setAcceptCookie(true);
                    if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                        cookieManager.setAcceptThirdPartyCookies(newWebView, true);
                        newWebView.getSettings().setMixedContentMode(android.webkit.WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
                    }
                    
                    // Create a fullscreen dialog to show the new WebView
                    newWebView.setLayoutParams(new android.view.ViewGroup.LayoutParams(
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT,
                        android.view.ViewGroup.LayoutParams.MATCH_PARENT
                    ));
                    newWebView.setBackgroundColor(Color.WHITE);
                    
                    final Dialog dialog = new Dialog(MainActivity.this, android.R.style.Theme_Light_NoTitleBar_Fullscreen);
                    dialog.setContentView(newWebView);
                    dialog.show();

                    newWebView.setWebChromeClient(new WebChromeClient() {
                        @Override
                        public void onCloseWindow(WebView window) {
                            dialog.dismiss();
                        }
                    });
                    
                    newWebView.setDownloadListener(new android.webkit.DownloadListener() {
                        @Override
                        public void onDownloadStart(String url, String userAgent, String contentDisposition, String mimetype, long contentLength) {
                            MainActivity.this.startNativeDownload(url, userAgent, contentDisposition, mimetype);
                            dialog.dismiss();
                        }
                    });
                    
                    newWebView.setWebViewClient(new WebViewClient() {
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, String url) {
                            if (url != null && !url.startsWith("http://") && !url.startsWith("https://")) {
                                try {
                                    android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                                    view.getContext().startActivity(intent);
                                    return true;
                                } catch (Exception e) {
                                    return true;
                                }
                            }
                            return false;
                        }
                        
                        @Override
                        public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                            if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.LOLLIPOP) {
                                String url = request.getUrl().toString();
                                if (url != null && !url.startsWith("http://") && !url.startsWith("https://")) {
                                    try {
                                        android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                                        view.getContext().startActivity(intent);
                                        return true;
                                    } catch (Exception e) {
                                        return true;
                                    }
                                }
                            }
                            return false;
                        }
                    });

                    WebView.WebViewTransport transport = (WebView.WebViewTransport) resultMsg.obj;
                    transport.setWebView(newWebView);
                    resultMsg.sendToTarget();
                    return true;
                }
            });
        }
    }

    private void startNativeDownload(String url, String userAgent, String contentDisposition, String mimetype) {
        try {
            android.app.DownloadManager.Request request = new android.app.DownloadManager.Request(android.net.Uri.parse(url));
            request.setMimeType("application/pdf");
            
            // Extract filename from URL or default
            String transactionId = url.substring(url.lastIndexOf('/') + 1);
            String fileName = "Receipt_" + (transactionId.length() >= 8 ? transactionId.substring(0, 8).toUpperCase() : "Details") + ".pdf";
            
            request.setDescription("Downloading Transaction Receipt...");
            request.setTitle(fileName);
            request.setNotificationVisibility(android.app.DownloadManager.Request.VISIBILITY_VISIBLE_NOTIFY_COMPLETED);
            request.setDestinationInExternalPublicDir(android.os.Environment.DIRECTORY_DOWNLOADS, fileName);
            
            // Allow scanning by media scanner
            request.allowScanningByMediaScanner();
            
            android.app.DownloadManager dm = (android.app.DownloadManager) this.getSystemService(android.content.Context.DOWNLOAD_SERVICE);
            if (dm != null) {
                dm.enqueue(request);
                android.widget.Toast.makeText(this, "Downloading receipt in background...", android.widget.Toast.LENGTH_SHORT).show();
            }
        } catch (Exception e) {
            // Fallback to launching system browser if DownloadManager fails
            try {
                android.content.Intent intent = new android.content.Intent(android.content.Intent.ACTION_VIEW, android.net.Uri.parse(url));
                this.startActivity(intent);
            } catch (Exception ex) {
                android.widget.Toast.makeText(this, "Failed to start download: " + ex.getMessage(), android.widget.Toast.LENGTH_LONG).show();
            }
        }
    }
}
