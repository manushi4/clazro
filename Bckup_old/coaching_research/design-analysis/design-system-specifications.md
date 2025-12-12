# Design System Specifications - Coaching Management Platform

## 1. Design Tokens & Foundation

### 1.1 Color System

#### Primary Palette
```kotlin
object PrimaryColors {
    val Primary50 = Color(0xFFEFEBFF)
    val Primary100 = Color(0xFFE0D2FF)
    val Primary200 = Color(0xFFC4A6FF)
    val Primary300 = Color(0xFFA879FF)
    val Primary400 = Color(0xFF8C4DFF)
    val Primary500 = Color(0xFF6750A4)  // Main brand color
    val Primary600 = Color(0xFF5A47A0)
    val Primary700 = Color(0xFF4E3D9C)
    val Primary800 = Color(0xFF423398)
    val Primary900 = Color(0xFF362994)
}
```

#### Semantic Color Mapping
```kotlin
object SemanticColors {
    // Success States
    val Success = Color(0xFF4CAF50)
    val SuccessLight = Color(0xFF81C784)
    val SuccessDark = Color(0xFF388E3C)
    
    // Warning States
    val Warning = Color(0xFFFF9800)
    val WarningLight = Color(0xFFFFB74D)
    val WarningDark = Color(0xFFF57C00)
    
    // Error States
    val Error = Color(0xFFF44336)
    val ErrorLight = Color(0xFFE57373)
    val ErrorDark = Color(0xFFD32F2F)
    
    // Info States
    val Info = Color(0xFF2196F3)
    val InfoLight = Color(0xFF64B5F6)
    val InfoDark = Color(0xFF1976D2)
    
    // Role-based Colors
    val StudentAccent = Color(0xFF6200EA)
    val TeacherAccent = Color(0xFF00695C)
    val ParentAccent = Color(0xFFE65100)
    val AdminAccent = Color(0xFF1565C0)
}
```

#### Usage Guidelines
```kotlin
@Composable
fun ColorUsageExample() {
    // DO: Use semantic colors for states
    Text(
        text = "Assignment Completed",
        color = SemanticColors.Success
    )
    
    // DON'T: Use arbitrary colors
    Text(
        text = "Assignment Completed",
        color = Color.Green // Avoid
    )
}
```

### 1.2 Typography System

#### Font Specifications
```kotlin
val CoachingFontFamily = FontFamily(
    Font(R.font.roboto_regular, FontWeight.Normal),
    Font(R.font.roboto_medium, FontWeight.Medium),
    Font(R.font.roboto_bold, FontWeight.Bold)
)

object TypographyScale {
    val DisplayLarge = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 57.sp,
        lineHeight = 64.sp,
        letterSpacing = (-0.25).sp
    )
    
    val DisplayMedium = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 45.sp,
        lineHeight = 52.sp,
        letterSpacing = 0.sp
    )
    
    val HeadlineLarge = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 32.sp,
        lineHeight = 40.sp,
        letterSpacing = 0.sp
    )
    
    val HeadlineMedium = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 28.sp,
        lineHeight = 36.sp,
        letterSpacing = 0.sp
    )
    
    val TitleLarge = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 22.sp,
        lineHeight = 28.sp,
        letterSpacing = 0.sp
    )
    
    val TitleMedium = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    )
    
    val BodyLarge = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 16.sp,
        lineHeight = 24.sp,
        letterSpacing = 0.15.sp
    )
    
    val BodyMedium = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Normal,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.25.sp
    )
    
    val LabelLarge = TextStyle(
        fontFamily = CoachingFontFamily,
        fontWeight = FontWeight.Medium,
        fontSize = 14.sp,
        lineHeight = 20.sp,
        letterSpacing = 0.1.sp
    )
}
```

#### Typography Usage Guidelines
```kotlin
// Page titles
Text(
    text = "Student Dashboard",
    style = TypographyScale.HeadlineLarge
)

// Section headers
Text(
    text = "Today's Classes",
    style = TypographyScale.TitleLarge
)

// Body content
Text(
    text = "Assignment instructions...",
    style = TypographyScale.BodyLarge
)

// Button labels
Text(
    text = "Submit Assignment",
    style = TypographyScale.LabelLarge
)
```

### 1.3 Spacing System

