# Implementation Guidelines - Coaching Management Platform

## 1. Development Setup & Architecture

### 1.1 Project Structure
```
coaching-app/
├── app/
│   ├── src/
│   │   ├── main/
│   │   │   ├── java/com/coaching/app/
│   │   │   │   ├── core/                    # Core architecture components
│   │   │   │   ├── data/                    # Data layer (repositories, APIs)
│   │   │   │   ├── domain/                  # Business logic layer
│   │   │   │   ├── presentation/            # UI layer
│   │   │   │   │   ├── components/          # Reusable UI components
│   │   │   │   │   ├── navigation/          # Navigation setup
│   │   │   │   │   ├── theme/              # Design system implementation
│   │   │   │   │   ├── student/            # Student-specific screens
│   │   │   │   │   ├── teacher/            # Teacher-specific screens
│   │   │   │   │   ├── parent/             # Parent-specific screens
│   │   │   │   │   └── admin/              # Admin-specific screens
│   │   │   │   ├── di/                     # Dependency injection
│   │   │   │   └── utils/                  # Utility classes
│   │   │   └── res/
│   │   │       ├── values/
│   │   │       │   ├── colors.xml
│   │   │       │   ├── dimens.xml
│   │   │       │   ├── strings.xml
│   │   │       │   └── themes.xml
│   │   │       ├── font/                   # Custom fonts
│   │   │       └── drawable/               # Vector drawables, icons
│   │   └── test/                           # Unit tests
│   └── build.gradle.kts
├── design-system/                          # Standalone design system module
├── core/                                   # Core business logic module
└── data/                                   # Data handling module
```

### 1.2 Gradle Dependencies
```kotlin
// app/build.gradle.kts
dependencies {
    // Compose BOM
    implementation(platform("androidx.compose:compose-bom:2024.02.00"))
    
    // Core Compose
    implementation("androidx.compose.ui:ui")
    implementation("androidx.compose.ui:ui-tooling-preview")
    implementation("androidx.compose.material3:material3")
    implementation("androidx.activity:activity-compose:1.8.2")
    implementation("androidx.navigation:navigation-compose:2.7.6")
    
    // Lifecycle
    implementation("androidx.lifecycle:lifecycle-viewmodel-compose:2.7.0")
    implementation("androidx.lifecycle:lifecycle-runtime-compose:2.7.0")
    
    // Coroutines
    implementation("org.jetbrains.kotlinx:kotlinx-coroutines-android:1.7.3")
    
    // Dependency Injection
    implementation("com.google.dagger:hilt-android:2.48.1")
    kapt("com.google.dagger:hilt-compiler:2.48.1")
    implementation("androidx.hilt:hilt-navigation-compose:1.1.0")
    
    // Networking
    implementation("com.squareup.retrofit2:retrofit:2.9.0")
    implementation("com.squareup.retrofit2:converter-gson:2.9.0")
    implementation("com.squareup.okhttp3:logging-interceptor:4.12.0")
    
    // Image Loading
    implementation("io.coil-kt:coil-compose:2.5.0")
    
    // Local Database
    implementation("androidx.room:room-runtime:2.6.1")
    implementation("androidx.room:room-ktx:2.6.1")
    kapt("androidx.room:room-compiler:2.6.1")
    
    // Permissions
    implementation("com.google.accompanist:accompanist-permissions:0.32.0")
    
    // System UI Controller
    implementation("com.google.accompanist:accompanist-systemuicontroller:0.32.0")
    
    // Testing
    testImplementation("junit:junit:4.13.2")
    testImplementation("androidx.compose.ui:ui-test-junit4")
    debugImplementation("androidx.compose.ui:ui-tooling")
    debugImplementation("androidx.compose.ui:ui-test-manifest")
}
```

