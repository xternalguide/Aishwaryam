# System Patterns

## Global Mobile Layout & Header Rule

To guarantee a consistent layout and prevent header overlapping (content sliding underneath the header or status bar overlapping the top bar), all main screens must strictly adhere to the following UI structure rule:

1. **Scaffold Container**: Every top-level page in the application MUST use the Material 3 `Scaffold` component as the root wrapper. 
2. **Top Bar Definition**: The header navigation MUST be assigned exclusively to the `topBar` property of the `Scaffold`. Do not define the top bar inside the generic `content` body.
3. **Strict Content Padding**: The `PaddingValues` block supplied by the `Scaffold`'s trailing lambda MUST be applied to the topmost container inside the content section using `Modifier.padding(paddingValues)`. This is critical to ensure that page content begins cleanly underneath the header.
4. **Header Construction**: For custom headers that draw edge-to-edge (like `DashboardTopBar`), explicitly add `Modifier.statusBarsPadding()` to the header container to prevent the system status bar from overlapping the interactive header icons. The header MUST also feature the global notification icon and unread badge.

### Example Implementation

```kotlin
@Composable
fun StandardScreen() {
    Scaffold(
        topBar = { 
            GlobalTopBar(
                title = "Page Title", 
                unreadCount = 3 
            ) 
        }
    ) { paddingValues ->
        // The root container of the screen content MUST apply the paddingValues
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Screen content goes here.
            // It will safely scroll underneath the topBar without overlapping.
        }
    }
}
```

By strictly adhering to these rules, the layout engine correctly resolves `WindowInsets`, preventing any edge-to-edge overlap bugs across the system.