#### Spatial Dimensions
```kotlin
object Spacing {
    val XS = 4.dp      // Tight spacing within components
    val SM = 8.dp      // Small spacing between related elements
    val MD = 16.dp     // Standard spacing between components
    val LG = 24.dp     // Large spacing between sections
    val XL = 32.dp     // Extra large spacing for major separations
    val XXL = 48.dp    // Maximum spacing for major layout divisions
    
    // Specific use cases
    val CardPadding = MD
    val SectionSpacing = LG
    val ScreenPadding = MD
    val ComponentSpacing = SM
}
```

#### Layout Grid System
```kotlin
@Composable
fun GridSystem() {
    // 4dp base grid system
    val baseGrid = 4.dp
    
    // Layout margins
    val marginPhone = baseGrid * 4    // 16dp
    val marginTablet = baseGrid * 6   // 24dp
    val marginDesktop = baseGrid * 8  // 32dp
    
    // Component spacing
    val componentSpacing = baseGrid * 2  // 8dp
    val sectionSpacing = baseGrid * 6    // 24dp
}
```

### 1.4 Elevation & Shadows

#### Elevation Levels
```kotlin
object Elevation {
    val Level0 = 0.dp     // Surface level
    val Level1 = 1.dp     // Slightly raised (cards at rest)
    val Level2 = 3.dp     // Raised (buttons, input fields)
    val Level3 = 6.dp     // Floating (FAB, snackbar)
    val Level4 = 8.dp     // Modal (dialogs, menus)
    val Level5 = 12.dp    // Navigation drawer
}
```

#### Shadow Specifications
```kotlin
@Composable
fun ShadowExample() {
    Card(
        modifier = Modifier.shadow(
            elevation = Elevation.Level2,
            shape = RoundedCornerShape(12.dp),
            spotColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.15f),
            ambientColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.05f)
        )
    ) {
        // Card content
    }
}
```

### 1.5 Border Radius System

```kotlin
object BorderRadius {
    val XS = 4.dp      // Small components (chips, tags)
    val SM = 8.dp      // Input fields, buttons
    val MD = 12.dp     // Cards, containers
    val LG = 16.dp     // Modal dialogs
    val XL = 24.dp     // Bottom sheets
    val Circular = 50  // Circular components (FAB, avatars)
}
```

## 2. Component Library

### 2.1 Button Components

#### Primary Button
```kotlin
@Composable
fun CoachingPrimaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier,
    enabled: Boolean = true,
    loading: Boolean = false,
    icon: ImageVector? = null,
    size: ButtonSize = ButtonSize.Medium
) {
    val buttonHeight = when (size) {
        ButtonSize.Small -> 36.dp
        ButtonSize.Medium -> 48.dp
        ButtonSize.Large -> 56.dp
    }
    
    Button(
        onClick = onClick,
        modifier = modifier.height(buttonHeight),
        enabled = enabled && !loading,
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.primary,
            contentColor = MaterialTheme.colorScheme.onPrimary,
            disabledContainerColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.38f)
        ),
        shape = RoundedCornerShape(BorderRadius.SM),
        elevation = ButtonDefaults.buttonElevation(
            defaultElevation = Elevation.Level2,
            pressedElevation = Elevation.Level1
        )
    ) {
        if (loading) {
            CircularProgressIndicator(
                modifier = Modifier.size(20.dp),
                strokeWidth = 2.dp,
                color = MaterialTheme.colorScheme.onPrimary
            )
        } else {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.SM)
            ) {
                icon?.let {
                    Icon(
                        imageVector = it,
                        contentDescription = null,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Text(
                    text = text,
                    style = TypographyScale.LabelLarge
                )
            }
        }
    }
}
```

#### Button Variants
```kotlin
@Composable
fun CoachingSecondaryButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    OutlinedButton(
        onClick = onClick,
        modifier = modifier,
        colors = ButtonDefaults.outlinedButtonColors(
            contentColor = MaterialTheme.colorScheme.primary
        ),
        border = BorderStroke(
            width = 1.dp,
            color = MaterialTheme.colorScheme.primary
        )
    ) {
        Text(text)
    }
}

@Composable
fun CoachingTextButton(
    text: String,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    TextButton(
        onClick = onClick,
        modifier = modifier
    ) {
        Text(
            text = text,
            color = MaterialTheme.colorScheme.primary
        )
    }
}
```

### 2.2 Card Components