### 1.3 Theme Implementation
```kotlin
// presentation/theme/Theme.kt
@Composable
fun CoachingAppTheme(
    darkTheme: Boolean = isSystemInDarkTheme(),
    dynamicColor: Boolean = true,
    content: @Composable () -> Unit
) {
    val colorScheme = when {
        dynamicColor && Build.VERSION.SDK_INT >= Build.VERSION_CODES.S -> {
            val context = LocalContext.current
            if (darkTheme) dynamicDarkColorScheme(context) else dynamicLightColorScheme(context)
        }
        darkTheme -> DarkColorScheme
        else -> LightColorScheme
    }

    MaterialTheme(
        colorScheme = colorScheme,
        typography = CoachingTypography,
        shapes = CoachingShapes,
        content = content
    )
}

// Colors.kt
val LightColorScheme = lightColorScheme(
    primary = Color(0xFF6750A4),
    onPrimary = Color(0xFFFFFFFF),
    primaryContainer = Color(0xFFEADDFF),
    onPrimaryContainer = Color(0xFF21005D),
    secondary = Color(0xFF625B71),
    onSecondary = Color(0xFFFFFFFF),
    secondaryContainer = Color(0xFFE8DEF8),
    onSecondaryContainer = Color(0xFF1D192B),
    tertiary = Color(0xFF7D5260),
    onTertiary = Color(0xFFFFFFFF),
    tertiaryContainer = Color(0xFFFFD8E4),
    onTertiaryContainer = Color(0xFF31111D),
    error = Color(0xFFBA1A1A),
    onError = Color(0xFFFFFFFF),
    errorContainer = Color(0xFFFFDAD6),
    onErrorContainer = Color(0xFF410002),
    background = Color(0xFFFEF7FF),
    onBackground = Color(0xFF1D1B20),
    surface = Color(0xFFFEF7FF),
    onSurface = Color(0xFF1D1B20),
    surfaceVariant = Color(0xFFE7E0EC),
    onSurfaceVariant = Color(0xFF49454F),
    outline = Color(0xFF79747E),
    outlineVariant = Color(0xFFCAC4D0),
    scrim = Color(0xFF000000),
    inverseSurface = Color(0xFF322F35),
    inverseOnSurface = Color(0xFFF5EFF7),
    inversePrimary = Color(0xFFD0BCFF)
)

val DarkColorScheme = darkColorScheme(
    primary = Color(0xFFD0BCFF),
    onPrimary = Color(0xFF371E73),
    primaryContainer = Color(0xFF4F378B),
    onPrimaryContainer = Color(0xFFEADDFF),
    secondary = Color(0xFFCCC2DC),
    onSecondary = Color(0xFF332D41),
    secondaryContainer = Color(0xFF4A4458),
    onSecondaryContainer = Color(0xFFE8DEF8),
    tertiary = Color(0xFFEFB8C8),
    onTertiary = Color(0xFF492532),
    tertiaryContainer = Color(0xFF633B48),
    onTertiaryContainer = Color(0xFFFFD8E4),
    error = Color(0xFFFFB4AB),
    onError = Color(0xFF690005),
    errorContainer = Color(0xFF93000A),
    onErrorContainer = Color(0xFFFFDAD6),
    background = Color(0xFF141218),
    onBackground = Color(0xFFE6E0E9),
    surface = Color(0xFF141218),
    onSurface = Color(0xFFE6E0E9),
    surfaceVariant = Color(0xFF49454F),
    onSurfaceVariant = Color(0xFFCAC4D0),
    outline = Color(0xFF938F99),
    outlineVariant = Color(0xFF49454F),
    scrim = Color(0xFF000000),
    inverseSurface = Color(0xFFE6E0E9),
    inverseOnSurface = Color(0xFF322F35),
    inversePrimary = Color(0xFF6750A4)
)
```

## 2. Navigation Implementation

### 2.1 Navigation Setup
```kotlin
// navigation/CoachingNavigation.kt
@Composable
fun CoachingNavigation(
    userRole: UserRole,
    modifier: Modifier = Modifier
) {
    val navController = rememberNavController()
    
    NavHost(
        navController = navController,
        startDestination = when (userRole) {
            UserRole.STUDENT -> StudentRoutes.Dashboard.route
            UserRole.TEACHER -> TeacherRoutes.Dashboard.route
            UserRole.PARENT -> ParentRoutes.Dashboard.route
            UserRole.ADMIN -> AdminRoutes.Dashboard.route
        },
        modifier = modifier
    ) {
        // Student navigation graph
        studentNavGraph(navController)
        
        // Teacher navigation graph
        teacherNavGraph(navController)
        
        // Parent navigation graph
        parentNavGraph(navController)
        
        // Admin navigation graph
        adminNavGraph(navController)
        
        // Shared screens
        sharedNavGraph(navController)
    }
}

// Define route objects
sealed class StudentRoutes(val route: String) {
    object Dashboard : StudentRoutes("student/dashboard")
    object Classes : StudentRoutes("student/classes")
    object Assignments : StudentRoutes("student/assignments")
    object Doubts : StudentRoutes("student/doubts")
    object Progress : StudentRoutes("student/progress")
    object Profile : StudentRoutes("student/profile")
}

// Navigation extension functions
fun NavGraphBuilder.studentNavGraph(navController: NavHostController) {
    composable(StudentRoutes.Dashboard.route) {
        StudentDashboardScreen(navController = navController)
    }
    composable(StudentRoutes.Classes.route) {
        StudentClassesScreen(navController = navController)
    }
    composable(StudentRoutes.Assignments.route) {
        StudentAssignmentsScreen(navController = navController)
    }
    // Add more routes...
}
```

### 2.2 Bottom Navigation Implementation
```kotlin
// components/BottomNavigationBar.kt
@Composable
fun CoachingBottomNavigation(
    userRole: UserRole,
    currentRoute: String?,
    onNavigate: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    val items = when (userRole) {
        UserRole.STUDENT -> studentNavItems
        UserRole.TEACHER -> teacherNavItems
        UserRole.PARENT -> parentNavItems
        UserRole.ADMIN -> adminNavItems
    }
    
    NavigationBar(
        modifier = modifier,
        containerColor = MaterialTheme.colorScheme.surface,
        contentColor = MaterialTheme.colorScheme.primary
    ) {
        items.forEach { item ->
            NavigationBarItem(
                icon = {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label
                    )
                },
                label = { Text(item.label) },
                selected = currentRoute == item.route,
                onClick = { onNavigate(item.route) },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = MaterialTheme.colorScheme.primary,
                    selectedTextColor = MaterialTheme.colorScheme.primary,
                    indicatorColor = MaterialTheme.colorScheme.primaryContainer,
                    unselectedIconColor = MaterialTheme.colorScheme.onSurfaceVariant,
                    unselectedTextColor = MaterialTheme.colorScheme.onSurfaceVariant
                )
            )
        }
    }
}

private val studentNavItems = listOf(
    BottomNavItem("Dashboard", StudentRoutes.Dashboard.route, CoachingIcons.Dashboard),
    BottomNavItem("Classes", StudentRoutes.Classes.route, CoachingIcons.Classes),
    BottomNavItem("Assignments", StudentRoutes.Assignments.route, CoachingIcons.Assignments),
    BottomNavItem("Doubts", StudentRoutes.Doubts.route, CoachingIcons.Chat),
    BottomNavItem("Profile", StudentRoutes.Profile.route, CoachingIcons.Profile)
)

data class BottomNavItem(
    val label: String,
    val route: String,
    val icon: ImageVector
)
```

## 3. State Management Pattern

### 3.1 ViewModel Implementation
```kotlin
// presentation/student/dashboard/StudentDashboardViewModel.kt
@HiltViewModel
class StudentDashboardViewModel @Inject constructor(
    private val studentRepository: StudentRepository,
    private val classRepository: ClassRepository,
    private val assignmentRepository: AssignmentRepository
) : ViewModel() {
    
    private val _uiState = MutableStateFlow(StudentDashboardUiState())
    val uiState: StateFlow<StudentDashboardUiState> = _uiState.asStateFlow()
    
    init {
        loadDashboardData()
    }
    
    private fun loadDashboardData() {
        viewModelScope.launch {
            _uiState.value = _uiState.value.copy(isLoading = true)
            
            try {
                val todayClasses = classRepository.getTodayClasses()
                val pendingAssignments = assignmentRepository.getPendingAssignments()
                val recentGrades = studentRepository.getRecentGrades()
                val progressData = studentRepository.getProgressSummary()
                
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    todayClasses = todayClasses,
                    pendingAssignments = pendingAssignments,
                    recentGrades = recentGrades,
                    progressData = progressData
                )
            } catch (exception: Exception) {
                _uiState.value = _uiState.value.copy(
                    isLoading = false,
                    error = exception.message
                )
            }
        }
    }
    
    fun joinClass(classId: String) {
        viewModelScope.launch {
            try {
                classRepository.joinClass(classId)
                // Handle successful join
            } catch (exception: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = exception.message
                )
            }
        }
    }
    
    fun submitDoubt(doubtRequest: DoubtRequest) {
        viewModelScope.launch {
            try {
                studentRepository.submitDoubt(doubtRequest)
                // Show success message
            } catch (exception: Exception) {
                _uiState.value = _uiState.value.copy(
                    error = exception.message
                )
            }
        }
    }
}

data class StudentDashboardUiState(
    val isLoading: Boolean = false,
    val todayClasses: List<ClassSession> = emptyList(),
    val pendingAssignments: List<Assignment> = emptyList(),
    val recentGrades: List<Grade> = emptyList(),
    val progressData: ProgressSummary? = null,
    val error: String? = null
)
```