#### Dashboard Card
```kotlin
@Composable
fun DashboardCard(
    title: String,
    modifier: Modifier = Modifier,
    subtitle: String? = null,
    actions: @Composable RowScope.() -> Unit = {},
    content: @Composable ColumnScope.() -> Unit
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = Elevation.Level1
        ),
        shape = RoundedCornerShape(BorderRadius.MD)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.MD)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = title,
                        style = TypographyScale.TitleMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                    subtitle?.let {
                        Text(
                            text = it,
                            style = TypographyScale.BodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant,
                            modifier = Modifier.padding(top = Spacing.XS)
                        )
                    }
                }
                Row {
                    actions()
                }
            }
            
            Spacer(modifier = Modifier.height(Spacing.MD))
            
            content()
        }
    }
}
```

#### Statistics Card
```kotlin
@Composable
fun StatisticsCard(
    title: String,
    value: String,
    change: Float? = null,
    icon: ImageVector,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(Elevation.Level1)
    ) {
        Column(
            modifier = Modifier.padding(Spacing.MD)
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(Spacing.SM)
            ) {
                Icon(
                    imageVector = icon,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary,
                    modifier = Modifier.size(24.dp)
                )
                Text(
                    text = title,
                    style = TypographyScale.BodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Text(
                text = value,
                style = TypographyScale.HeadlineMedium,
                color = MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.padding(top = Spacing.SM)
            )
            
            change?.let {
                val (color, arrow) = if (it > 0) {
                    SemanticColors.Success to "↗"
                } else {
                    SemanticColors.Error to "↘"
                }
                
                Text(
                    text = "$arrow ${Math.abs(it)}%",
                    style = TypographyScale.BodyMedium,
                    color = color,
                    modifier = Modifier.padding(top = Spacing.XS)
                )
            }
        }
    }
}
```

### 2.3 Input Components

#### Text Field
```kotlin
@Composable
fun CoachingTextField(
    value: String,
    onValueChange: (String) -> Unit,
    label: String,
    modifier: Modifier = Modifier,
    placeholder: String? = null,
    leadingIcon: ImageVector? = null,
    trailingIcon: ImageVector? = null,
    onTrailingIconClick: (() -> Unit)? = null,
    error: String? = null,
    enabled: Boolean = true,
    maxLines: Int = 1,
    keyboardType: KeyboardType = KeyboardType.Text
) {
    Column(modifier = modifier) {
        OutlinedTextField(
            value = value,
            onValueChange = onValueChange,
            label = { Text(label) },
            placeholder = placeholder?.let { { Text(it) } },
            leadingIcon = leadingIcon?.let {
                {
                    Icon(
                        imageVector = it,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            },
            trailingIcon = trailingIcon?.let {
                {
                    IconButton(onClick = onTrailingIconClick ?: {}) {
                        Icon(
                            imageVector = it,
                            contentDescription = null
                        )
                    }
                }
            },
            isError = error != null,
            enabled = enabled,
            maxLines = maxLines,
            keyboardOptions = KeyboardOptions(keyboardType = keyboardType),
            shape = RoundedCornerShape(BorderRadius.SM),
            modifier = Modifier.fillMaxWidth()
        )
        
        error?.let {
            Text(
                text = it,
                color = SemanticColors.Error,
                style = TypographyScale.BodyMedium,
                modifier = Modifier.padding(start = Spacing.MD, top = Spacing.XS)
            )
        }
    }
}
```

#### Search Field
```kotlin
@Composable
fun SearchField(
    query: String,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
    modifier: Modifier = Modifier,
    placeholder: String = "Search..."
) {
    OutlinedTextField(
        value = query,
        onValueChange = onQueryChange,
        placeholder = { Text(placeholder) },
        leadingIcon = {
            Icon(
                imageVector = Icons.Default.Search,
                contentDescription = "Search"
            )
        },
        trailingIcon = if (query.isNotEmpty()) {
            {
                IconButton(onClick = { onQueryChange("") }) {
                    Icon(
                        imageVector = Icons.Default.Clear,
                        contentDescription = "Clear"
                    )
                }
            }
        } else null,
        keyboardOptions = KeyboardOptions(
            imeAction = ImeAction.Search
        ),
        keyboardActions = KeyboardActions(
            onSearch = { onSearch() }
        ),
        shape = RoundedCornerShape(BorderRadius.LG),
        modifier = modifier.fillMaxWidth()
    )
}
```

### 2.4 Progress Indicators