### 3.2 Screen Implementation
```kotlin
// presentation/student/dashboard/StudentDashboardScreen.kt
@Composable
fun StudentDashboardScreen(
    navController: NavHostController,
    viewModel: StudentDashboardViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    
    StudentDashboardContent(
        uiState = uiState,
        onJoinClass = viewModel::joinClass,
        onSubmitDoubt = viewModel::submitDoubt,
        onNavigateToAssignments = { navController.navigate(StudentRoutes.Assignments.route) },
        onNavigateToClasses = { navController.navigate(StudentRoutes.Classes.route) }
    )
}

@Composable
private fun StudentDashboardContent(
    uiState: StudentDashboardUiState,
    onJoinClass: (String) -> Unit,
    onSubmitDoubt: (DoubtRequest) -> Unit,
    onNavigateToAssignments: () -> Unit,
    onNavigateToClasses: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = Spacing.MD)
    ) {
        // Top greeting section
        DashboardGreeting(
            modifier = Modifier.padding(vertical = Spacing.LG)
        )
        
        LazyColumn(
            verticalArrangement = Arrangement.spacedBy(Spacing.MD)
        ) {
            // Today's schedule
            item {
                TodayScheduleCard(
                    classes = uiState.todayClasses,
                    onJoinClass = onJoinClass,
                    onViewAll = onNavigateToClasses
                )
            }
            
            // Quick overview stats
            item {
                QuickOverviewCard(
                    pendingTasks = uiState.pendingAssignments.size,
                    recentGrade = uiState.recentGrades.firstOrNull()?.grade,
                    studyStreak = uiState.progressData?.studyStreak ?: 0
                )
            }
            
            // Quick actions
            item {
                QuickActionsSection(
                    onSubmitDoubt = onSubmitDoubt,
                    onNavigateToAssignments = onNavigateToAssignments
                )
            }
            
            // AI Tutor card
            item {
                AITutorCard(
                    onStartChat = { /* Handle AI chat */ }
                )
            }
        }
    }
    
    // Error handling
    uiState.error?.let { error ->
        LaunchedEffect(error) {
            // Show error snackbar or dialog
        }
    }
    
    // Loading state
    if (uiState.isLoading) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    }
}
```

## 4. Data Layer Implementation

### 4.1 Repository Pattern
```kotlin
// data/repository/StudentRepositoryImpl.kt
@Singleton
class StudentRepositoryImpl @Inject constructor(
    private val apiService: CoachingApiService,
    private val localDataSource: StudentLocalDataSource
) : StudentRepository {
    
    override suspend fun getDashboardData(): Result<DashboardData> {
        return try {
            // Try network first
            val networkData = apiService.getStudentDashboard()
            localDataSource.cacheDashboardData(networkData)
            Result.success(networkData)
        } catch (exception: Exception) {
            // Fallback to cached data
            val cachedData = localDataSource.getDashboardData()
            if (cachedData != null) {
                Result.success(cachedData)
            } else {
                Result.failure(exception)
            }
        }
    }
    
    override suspend fun submitAssignment(
        assignmentId: String,
        submission: AssignmentSubmission
    ): Result<SubmissionResponse> {
        return try {
            val response = apiService.submitAssignment(assignmentId, submission)
            localDataSource.cacheSubmission(submission)
            Result.success(response)
        } catch (exception: Exception) {
            // Queue for later sync if offline
            localDataSource.queueSubmission(submission)
            Result.failure(exception)
        }
    }
}

// Dependency injection module
@Module
@InstallIn(SingletonComponent::class)
abstract class RepositoryModule {
    
    @Binds
    abstract fun bindStudentRepository(
        studentRepositoryImpl: StudentRepositoryImpl
    ): StudentRepository
    
    @Binds
    abstract fun bindTeacherRepository(
        teacherRepositoryImpl: TeacherRepositoryImpl
    ): TeacherRepository
}
```