#### Progress Bar
```kotlin
@Composable
fun CoachingProgressBar(
    progress: Float,
    label: String? = null,
    showPercentage: Boolean = true,
    modifier: Modifier = Modifier
) {
    Column(modifier = modifier) {
        if (label != null || showPercentage) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (label != null) {
                    Text(
                        text = label,
                        style = TypographyScale.BodyMedium,
                        color = MaterialTheme.colorScheme.onSurface
                    )
                }
                if (showPercentage) {
                    Text(
                        text = "${(progress * 100).toInt()}%",
                        style = TypographyScale.BodyMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            Spacer(modifier = Modifier.height(Spacing.SM))
        }
        
        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier
                .fillMaxWidth()
                .height(8.dp)
                .clip(RoundedCornerShape(BorderRadius.XS)),
            color = MaterialTheme.colorScheme.primary,
            trackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
        )
    }
}
```

#### Circular Progress with Label
```kotlin
@Composable
fun CircularProgressWithLabel(
    progress: Float,
    label: String,
    modifier: Modifier = Modifier,
    size: Dp = 80.dp
) {
    Box(
        modifier = modifier,
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator(
            progress = progress,
            modifier = Modifier.size(size),
            strokeWidth = 6.dp,
            color = MaterialTheme.colorScheme.primary,
            trackColor = MaterialTheme.colorScheme.primary.copy(alpha = 0.2f)
        )
        
        Column(
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "${(progress * 100).toInt()}%",
                style = TypographyScale.TitleMedium,
                color = MaterialTheme.colorScheme.onSurface
            )
            Text(
                text = label,
                style = TypographyScale.BodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                textAlign = TextAlign.Center
            )
        }
    }
}
```

### 2.5 Status Components

#### Status Badge
```kotlin
enum class BadgeType {
    Success, Warning, Error, Info, Neutral
}

@Composable
fun StatusBadge(
    text: String,
    type: BadgeType,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, textColor) = when (type) {
        BadgeType.Success -> SemanticColors.Success.copy(alpha = 0.1f) to SemanticColors.Success
        BadgeType.Warning -> SemanticColors.Warning.copy(alpha = 0.1f) to SemanticColors.Warning
        BadgeType.Error -> SemanticColors.Error.copy(alpha = 0.1f) to SemanticColors.Error
        BadgeType.Info -> SemanticColors.Info.copy(alpha = 0.1f) to SemanticColors.Info
        BadgeType.Neutral -> MaterialTheme.colorScheme.surfaceVariant to MaterialTheme.colorScheme.onSurfaceVariant
    }
    
    Surface(
        modifier = modifier,
        shape = RoundedCornerShape(BorderRadius.XS),
        color = backgroundColor
    ) {
        Text(
            text = text,
            style = TypographyScale.LabelLarge,
            color = textColor,
            modifier = Modifier.padding(
                horizontal = Spacing.SM,
                vertical = Spacing.XS
            )
        )
    }
}
```

#### Priority Indicator
```kotlin
enum class Priority { High, Medium, Low }

@Composable
fun PriorityIndicator(
    priority: Priority,
    modifier: Modifier = Modifier
) {
    val (color, text) = when (priority) {
        Priority.High -> SemanticColors.Error to "High"
        Priority.Medium -> SemanticColors.Warning to "Medium"
        Priority.Low -> SemanticColors.Success to "Low"
    }
    
    Row(
        modifier = modifier,
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(Spacing.XS)
    ) {
        Box(
            modifier = Modifier
                .size(8.dp)
                .background(
                    color = color,
                    shape = CircleShape
                )
        )
        Text(
            text = text,
            style = TypographyScale.BodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}
```

## 3. Icon System