### 4.2 API Service Definition
```kotlin
// data/api/CoachingApiService.kt
interface CoachingApiService {
    
    @GET("student/dashboard")
    suspend fun getStudentDashboard(): DashboardData
    
    @GET("student/classes/today")
    suspend fun getTodayClasses(): List<ClassSession>
    
    @GET("student/assignments/pending")
    suspend fun getPendingAssignments(): List<Assignment>
    
    @POST("student/assignments/{id}/submit")
    suspend fun submitAssignment(
        @Path("id") assignmentId: String,
        @Body submission: AssignmentSubmission
    ): SubmissionResponse
    
    @POST("student/doubts")
    suspend fun submitDoubt(
        @Body doubtRequest: DoubtRequest
    ): DoubtResponse
    
    @GET("classes/{id}/join")
    suspend fun joinClass(@Path("id") classId: String): ClassJoinResponse
}

// Network module
@Module
@InstallIn(SingletonComponent::class)
object NetworkModule {
    
    @Provides
    @Singleton
    fun provideOkHttpClient(): OkHttpClient {
        return OkHttpClient.Builder()
            .addInterceptor(HttpLoggingInterceptor().apply {
                level = if (BuildConfig.DEBUG) {
                    HttpLoggingInterceptor.Level.BODY
                } else {
                    HttpLoggingInterceptor.Level.NONE
                }
            })
            .addInterceptor(AuthInterceptor())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideRetrofit(okHttpClient: OkHttpClient): Retrofit {
        return Retrofit.Builder()
            .baseUrl("https://api.coachingapp.com/")
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create())
            .build()
    }
    
    @Provides
    @Singleton
    fun provideApiService(retrofit: Retrofit): CoachingApiService {
        return retrofit.create(CoachingApiService::class.java)
    }
}
```

## 5. Offline Support Implementation

### 5.1 Local Database
```kotlin
// data/local/dao/StudentDao.kt
@Dao
interface StudentDao {
    
    @Query("SELECT * FROM dashboard_data WHERE studentId = :studentId")
    suspend fun getDashboardData(studentId: String): DashboardDataEntity?
    
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDashboardData(data: DashboardDataEntity)
    
    @Query("SELECT * FROM pending_submissions")
    suspend fun getPendingSubmissions(): List<PendingSubmissionEntity>
    
    @Insert
    suspend fun insertPendingSubmission(submission: PendingSubmissionEntity)
    
    @Delete
    suspend fun deletePendingSubmission(submission: PendingSubmissionEntity)
}

// Database entities
@Entity(tableName = "dashboard_data")
data class DashboardDataEntity(
    @PrimaryKey val studentId: String,
    val classesJson: String,
    val assignmentsJson: String,
    val gradesJson: String,
    val lastUpdated: Long
)

@Entity(tableName = "pending_submissions")
data class PendingSubmissionEntity(
    @PrimaryKey val id: String,
    val assignmentId: String,
    val submissionJson: String,
    val timestamp: Long
)

// Database
@Database(
    entities = [
        DashboardDataEntity::class,
        PendingSubmissionEntity::class
    ],
    version = 1,
    exportSchema = false
)
@TypeConverters(Converters::class)
abstract class CoachingDatabase : RoomDatabase() {
    abstract fun studentDao(): StudentDao
}
```

### 5.2 Sync Manager
```kotlin
// data/sync/SyncManager.kt
@Singleton
class SyncManager @Inject constructor(
    private val database: CoachingDatabase,
    private val apiService: CoachingApiService,
    private val connectivityManager: ConnectivityManager
) {
    
    suspend fun syncPendingData() {
        if (!isNetworkAvailable()) return
        
        val pendingSubmissions = database.studentDao().getPendingSubmissions()
        
        pendingSubmissions.forEach { submission ->
            try {
                val response = apiService.submitAssignment(
                    submission.assignmentId,
                    Gson().fromJson(submission.submissionJson, AssignmentSubmission::class.java)
                )
                // Remove from pending list on successful sync
                database.studentDao().deletePendingSubmission(submission)
            } catch (exception: Exception) {
                // Keep in pending list for retry
                Timber.e(exception, "Failed to sync submission: ${submission.id}")
            }
        }
    }
    
    private fun isNetworkAvailable(): Boolean {
        val network = connectivityManager.activeNetwork ?: return false
        val networkCapabilities = connectivityManager.getNetworkCapabilities(network) ?: return false
        return networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_WIFI) ||
                networkCapabilities.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)
    }
}
```

## 6. Testing Strategy