### 3.1 Icon Categories
```kotlin
object CoachingIcons {
    // Navigation
    val Home = Icons.Default.Home
    val Dashboard = Icons.Default.Dashboard
    val Classes = Icons.Default.School
    val Assignments = Icons.Default.Assignment
    val Messages = Icons.Default.Message
    val Profile = Icons.Default.Person
    val Settings = Icons.Default.Settings
    
    // Actions
    val Add = Icons.Default.Add
    val Edit = Icons.Default.Edit
    val Delete = Icons.Default.Delete
    val Submit = Icons.Default.Send
    val Download = Icons.Default.Download
    val Upload = Icons.Default.Upload
    val Search = Icons.Default.Search
    val Filter = Icons.Default.FilterList
    val Sort = Icons.Default.Sort
    
    // Status & Feedback
    val Success = Icons.Default.CheckCircle
    val Error = Icons.Default.Error
    val Warning = Icons.Default.Warning
    val Info = Icons.Default.Info
    val Pending = Icons.Default.Schedule
    val Loading = Icons.Default.Sync
    
    // Communication
    val Chat = Icons.Default.Chat
    val Notifications = Icons.Default.Notifications
    val Call = Icons.Default.Call
    val VideoCall = Icons.Default.VideoCall
    val Email = Icons.Default.Email
    
    // Academic
    val Grade = Icons.Default.Grade
    val Book = Icons.Default.MenuBook
    val Quiz = Icons.Default.Quiz
    val Certificate = Icons.Default.CardMembership
    val Progress = Icons.Default.TrendingUp
    
    // AI & Smart Features
    val AI = Icons.Default.Psychology
    val Automation = Icons.Default.AutoAwesome
    val Insights = Icons.Default.Insights
    val Recommendation = Icons.Default.Recommend
}
```

### 3.2 Icon Usage Guidelines
```kotlin
@Composable
fun IconUsageExample() {
    // Standard icon size for buttons
    Icon(
        imageVector = CoachingIcons.Add,
        contentDescription = "Add assignment",
        modifier = Modifier.size(24.dp)
    )
    
    // Small icons for inline use
    Icon(
        imageVector = CoachingIcons.Success,
        contentDescription = null,
        modifier = Modifier.size(16.dp),
        tint = SemanticColors.Success
    )
    
    // Large icons for empty states
    Icon(
        imageVector = CoachingIcons.Assignments,
        contentDescription = null,
        modifier = Modifier.size(48.dp),
        tint = MaterialTheme.colorScheme.onSurfaceVariant
    )
}
```

## 4. Animation Specifications

### 4.1 Duration & Easing
```kotlin
object AnimationSpecs {
    // Duration constants
    const val DURATION_FAST = 150
    const val DURATION_NORMAL = 300
    const val DURATION_SLOW = 500
    
    // Easing curves
    val EaseInOut = CubicBezierEasing(0.4f, 0.0f, 0.2f, 1.0f)
    val EaseOut = CubicBezierEasing(0.0f, 0.0f, 0.2f, 1.0f)
    val EaseIn = CubicBezierEasing(0.4f, 0.0f, 1.0f, 1.0f)
    
    // Common animation specs
    val FastEaseOut = tween<Float>(DURATION_FAST, easing = EaseOut)
    val NormalEaseInOut = tween<Float>(DURATION_NORMAL, easing = EaseInOut)
    val SlowEaseOut = tween<Float>(DURATION_SLOW, easing = EaseOut)
}
```

### 4.2 Transition Patterns
```kotlin
@Composable
fun StandardEnterTransition() = slideInHorizontally(
    initialOffsetX = { it },
    animationSpec = AnimationSpecs.NormalEaseInOut
) + fadeIn(animationSpec = AnimationSpecs.FastEaseOut)

@Composable
fun StandardExitTransition() = slideOutHorizontally(
    targetOffsetX = { -it },
    animationSpec = AnimationSpecs.NormalEaseInOut
) + fadeOut(animationSpec = AnimationSpecs.FastEaseOut)
```

## 5. Accessibility Standards

### 5.1 Minimum Touch Targets
```kotlin
object AccessibilitySpecs {
    val MinTouchTarget = 48.dp
    val RecommendedTouchTarget = 56.dp
    val LargeTouchTarget = 64.dp
}
```

### 5.2 Color Contrast Requirements
```kotlin
// Minimum contrast ratios (WCAG 2.1 AA)
object ContrastRatios {
    const val NORMAL_TEXT = 4.5f      // 4.5:1 for normal text
    const val LARGE_TEXT = 3.0f       // 3:1 for large text (18pt+)
    const val NON_TEXT = 3.0f         // 3:1 for UI components
}
```

### 5.3 Screen Reader Support
```kotlin
@Composable
fun AccessibleComponent(
    title: String,
    description: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .semantics {
                contentDescription = "$title. $description"
                role = Role.Button
            }
            .clickable(
                onClickLabel = "Open $title"
            ) { onClick() }
    ) {
        // Component content
    }
}
```

This comprehensive design system provides the foundation for consistent, accessible, and scalable UI implementation across the coaching management platform.