### 6.1 Unit Testing
```kotlin
// test/presentation/StudentDashboardViewModelTest.kt
@ExtendWith(MockitoExtension::class)
class StudentDashboardViewModelTest {
    
    @Mock
    private lateinit var studentRepository: StudentRepository
    
    @Mock
    private lateinit var classRepository: ClassRepository
    
    private lateinit var viewModel: StudentDashboardViewModel
    
    @Before
    fun setup() {
        viewModel = StudentDashboardViewModel(
            studentRepository = studentRepository,
            classRepository = classRepository,
            assignmentRepository = mock()
        )
    }
    
    @Test
    fun `when dashboard loads successfully, ui state is updated`() = runTest {
        // Given
        val mockClasses = listOf(
            ClassSession("1", "Math", "10:00 AM", true)
        )
        whenever(classRepository.getTodayClasses()).thenReturn(mockClasses)
        
        // When
        viewModel.loadDashboardData()
        
        // Then
        val uiState = viewModel.uiState.value
        assertThat(uiState.isLoading).isFalse()
        assertThat(uiState.todayClasses).isEqualTo(mockClasses)
        assertThat(uiState.error).isNull()
    }
    
    @Test
    fun `when repository throws exception, error state is set`() = runTest {
        // Given
        val errorMessage = "Network error"
        whenever(classRepository.getTodayClasses()).thenThrow(RuntimeException(errorMessage))
        
        // When
        viewModel.loadDashboardData()
        
        // Then
        val uiState = viewModel.uiState.value
        assertThat(uiState.isLoading).isFalse()
        assertThat(uiState.error).isEqualTo(errorMessage)
    }
}
```

### 6.2 UI Testing
```kotlin
// androidTest/presentation/StudentDashboardScreenTest.kt
@RunWith(AndroidJUnit4::class)
@HiltAndroidTest
class StudentDashboardScreenTest {
    
    @get:Rule
    val hiltRule = HiltAndroidRule(this)
    
    @get:Rule
    val composeTestRule = createComposeRule()
    
    @Before
    fun setup() {
        hiltRule.inject()
    }
    
    @Test
    fun dashboardDisplaysCorrectContent() {
        composeTestRule.setContent {
            CoachingAppTheme {
                StudentDashboardScreen(
                    navController = rememberNavController()
                )
            }
        }
        
        // Verify greeting is displayed
        composeTestRule.onNodeWithText("Good morning").assertIsDisplayed()
        
        // Verify schedule section exists
        composeTestRule.onNodeWithText("TODAY'S SCHEDULE").assertIsDisplayed()
        
        // Verify quick actions are present
        composeTestRule.onNodeWithText("Ask Doubt").assertIsDisplayed()
        composeTestRule.onNodeWithText("Submit Work").assertIsDisplayed()
    }
    
    @Test
    fun joinClassButtonWorks() {
        composeTestRule.setContent {
            CoachingAppTheme {
                StudentDashboardScreen(
                    navController = rememberNavController()
                )
            }
        }
        
        // Click on join class button
        composeTestRule.onNodeWithText("JOIN NOW").performClick()
        
        // Verify appropriate action is triggered
        // This would typically involve mocking the ViewModel
    }
}
```

## 7. Performance Optimization

### 7.1 Image Loading Optimization
```kotlin
// components/OptimizedImage.kt
@Composable
fun OptimizedImage(
    url: String,
    contentDescription: String?,
    modifier: Modifier = Modifier,
    placeholder: Int = R.drawable.ic_placeholder,
    error: Int = R.drawable.ic_error
) {
    AsyncImage(
        model = ImageRequest.Builder(LocalContext.current)
            .data(url)
            .crossfade(true)
            .memoryCachePolicy(CachePolicy.ENABLED)
            .diskCachePolicy(CachePolicy.ENABLED)
            .build(),
        placeholder = painterResource(placeholder),
        error = painterResource(error),
        contentDescription = contentDescription,
        modifier = modifier
    )
}
```

### 7.2 List Performance
```kotlin
@Composable
fun OptimizedAssignmentsList(
    assignments: List<Assignment>,
    onAssignmentClick: (Assignment) -> Unit
) {
    LazyColumn(
        verticalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(
            items = assignments,
            key = { it.id } // Important for performance
        ) { assignment ->
            AssignmentCard(
                assignment = assignment,
                onClick = { onAssignmentClick(assignment) },
                modifier = Modifier.animateItemPlacement() // Smooth animations
            )
        }
    }
}
```

This implementation guide provides a comprehensive foundation for building the coaching management platform with proper architecture, performance considerations, and testing strategies.