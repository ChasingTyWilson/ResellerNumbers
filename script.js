class ResellerNumbersAnalytics {
    constructor() {
        this.inventoryData = [];
        this.soldData = [];
        this.unsoldData = [];
        this.analysisResults = {};
        this.soldAnalysisResults = {};
        this.charts = {};
        this.soldCharts = {};
        
        // Data persistence
        this.storedInventoryData = [];
        this.storedSoldData = [];
        this.storedUnsoldData = [];
        this.collections = []; // Collection purchase data
        this.businessMetrics = {
            minutesPerItem: 0,
            taxBracket: 0,
            avgFeePercent: 0,
            idealHourlyRate: 0
        };
        
        this.authListenersSetup = false; // Flag to prevent duplicate listeners
        this.platformSelectorsSetup = false; // Flag for platform selector listeners
        this.imageOptimizerInitialized = false; // Flag for Image Optimizer
        
        this.loadStoredData();
        this.initializeElements();
        this.setupEventListeners();
        this.initializeSupabase();
    }

    async initializeSupabase() {
        console.log('🔧 Initializing Supabase...');
        // Wait a moment for Supabase config to load
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
        // Initialize Supabase service
        const initialized = await supabaseService.initialize();
        if (initialized) {
            console.log('✅ Supabase initialized successfully');
        } else {
            console.warn('⚠️ Supabase not configured - running in demo mode');
        }
        } catch (error) {
            console.error('❌ Error initializing Supabase:', error);
            console.warn('⚠️ Falling back to demo mode');
        }
        
        // Always check auth status (works for both Supabase and demo mode)
        await this.checkAuthStatus();
    }

    setupAuthListeners() {
        // Prevent setting up listeners multiple times
        if (this.authListenersSetup) {
            return;
        }
        
        // Get auth elements
        this.authScreen = document.getElementById('authScreen');
        this.loginFormElement = document.getElementById('loginFormElement');
        this.signupFormElement = document.getElementById('signupFormElement');
        this.loginFormWrapper = document.getElementById('loginForm');
        this.signupFormWrapper = document.getElementById('signupForm');
        this.showSignupBtn = document.getElementById('showSignupBtn');
        this.showLoginBtn = document.getElementById('showLoginBtn');

        // Switch to signup form
        if (this.showSignupBtn) {
            this.showSignupBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.loginFormWrapper.style.display = 'none';
                this.signupFormWrapper.style.display = 'block';
            });
        }

        // Switch to login form
        if (this.showLoginBtn) {
            this.showLoginBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.signupFormWrapper.style.display = 'none';
                this.loginFormWrapper.style.display = 'block';
            });
        }

        // Handle login submission
        if (this.loginFormElement) {
            this.loginFormElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleLogin();
            });
        }

        // Handle signup submission
        if (this.signupFormElement) {
            this.signupFormElement.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.handleSignup();
            });
        }


        // Mark listeners as setup
        this.authListenersSetup = true;
    }

    async checkAuthStatus() {
        console.log('🔍 Checking auth status...');
        // Setup auth listeners first
        this.setupAuthListeners();
        
        // Check if using Supabase
        if (supabaseService && supabaseService.client) {
            console.log('✅ Supabase client available, checking user...');
            const user = await supabaseService.getCurrentUser();
            console.log('Current user:', user);
            if (user) {
                // Check if user is approved
                const profile = await supabaseService.getUserProfile();
                console.log('User profile:', profile);
                if (profile && profile.status === 'active') {
                    // User is logged in and approved with Supabase
                    console.log('✅ User logged in and approved with Supabase, showing app');
                this.showApp();
                return;
                } else if (profile && profile.status === 'pending') {
                    console.log('⚠️ User account is pending approval');
                    alert('Your account is pending approval. Please wait for admin approval before accessing the platform.');
                    return;
                } else if (profile && profile.status === 'suspended') {
                    console.log('⚠️ User account is suspended');
                    alert('Your account has been suspended. Please contact support for assistance.');
                return;
            }
            }
        } else {
            console.log('⚠️ Supabase not available, checking demo mode...');
        }
        
        // Fall back to localStorage check (demo mode)
        const authToken = localStorage.getItem('authToken');
        const userData = localStorage.getItem('userData');
        
        console.log('Demo mode check - authToken:', !!authToken, 'userData:', !!userData);
        
        if (authToken && userData) {
            // User is logged in with demo mode
            console.log('✅ User logged in with demo mode, showing app');
            this.showApp();
        } else {
            console.log('❌ No authentication found, showing auth screen');
        }
        // Otherwise, auth screen is already visible by default
    }

    async handleLogin() {
        const email = document.getElementById('loginEmail').value;
        const password = document.getElementById('loginPassword').value;
        const rememberMe = document.getElementById('rememberMe').checked;

        if (!email || !password) {
            alert('❌ Please enter valid credentials.');
            return;
        }

        // Check if using Supabase
        if (supabaseService && supabaseService.client) {
            try {
            const result = await supabaseService.signIn(email, password);
            
            if (result.success) {
                alert('✅ Login successful! Welcome back.');
                await this.loadUserData();
                this.showApp();
            } else {
                alert('❌ Login failed: ' + result.error);
                }
            } catch (error) {
                console.error('❌ Supabase login error:', error);
                alert('❌ Login failed: ' + error.message);
            }
        } else {
            // Demo mode fallback
            const mockAuthToken = 'demo_token_' + Date.now();
            const mockUserData = {
                email: email,
                name: 'Demo User',
                subscriptionStatus: 'trial',
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            };

            localStorage.setItem('authToken', mockAuthToken);
            localStorage.setItem('userData', JSON.stringify(mockUserData));

            alert('✅ Login successful! (Demo mode)');
            this.showApp();
        }
    }

    async handleSignup() {
        const name = document.getElementById('signupName').value;
        const email = document.getElementById('signupEmail').value;
        const password = document.getElementById('signupPassword').value;
        const passwordConfirm = document.getElementById('signupPasswordConfirm').value;
        const agreeTerms = document.getElementById('agreeTerms').checked;

        console.log('🔍 Starting signup process...');
        console.log('Supabase service available:', !!supabaseService);
        console.log('Supabase client available:', !!(supabaseService && supabaseService.client));

        // Validation
        if (!name || !email || !password || !passwordConfirm) {
            alert('❌ Please fill in all fields.');
            return;
        }

        if (password !== passwordConfirm) {
            alert('❌ Passwords do not match.');
            return;
        }

        if (password.length < 8) {
            alert('❌ Password must be at least 8 characters.');
            return;
        }

        if (!agreeTerms) {
            alert('❌ Please agree to the Terms of Service and Privacy Policy.');
            return;
        }

        // Check if using Supabase
        if (supabaseService && supabaseService.client) {
            console.log('✅ Using Supabase for signup');
            const result = await supabaseService.signUp(email, password, name);
            console.log('Signup result:', result);
            
            if (result.success) {
                alert('✅ Account created successfully! Your account is pending approval. You will receive an email once approved.');
                // Don't auto-login pending users
                alert('Please wait for approval before accessing your account.');
            } else {
                alert('❌ Signup failed: ' + result.error);
            }
        } else {
            console.log('⚠️ Using demo mode fallback');
            // Demo mode fallback
            const mockAuthToken = 'demo_token_' + Date.now();
            const mockUserData = {
                email: email,
                name: name,
                subscriptionStatus: 'trial',
                trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
            };

            localStorage.setItem('authToken', mockAuthToken);
            localStorage.setItem('userData', JSON.stringify(mockUserData));

            alert('✅ Account created successfully! (Demo mode)');
            this.showApp();
        }
    }


    async loadUserData() {
        // Load user data from Supabase if available
        if (supabaseService && supabaseService.client) {
            // Load business metrics
            const metrics = await supabaseService.getBusinessMetrics();
            if (metrics) {
                this.businessMetrics = {
                    minutesPerItem: metrics.minutes_per_item || 0,
                    idealHourlyRate: metrics.ideal_hourly_rate || 0,
                    avgFeePercent: metrics.avg_fee_percent || 0,
                    taxBracket: metrics.tax_bracket || 0
                };
            }

            // Load collections
            const collections = await supabaseService.getCollections();
            if (collections) {
                this.collections = collections.map(c => ({
                    name: c.name,
                    sku: c.sku,
                    purchaseDate: c.purchase_date,
                    cost: c.cost,
                    notes: c.notes,
                    id: c.id
                }));
            }

            // Load latest inventory data
            const inventoryData = await supabaseService.getLatestInventoryData();
            if (inventoryData) {
                this.storedInventoryData = inventoryData.data;
            }

            // Load latest sold data
            const soldData = await supabaseService.getLatestSoldData();
            if (soldData) {
                this.storedSoldData = soldData.data;
            }
        }
    }

    showApp() {
        console.log('🎯 showApp() called');
        // Hide auth screen
        if (this.authScreen) {
            console.log('Hiding auth screen');
            this.authScreen.style.display = 'none';
        } else {
            console.log('⚠️ Auth screen element not found');
        }

        // Show platform selector
        console.log('Showing platform selector');
        this.showPlatformSelector();
    }

    showPlatformSelector() {
        // Hide all screens
        if (this.authScreen) this.authScreen.style.display = 'none';
        if (this.landingPage) this.landingPage.style.display = 'none';
        
        // Show platform selector
        const platformSelector = document.getElementById('platformSelector');
        if (platformSelector) {
            platformSelector.style.display = 'block';
        }

        // Update user email display
        this.updateUserEmailDisplay();

        // Setup platform selector listeners if not already done
        if (!this.platformSelectorsSetup) {
            this.setupPlatformSelectorListeners();
            this.platformSelectorsSetup = true;
        }
    }

    setupPlatformSelectorListeners() {
        // Launch eBay Analytics button
        const ebayAnalyticsCard = document.getElementById('ebayAnalyticsCard');
        if (ebayAnalyticsCard) {
            const launchBtn = ebayAnalyticsCard.querySelector('.platform-launch-btn');
            if (launchBtn) {
                launchBtn.addEventListener('click', () => {
                    this.launchEbayAnalytics();
                });
            }
        }

        // Launch Image Optimizer button
        const imageOptimizerCard = document.getElementById('imageOptimizerCard');
        if (imageOptimizerCard) {
            const launchBtn = imageOptimizerCard.querySelector('.platform-launch-btn');
            if (launchBtn) {
                launchBtn.addEventListener('click', () => {
                    this.launchImageOptimizer();
                });
            }
        }

        // Logout button
        const logoutBtn = document.getElementById('logoutBtn');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', async () => {
                await this.handleLogout();
            });
        }
    }

    launchImageOptimizer() {
        // Hide platform selector
        const platformSelector = document.getElementById('platformSelector');
        if (platformSelector) {
            platformSelector.style.display = 'none';
        }

        // Show Image Optimizer
        const imageOptimizer = document.getElementById('imageOptimizer');
        if (imageOptimizer) {
            imageOptimizer.style.display = 'block';
        }

        // Initialize Image Optimizer if not already done
        if (!this.imageOptimizerInitialized) {
            this.initializeImageOptimizer();
            this.imageOptimizerInitialized = true;
        }
    }

    launchEbayAnalytics() {
        // Hide platform selector
        const platformSelector = document.getElementById('platformSelector');
        if (platformSelector) {
            platformSelector.style.display = 'none';
        }

        // Show landing page (data upload page)
        if (this.landingPage) {
            this.landingPage.style.display = 'block';
        }

        // Update header with user info
        this.updateHeaderWithUserInfo();
    }

    async updateUserEmailDisplay() {
        const userEmailDisplay = document.getElementById('userEmailDisplay');
        if (!userEmailDisplay) return;

        // Try to get user from Supabase
        if (supabaseService && supabaseService.client) {
            const user = await supabaseService.getCurrentUser();
            if (user && user.email) {
                userEmailDisplay.textContent = user.email;
                return;
            }
        }

        // Fall back to localStorage
        const userData = localStorage.getItem('userData');
        if (userData) {
            try {
                const parsed = JSON.parse(userData);
                userEmailDisplay.textContent = parsed.email || 'user@example.com';
            } catch (e) {
                userEmailDisplay.textContent = 'user@example.com';
            }
        }
    }

    async handleLogout() {
        const confirmed = confirm('Are you sure you want to sign out?');
        if (!confirmed) return;

        // Logout from Supabase if using it
        if (supabaseService && supabaseService.client) {
            await supabaseService.signOut();
        }

        // Clear local storage
        localStorage.removeItem('authToken');
        localStorage.removeItem('userData');

        // Hide all screens
        const platformSelector = document.getElementById('platformSelector');
        if (platformSelector) platformSelector.style.display = 'none';
        if (this.landingPage) this.landingPage.style.display = 'none';

        // Show auth screen
        if (this.authScreen) {
            this.authScreen.style.display = 'flex';
        }

        // Reset to login form
        if (this.loginFormWrapper) this.loginFormWrapper.style.display = 'block';
        if (this.signupFormWrapper) this.signupFormWrapper.style.display = 'none';

        alert('✅ You have been signed out successfully.');
    }

    async updateHeaderWithUserInfo() {
        let userData = null;
        
        // Get user data from Supabase or localStorage
        if (supabaseService && supabaseService.client) {
            const profile = await supabaseService.getUserProfile();
            if (profile) {
                userData = {
                    email: profile.email,
                    name: profile.full_name || 'User',
                    subscriptionStatus: profile.subscription_status
                };
            }
        } else {
            const stored = localStorage.getItem('userData');
            if (stored) userData = JSON.parse(stored);
        }

        if (userData) {
            const header = document.querySelector('.header');
            if (header) {
                // Add logout button
                const logoutBtn = document.createElement('button');
                logoutBtn.className = 'btn btn-secondary btn-small';
                logoutBtn.textContent = 'Logout';
                logoutBtn.style.cssText = 'position: absolute; top: 20px; right: 20px;';
                logoutBtn.addEventListener('click', () => this.handleLogout());
                
                if (!document.querySelector('.logout-btn')) {
                    logoutBtn.classList.add('logout-btn');
                    header.style.position = 'relative';
                    header.appendChild(logoutBtn);
                }
            }
        }
    }

    async handleLogout() {
        if (confirm('Are you sure you want to logout?')) {
            // Logout from Supabase if available
            if (supabaseService && supabaseService.client) {
                await supabaseService.signOut();
            }
            
            // Clear localStorage
            localStorage.removeItem('authToken');
            localStorage.removeItem('userData');
            
            // Reload page to show auth screen
            window.location.reload();
        }
    }

    initializeElements() {
        // Landing page elements
        this.landingPage = document.getElementById('landingPage');
        this.executiveDashboard = document.getElementById('executiveDashboard');
        this.inventoryDashboard = document.getElementById('inventoryDashboard');
        this.salesDashboard = document.getElementById('salesDashboard');

        // Upload elements
        this.inventoryUploadArea = document.getElementById('inventoryUploadArea');
        this.inventoryFileInput = document.getElementById('inventoryFileInput');
        this.inventoryFileStatus = document.getElementById('inventoryFileStatus');
        
        this.soldUploadArea = document.getElementById('soldUploadArea');
        this.soldFileInput = document.getElementById('soldFileInput');
        this.soldFileStatus = document.getElementById('soldFileStatus');

        // Action buttons
        this.analyzeBtn = document.getElementById('analyzeBtn');
        this.loadSampleDataBtn = document.getElementById('loadSampleDataBtn');

        // Executive dashboard elements
        this.execTotalValue = document.getElementById('execTotalValue');
        this.execTotalRevenue = document.getElementById('execTotalRevenue');
        this.execActiveListings = document.getElementById('execActiveListings');
        this.execCollections = document.getElementById('execCollections');
        this.execAvgDaysListed = document.getElementById('execAvgDaysListed');
        this.execAvgValuePerItem = document.getElementById('execAvgValuePerItem');
        this.exec30Plus = document.getElementById('exec30Plus');
        this.exec60Plus = document.getElementById('exec60Plus');
        this.exec90Plus = document.getElementById('exec90Plus');
        this.execTotalSales = document.getElementById('execTotalSales');
        this.execAvgSalePrice = document.getElementById('execAvgSalePrice');
        this.execTopRevenueMonth = document.getElementById('execTopRevenueMonth');
        this.execAnnualRunRate = document.getElementById('execAnnualRunRate');

        // Navigation buttons
        this.viewInventoryBtn = document.getElementById('viewInventoryBtn');
        this.viewSalesBtn = document.getElementById('viewSalesBtn');
        this.viewCollectionsBtn = document.getElementById('viewCollectionsBtn');
        this.backToExecutiveBtn = document.getElementById('backToExecutiveBtn');
        this.backToExecutiveBtn2 = document.getElementById('backToExecutiveBtn2');
        
        // Clickable metric cards
        this.execTotalValueCard = document.getElementById('execTotalValueCard');
        this.execTotalRevenueCard = document.getElementById('execTotalRevenueCard');
        this.execActiveListingsCard = document.getElementById('execActiveListingsCard');
        this.execCollectionsCard = document.getElementById('execCollectionsCard');

        // Dashboard elements
        this.dashboard = document.getElementById('dashboard');
        this.totalListings = document.getElementById('totalListings');
        this.totalValue = document.getElementById('totalValue');
        this.avgDaysListed = document.getElementById('avgDaysListed');
        this.avgValuePerItem = document.getElementById('avgValuePerItem');
        this.items30Plus = document.getElementById('items30Plus');
        this.items60Plus = document.getElementById('items60Plus');
        this.items90Plus = document.getElementById('items90Plus');

        // Sold dashboard elements
        this.soldDashboard = document.getElementById('soldDashboard');
        this.totalSales = document.getElementById('totalSales');
        this.totalRevenue = document.getElementById('totalRevenue');
        this.avgSalePrice = document.getElementById('avgSalePrice');
        this.avgRevenuePerDay = document.getElementById('avgRevenuePerDay');
        
        // Clickable sales cards
        this.totalSalesCard = document.getElementById('totalSalesCard');
        this.totalRevenueCard = document.getElementById('totalRevenueCard');
        
        // Profitability metric elements
        this.totalCollectionProfits = document.getElementById('totalCollectionProfits');
        this.avgDaysToBreakEven = document.getElementById('avgDaysToBreakEven');
        this.avgHoursPerCollection = document.getElementById('avgHoursPerCollection');
        this.avgGrossHourlyRate = document.getElementById('avgGrossHourlyRate');
        
        // Sales table elements
        this.salesSearchInput = document.getElementById('salesSearchInput');
        this.salesTableBody = document.getElementById('salesTableBody');
        this.salesTableCount = document.getElementById('salesTableCount');
        this.sortByDate = document.getElementById('sortByDate');
        this.sortByPrice = document.getElementById('sortByPrice');
        this.sortByName = document.getElementById('sortByName');
        this.sortBySKU = document.getElementById('sortBySKU');
        
        // Track current sort state
        this.currentSalesData = [];
        this.filteredSalesData = [];
        this.currentSortField = 'date';
        this.currentSortDirection = 'desc';

        // Chart elements
        this.pricingChart = document.getElementById('pricingChart');
        this.sellThroughChart = document.getElementById('sellThroughChart');
        this.salesChart = document.getElementById('salesChart');
        this.topItemsChart = document.getElementById('topItemsChart');

        // Analysis elements
        this.longestListedItems = document.getElementById('longestListedItems');
        this.mostWatchedItems = document.getElementById('mostWatchedItems');

        // Tab elements
        this.tabBtns = document.querySelectorAll('.tab-btn');
        this.tabPanels = document.querySelectorAll('.tab-panel');

        // Export elements
        this.exportCSV = document.getElementById('exportCSV');
        this.exportPDF = document.getElementById('exportPDF');

        // Collection details elements
        this.collectionDetails = document.getElementById('collectionDetails');
        this.collectionsGrid = document.getElementById('collectionsGrid');
        this.backToCollectionsBtn = document.getElementById('backToCollectionsBtn');
        this.collectionDetailsTitle = document.getElementById('collectionDetailsTitle');
        this.collectionDetailTotalRevenue = document.getElementById('collectionDetailTotalRevenue');
        this.collectionDetailTotalSales = document.getElementById('collectionDetailTotalSales');
        this.collectionDetailAvgPrice = document.getElementById('collectionDetailAvgPrice');
        this.collectionDetailDaysRunning = document.getElementById('collectionDetailDaysRunning');
        this.collectionRevenueChart = document.getElementById('collectionRevenueChart');
        this.collectionSalesList = document.getElementById('collectionSalesList');
        this.sortPriceHighBtn = document.getElementById('sortPriceHighBtn');
        this.sortPriceLowBtn = document.getElementById('sortPriceLowBtn');
        this.collectionPriceRangeAnalysis = document.getElementById('collectionPriceRangeAnalysis');
        
        // Profitability metric elements
        this.collectionProfitabilityMetrics = document.getElementById('collectionProfitabilityMetrics');
        this.collectionPurchaseCost = document.getElementById('collectionPurchaseCost');
        this.collectionGrossProfit = document.getElementById('collectionGrossProfit');
        this.collectionHoursWorked = document.getElementById('collectionHoursWorked');
        this.collectionNetProfit = document.getElementById('collectionNetProfit');
        this.collectionNetProfitSubtext = document.getElementById('collectionNetProfitSubtext');
        this.collectionEffectiveRate = document.getElementById('collectionEffectiveRate');
        this.collectionTotalFees = document.getElementById('collectionTotalFees');
        
        // Collection Management elements
        this.collectionManagement = document.getElementById('collectionManagement');
        this.manageCollectionsBtn = document.getElementById('manageCollectionsBtn');
        this.backToExecFromCollections = document.getElementById('backToExecFromCollections');
        this.collectionForm = document.getElementById('collectionForm');
        this.resetCollectionForm = document.getElementById('resetCollectionForm');
        this.savedCollectionsList = document.getElementById('savedCollectionsList');
        
        // Quick collection entry form (in collection details view)
        this.quickCollectionForm = document.getElementById('quickCollectionForm');
        this.quickClearBtn = document.getElementById('quickClearBtn');
        
        console.log('Collection Management elements:');
        console.log('collectionManagement:', this.collectionManagement);
        console.log('manageCollectionsBtn:', this.manageCollectionsBtn);
        
        // Business Settings elements
        this.businessSettings = document.getElementById('businessSettings');
        this.businessSettingsBtn = document.getElementById('businessSettingsBtn');
        this.backToExecFromSettings = document.getElementById('backToExecFromSettings');
        this.businessMetricsForm = document.getElementById('businessMetricsForm');
        this.clearDataBtn = document.getElementById('clearDataBtn');
        
        console.log('Business Settings elements:');
        console.log('businessSettings:', this.businessSettings);
        console.log('businessSettingsBtn:', this.businessSettingsBtn);
        
        // Settings display elements
        this.displayMinutesPerItem = document.getElementById('displayMinutesPerItem');
        this.displayHourlyRate = document.getElementById('displayHourlyRate');
        this.displayFeePercent = document.getElementById('displayFeePercent');
        this.displayTaxBracket = document.getElementById('displayTaxBracket');
        
        // Debug: Log all collection elements
        console.log('Collection elements found:');
        console.log('collectionDetails:', this.collectionDetails);
        console.log('collectionsGrid:', this.collectionsGrid);
        console.log('backToCollectionsBtn:', this.backToCollectionsBtn);
        console.log('sortPriceHighBtn:', this.sortPriceHighBtn);
        console.log('sortPriceLowBtn:', this.sortPriceLowBtn);
        
        // Test if elements exist
        if (this.backToCollectionsBtn) {
            console.log('✅ Back button found');
        } else {
            console.log('❌ Back button NOT found');
        }
        
        if (this.sortPriceHighBtn) {
            console.log('✅ Sort high button found');
        } else {
            console.log('❌ Sort high button NOT found');
        }
        
        if (this.sortPriceLowBtn) {
            console.log('✅ Sort low button found');
        } else {
            console.log('❌ Sort low button NOT found');
        }
        
        // Annual Business Review elements
        this.execTabBtns = document.querySelectorAll('.exec-tab-btn');
        this.execTabContents = document.querySelectorAll('.exec-tab-content');
        this.monthsGrid = document.getElementById('monthsGrid');
        this.weeklyBarChart = document.getElementById('weeklyBarChart');
        this.annualReviewMain = document.getElementById('annualReviewMain');
        this.monthlyDetailView = document.getElementById('monthlyDetailView');
        this.weeklyDetailView = document.getElementById('weeklyDetailView');
        this.backToAnnualBtn = document.getElementById('backToAnnualBtn');
        this.backToAnnualFromWeekBtn = document.getElementById('backToAnnualFromWeekBtn');
        
        // Monthly detail elements
        this.monthlyDetailTitle = document.getElementById('monthlyDetailTitle');
        this.monthlyTotalSales = document.getElementById('monthlyTotalSales');
        this.monthlyItemsSold = document.getElementById('monthlyItemsSold');
        this.monthlyAvgDaily = document.getElementById('monthlyAvgDaily');
        this.monthlyBestDay = document.getElementById('monthlyBestDay');
        this.monthlyDailyChart = document.getElementById('monthlyDailyChart');
        this.monthlyDailyPerformanceChart = document.getElementById('monthlyDailyPerformanceChart');
        this.monthlyTopItemsBody = document.getElementById('monthlyTopItemsBody');
        
        // Weekly detail elements
        this.weeklyDetailTitle = document.getElementById('weeklyDetailTitle');
        this.weeklyTotalSales = document.getElementById('weeklyTotalSales');
        this.weeklyItemsSold = document.getElementById('weeklyItemsSold');
        this.weeklyAvgDaily = document.getElementById('weeklyAvgDaily');
        this.weeklyBestDay = document.getElementById('weeklyBestDay');
        this.weeklyDailyChart = document.getElementById('weeklyDailyChart');
        this.weeklyItemsBody = document.getElementById('weeklyItemsBody');
        
        // Initialize Annual Business Review data
        this.monthlyData = [];
        this.weeklyData = [];
        this.weeklyBarChartInstance = null;
        
        // Current snapshot elements (enhanced)
        this.currentMonthDate = document.getElementById('currentMonthDate');
        this.daysRemainingText = document.getElementById('daysRemainingText');
        this.currentMonthSales = document.getElementById('currentMonthSales');
        this.currentMonthRanking = document.getElementById('currentMonthRanking');
        this.currentMonthItemsSold = document.getElementById('currentMonthItemsSold');
        this.currentMonthItemsSubtext = document.getElementById('currentMonthItemsSubtext');
        this.currentMonthRunRate = document.getElementById('currentMonthRunRate');
        this.runRateRanking = document.getElementById('runRateRanking');
        this.currentMonthAvgPrice = document.getElementById('currentMonthAvgPrice');
        this.avgPriceRanking = document.getElementById('avgPriceRanking');
        
        // Store Snapshot elements
        this.sellThroughRate30 = document.getElementById('sellThroughRate30');
        this.avgSellThroughRate = document.getElementById('avgSellThroughRate');
        this.unsoldFileInput = document.getElementById('unsoldFileInput');
        this.unsoldFileStatus = document.getElementById('unsoldFileStatus');
        
        // Card Cropper elements
        this.cardCropper = document.getElementById('cardCropper');
        this.cardCropperBtn = document.getElementById('cardCropperBtn');
        this.backToExecFromCropper = document.getElementById('backToExecFromCropper');
        this.cropperUploadArea = document.getElementById('cropperUploadArea');
        this.cropperFileInput = document.getElementById('cropperFileInput');
        this.cropperFileList = document.getElementById('cropperFileList');
        this.cardTypeSelect = document.getElementById('cardType');
        this.startingNumberInput = document.getElementById('startingNumber');
        this.cropMarginInput = document.getElementById('cropMargin');
        this.whiteBorderInput = document.getElementById('whiteBorder');
        this.processScansBtn = document.getElementById('processScansBtn');
        this.clearScansBtn = document.getElementById('clearScansBtn');
        this.cropperProgress = document.getElementById('cropperProgress');
        this.cropperProgressBar = document.getElementById('cropperProgressBar');
        this.cropperProgressText = document.getElementById('cropperProgressText');
        this.cropperPreview = document.getElementById('cropperPreview');
        this.cropperPreviewGrid = document.getElementById('cropperPreviewGrid');
        this.downloadAllBtn = document.getElementById('downloadAllBtn');
        
        // Card Cropper data
        this.uploadedScans = [];
        this.croppedCards = [];
        
        // Secret Analysis elements
        this.daysOfWeekGrid = document.getElementById('daysOfWeekGrid');
        this.keywordsContainer = document.getElementById('keywordsContainer');
        this.usaMap = document.getElementById('usaMap');
        this.stateRankings = document.getElementById('stateRankings');
        this.insightsGrid = document.getElementById('insightsGrid');
        
        // Customer Retention Dashboard elements
        this.currentBusinessValue = document.getElementById('currentBusinessValue');
        this.currentNewCustomerRevenue = document.getElementById('currentNewCustomerRevenue');
        this.currentRepeatCustomerRevenue = document.getElementById('currentRepeatCustomerRevenue');
        this.noRepeatBusinessValue = document.getElementById('noRepeatBusinessValue');
        this.noRepeatRevenue = document.getElementById('noRepeatRevenue');
        this.lostRevenue = document.getElementById('lostRevenue');
        this.reducedBusinessValue = document.getElementById('reducedBusinessValue');
        this.reducedNewRevenue = document.getElementById('reducedNewRevenue');
        this.reducedRepeatRevenue = document.getElementById('reducedRepeatRevenue');
        this.retentionValueInsight = document.getElementById('retentionValueInsight');
        this.avgCLV = document.getElementById('avgCLV');
        this.repeatCLV = document.getElementById('repeatCLV');
        this.oneTimeCLV = document.getElementById('oneTimeCLV');
        this.projectedCLV = document.getElementById('projectedCLV');
        this.monthlyRetention = document.getElementById('monthlyRetention');
        this.monthlyRetentionDetail = document.getElementById('monthlyRetentionDetail');
        this.quarterlyRetention = document.getElementById('quarterlyRetention');
        this.quarterlyRetentionDetail = document.getElementById('quarterlyRetentionDetail');
        this.repeatPurchaseRate = document.getElementById('repeatPurchaseRate');
        this.repeatPurchaseDetail = document.getElementById('repeatPurchaseDetail');
        
        // Repeat Customer Analysis elements
        this.repeatCustomerCount = document.getElementById('repeatCustomerCount');
        this.repeatCustomerPercent = document.getElementById('repeatCustomerPercent');
        this.repeatCustomerRevenue = document.getElementById('repeatCustomerRevenue');
        this.repeatRevenuePercent = document.getElementById('repeatRevenuePercent');
        this.repeatCustomerOrders = document.getElementById('repeatCustomerOrders');
        this.repeatOrdersPercent = document.getElementById('repeatOrdersPercent');
        this.repeatCustomerCLV = document.getElementById('repeatCustomerCLV');
        this.oneTimeCustomerValue = document.getElementById('oneTimeCustomerValue');
        this.repeatCustomerCount2 = document.getElementById('repeatCustomerCount2');
        this.oneTimeCustomerCount2 = document.getElementById('oneTimeCustomerCount2');
        this.orderValueInsight = document.getElementById('orderValueInsight');
        this.avgDays1to2 = document.getElementById('avgDays1to2');
        this.avgDays2to3 = document.getElementById('avgDays2to3');
        this.avgDays3to4 = document.getElementById('avgDays3to4');
        this.loyaltyDistributionChart = document.getElementById('loyaltyDistributionChart');
        this.topRepeatCustomersBody = document.getElementById('topRepeatCustomersBody');
        this.repeatCustomerInsights = document.getElementById('repeatCustomerInsights');
        
        // Initialize Secret Analysis data
        this.dayOfWeekData = [];
        this.keywordData = [];
        this.stateData = [];
        this.repeatCustomerData = null;
        this.retentionData = null;
        this.loyaltyChartInstance = null;
        
        // CSV Help Modal elements
        this.csvHelpModal = document.getElementById('csvHelpModal');
        this.showCsvHelpBtn = document.getElementById('showCsvHelp');
        this.closeCsvHelpBtn = document.getElementById('closeCsvHelp');
        this.closeCsvHelpBtn2 = document.getElementById('closeCsvHelpBtn');
    }

    setupEventListeners() {
        // Upload events
        if (this.inventoryUploadArea) {
            this.inventoryUploadArea.addEventListener('click', () => this.inventoryFileInput.click());
            this.inventoryUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e, this.inventoryUploadArea));
            this.inventoryUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e, this.inventoryUploadArea));
            this.inventoryUploadArea.addEventListener('drop', (e) => this.handleDrop(e, 'inventory'));
        }
        
        if (this.inventoryFileInput) {
            this.inventoryFileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'inventory'));
        }

        if (this.soldUploadArea) {
            this.soldUploadArea.addEventListener('click', () => this.soldFileInput.click());
            this.soldUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e, this.soldUploadArea));
            this.soldUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e, this.soldUploadArea));
            this.soldUploadArea.addEventListener('drop', (e) => this.handleDrop(e, 'sold'));
        }
        
        if (this.soldFileInput) {
            this.soldFileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'sold'));
        }
        
        // Unsold file upload
        if (this.unsoldFileInput) {
            this.unsoldFileInput.addEventListener('change', (e) => this.handleFileSelect(e, 'unsold'));
        }

        // Action buttons
        if (this.analyzeBtn) {
            this.analyzeBtn.addEventListener('click', () => this.generateAnalytics());
        }
        if (this.loadSampleDataBtn) {
            this.loadSampleDataBtn.addEventListener('click', () => this.loadSampleData());
        }

        // Navigation buttons
        if (this.viewInventoryBtn) {
            this.viewInventoryBtn.addEventListener('click', () => this.showInventoryDashboard());
        }
        if (this.viewSalesBtn) {
            this.viewSalesBtn.addEventListener('click', () => this.showSalesDashboard());
        }
        if (this.viewCollectionsBtn) {
            this.viewCollectionsBtn.addEventListener('click', () => this.showSalesDashboard('collection-performance'));
        }
        if (this.backToExecutiveBtn) {
            this.backToExecutiveBtn.addEventListener('click', () => this.showExecutiveDashboard());
        }
        if (this.backToExecutiveBtn2) {
            this.backToExecutiveBtn2.addEventListener('click', () => this.showExecutiveDashboard());
        }
        
        // Clickable metric cards (Executive Dashboard)
        if (this.execTotalValueCard) {
            this.execTotalValueCard.addEventListener('click', () => this.showInventoryDashboard());
        }
        if (this.execTotalRevenueCard) {
            this.execTotalRevenueCard.addEventListener('click', () => this.showSalesDashboard());
        }
        if (this.execActiveListingsCard) {
            this.execActiveListingsCard.addEventListener('click', () => this.showInventoryDashboard());
        }
        if (this.execCollectionsCard) {
            this.execCollectionsCard.addEventListener('click', () => this.showSalesDashboard('collection-performance'));
        }
        
        // Clickable sales cards (Sales Analytics Dashboard)
        if (this.totalSalesCard) {
            this.totalSalesCard.addEventListener('click', () => this.switchTab('sales-performance'));
        }
        if (this.totalRevenueCard) {
            this.totalRevenueCard.addEventListener('click', () => this.switchTab('sales-performance'));
        }
        
        // Sales table search and sort
        if (this.salesSearchInput) {
            this.salesSearchInput.addEventListener('input', (e) => this.filterSalesTable(e.target.value));
        }
        if (this.sortByDate) {
            this.sortByDate.addEventListener('click', () => this.sortSalesTable('date'));
        }
        if (this.sortByPrice) {
            this.sortByPrice.addEventListener('click', () => this.sortSalesTable('price'));
        }
        if (this.sortByName) {
            this.sortByName.addEventListener('click', () => this.sortSalesTable('name'));
        }
        if (this.sortBySKU) {
            this.sortBySKU.addEventListener('click', () => this.sortSalesTable('sku'));
        }

        // Tab events
        if (this.tabBtns && this.tabBtns.length > 0) {
            this.tabBtns.forEach(btn => {
                btn.addEventListener('click', (e) => this.switchTab(e.target.dataset.tab));
            });
        }

        // Export events
        if (this.exportCSV) {
            this.exportCSV.addEventListener('click', () => this.exportToCSV());
        }
        if (this.exportPDF) {
            this.exportPDF.addEventListener('click', () => this.exportToPDF());
        }
        
        // CSV Help Modal events
        if (this.showCsvHelpBtn) {
            this.showCsvHelpBtn.addEventListener('click', () => this.showCsvHelp());
        }
        if (this.closeCsvHelpBtn) {
            this.closeCsvHelpBtn.addEventListener('click', () => this.hideCsvHelp());
        }
        if (this.closeCsvHelpBtn2) {
            this.closeCsvHelpBtn2.addEventListener('click', () => this.hideCsvHelp());
        }

        // Collection details events - using event delegation
        document.addEventListener('click', (e) => {
            if (e.target && e.target.id === 'backToCollectionsBtn') {
                console.log('Back button clicked via delegation');
                this.showCollectionGrid();
            }
            if (e.target && e.target.id === 'sortPriceHighBtn') {
                console.log('Sort high to low clicked via delegation');
                this.sortSalesByPrice('high');
            }
            if (e.target && e.target.id === 'sortPriceLowBtn') {
                console.log('Sort low to high clicked via delegation');
                this.sortSalesByPrice('low');
            }
        });
        
        // Also try direct event listeners as backup
        if (this.backToCollectionsBtn) {
            this.backToCollectionsBtn.addEventListener('click', () => {
                console.log('Back button clicked via direct listener');
                this.showCollectionGrid();
            });
        } else {
            console.error('backToCollectionsBtn not found');
        }
        
        if (this.sortPriceHighBtn) {
            this.sortPriceHighBtn.addEventListener('click', () => {
                console.log('Sort high to low clicked via direct listener');
                this.sortSalesByPrice('high');
            });
        } else {
            console.error('sortPriceHighBtn not found');
        }
        
        if (this.sortPriceLowBtn) {
            this.sortPriceLowBtn.addEventListener('click', () => {
                console.log('Sort low to high clicked via direct listener');
                this.sortSalesByPrice('low');
            });
        } else {
            console.error('sortPriceLowBtn not found');
        }
        
        // Collection Management events
        if (this.manageCollectionsBtn) {
            this.manageCollectionsBtn.addEventListener('click', () => this.showCollectionManagement());
        }
        if (this.backToExecFromCollections) {
            this.backToExecFromCollections.addEventListener('click', () => this.showExecutiveDashboard());
        }
        if (this.collectionForm) {
            this.collectionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleCollectionFormSubmit();
            });
        }
        if (this.resetCollectionForm) {
            this.resetCollectionForm.addEventListener('click', () => this.clearCollectionForm());
        }
        
        // Quick collection form events
        if (this.quickCollectionForm) {
            this.quickCollectionForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleQuickCollectionSubmit();
            });
        }
        if (this.quickClearBtn) {
            this.quickClearBtn.addEventListener('click', () => this.clearQuickCollectionForm());
        }
        
        // Business Settings events
        if (this.businessSettingsBtn) {
            this.businessSettingsBtn.addEventListener('click', () => this.showBusinessSettings());
        }
        if (this.backToExecFromSettings) {
            this.backToExecFromSettings.addEventListener('click', () => this.showExecutiveDashboard());
        }
        if (this.businessMetricsForm) {
            this.businessMetricsForm.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleBusinessMetricsSubmit();
            });
        }
        if (this.clearDataBtn) {
            this.clearDataBtn.addEventListener('click', () => this.clearAllData());
        }
        
        // Card Cropper events
        if (this.cardCropperBtn) {
            this.cardCropperBtn.addEventListener('click', () => this.showCardCropper());
        }
        if (this.backToExecFromCropper) {
            this.backToExecFromCropper.addEventListener('click', () => this.showExecutiveDashboard());
        }
        if (this.cropperUploadArea) {
            this.cropperUploadArea.addEventListener('click', () => this.cropperFileInput.click());
            this.cropperUploadArea.addEventListener('dragover', (e) => this.handleCropperDragOver(e));
            this.cropperUploadArea.addEventListener('dragleave', (e) => this.handleCropperDragLeave(e));
            this.cropperUploadArea.addEventListener('drop', (e) => this.handleCropperDrop(e));
        }
        if (this.cropperFileInput) {
            this.cropperFileInput.addEventListener('change', (e) => this.handleCropperFileSelect(e));
        }
        if (this.processScansBtn) {
            this.processScansBtn.addEventListener('click', () => this.processScans());
        }
        if (this.clearScansBtn) {
            this.clearScansBtn.addEventListener('click', () => this.clearCropperData());
        }
        if (this.downloadAllBtn) {
            this.downloadAllBtn.addEventListener('click', () => this.downloadAllCards());
        }
        
        // Executive Dashboard Tab switching
        if (this.execTabBtns) {
            this.execTabBtns.forEach(btn => {
                btn.addEventListener('click', () => {
                    const tabName = btn.getAttribute('data-tab');
                    this.switchExecTab(tabName);
                });
            });
        }
        
        // Annual Business Review navigation
        if (this.backToAnnualBtn) {
            this.backToAnnualBtn.addEventListener('click', () => this.showAnnualReviewMain());
        }
        if (this.backToAnnualFromWeekBtn) {
            this.backToAnnualFromWeekBtn.addEventListener('click', () => this.showAnnualReviewMain());
        }
        
        // Browser back button warning
        window.addEventListener('popstate', (event) => {
            if (this.soldData.length > 0 || this.inventoryData.length > 0) {
                const confirmed = confirm('Are you sure you want to leave? You will lose your eBay data from this session.');
                if (!confirmed) {
                    event.preventDefault();
                    window.history.pushState(null, null, window.location.href);
                }
            }
        });
        
        // Push initial state to history
        window.history.pushState(null, null, window.location.href);
    }

    handleDragOver(e, area) {
        e.preventDefault();
        area.classList.add('dragover');
    }

    handleDragLeave(e, area) {
        e.preventDefault();
        area.classList.remove('dragover');
    }

    handleDrop(e, type) {
        e.preventDefault();
        const area = type === 'inventory' ? this.inventoryUploadArea : this.soldUploadArea;
        area.classList.remove('dragover');
        const files = Array.from(e.dataTransfer.files);
        this.handleFileSelect({ target: { files } }, type);
    }

    handleFileSelect(e, type) {
        const files = Array.from(e.target.files);
        if (files.length > 0) {
            this.processFile(files[0], type);
        }
    }

    async processFile(file, type) {
        if (!file.name.endsWith('.csv')) {
            this.showFileStatus(type, 'error', 'Please select a CSV file');
            return;
        }

        // Show progress bar for sold files
        if (type === 'sold') {
            this.showSoldProgressBar();
            this.updateSoldProgress(10, 'Reading file...');
        }

        try {
            const csvText = await this.readFileAsText(file);
            let data;
            
            if (type === 'sold') {
                this.updateSoldProgress(30, 'Parsing CSV data...');
            }
            
            if (type === 'inventory') {
                data = this.parseInventoryCSV(csvText);
            } else if (type === 'sold') {
                data = this.parseSoldCSV(csvText);
            } else if (type === 'unsold') {
                data = this.parseUnsoldCSV(csvText);
            }
            
            if (data.length === 0) {
                this.showFileStatus(type, 'error', 'No valid data found in CSV file');
                if (type === 'sold') {
                    this.hideSoldProgressBar();
                }
                return;
            }

            if (type === 'sold') {
                this.updateSoldProgress(60, 'Analyzing data...');
            }

            if (type === 'inventory') {
                this.inventoryData = data;
                this.storedInventoryData = data;
                
                // Sync to Supabase if available
                await this.syncDataToSupabase(data, 'inventory');
            } else if (type === 'sold') {
                this.soldData = data;
                this.storedSoldData = data;
                
                // Sync to Supabase if available
                await this.syncDataToSupabase(data, 'sold');
            } else if (type === 'unsold') {
                this.unsoldData = data;
                this.storedUnsoldData = data;
                localStorage.setItem('ebay_unsold_data', JSON.stringify(data));
                
                // Sync to Supabase if available
                await this.syncDataToSupabase(data, 'unsold');
            }

            this.checkReadyToAnalyze();
            
            // Re-calculate sell-through rate if we're on the annual review tab
            if (type === 'unsold' && this.soldData.length > 0) {
                this.populateStoreSnapshot();
            }
            
            // Complete progress for sold files
            if (type === 'sold') {
                this.updateSoldProgress(100, 'Complete!');
                setTimeout(() => this.hideSoldProgressBar(), 2000);
            }
        } catch (error) {
            console.error('Error processing file:', error);
            this.showFileStatus(type, 'error', `Error processing file: ${error.message}`);
            if (type === 'sold') {
                this.updateSoldProgress(0, 'Error processing file', true);
                setTimeout(() => this.hideSoldProgressBar(), 3000);
            }
        }
    }

    showFileStatus(type, status, message) {
        let statusElement;
        if (type === 'inventory') {
            statusElement = this.inventoryFileStatus;
        } else if (type === 'sold') {
            statusElement = this.soldFileStatus;
        } else if (type === 'unsold') {
            statusElement = this.unsoldFileStatus;
        }
        
        if (statusElement) {
        statusElement.className = `file-status ${status}`;
        statusElement.textContent = message;
        }
    }

    async syncDataToSupabase(data, type) {
        // Only sync if Supabase is available and user is logged in
        if (!supabaseService || !supabaseService.client) {
            console.log('Supabase not available - skipping data sync');
            this.showFileStatus(type, 'success', `${data.length} items loaded successfully (session only)`);
            return;
        }

        try {
            // Update progress bar instead of showing sync message
            if (type === 'inventory') {
                this.updateInventoryProgress(70, 'Syncing to cloud...');
            } else if (type === 'sold') {
                this.updateSoldProgress(70, 'Syncing to cloud...');
            }
            
            console.log(`🔄 Starting sync for ${type} with ${data.length} items`);
            
            let result;
            // Add timeout to prevent hanging
            const syncPromise = (() => {
                if (type === 'inventory') {
                    return supabaseService.syncInventoryHistory(data);
                } else if (type === 'sold') {
                    return supabaseService.syncSalesHistory(data);
                } else if (type === 'unsold') {
                    return supabaseService.syncUnsoldHistory(data);
                }
            })();
            
            const timeoutPromise = new Promise((_, reject) => {
                setTimeout(() => reject(new Error('Sync timeout - operation took too long')), 30000); // 30 second timeout
            });
            
            result = await Promise.race([syncPromise, timeoutPromise]);
            console.log('Sync result:', result);

            if (result && result.success) {
                const stats = result.stats;
                
                // Update progress bar to show sync complete
                if (type === 'inventory') {
                    this.updateInventoryProgress(85, 'Sync complete!');
                } else if (type === 'sold') {
                    this.updateSoldProgress(85, 'Sync complete!');
                }
                
                if (type === 'inventory') {
                    this.showFileStatus(type, 'success', `${data.length} items loaded | ${stats.newItems} new, ${stats.updatedItems} updated`);
                } else if (type === 'sold') {
                    this.showFileStatus(type, 'success', `${data.length} sales loaded | ${stats.newSales} new`);
                } else if (type === 'unsold') {
                    this.showFileStatus(type, 'success', `${data.length} unsold loaded | ${stats.newUnsold} new`);
                }

                // Show detailed summary in console
                console.log(summaryMessage);
                
                // Show errors if any
                if (stats.errors && stats.errors.length > 0) {
                    console.warn(`⚠️ ${stats.errors.length} items had errors:`, stats.errors);
                }
            } else {
                console.error('Sync failed:', result);
                if (type === 'inventory') {
                    this.updateInventoryProgress(0, 'Sync failed', true);
                } else if (type === 'sold') {
                    this.updateSoldProgress(0, 'Sync failed', true);
                }
            }

            // Update sync status display
            await this.updateSyncStatusDisplay();
        } catch (error) {
            console.error('❌ Error syncing to Supabase:', error);
            console.error('Error details:', {
                type: type,
                dataLength: data.length,
                errorMessage: error.message,
                errorStack: error.stack
            });
            
            this.showFileStatus(type, 'warning', `Not Storing Data, will be User Session only. Proceed as normal`);
            
            // Update progress bar to show error but continue
            if (type === 'inventory') {
                this.updateInventoryProgress(0, 'Sync error', true);
                setTimeout(() => this.hideInventoryProgress(), 2000);
            } else if (type === 'sold') {
                this.updateSoldProgress(0, 'Sync error', true);
                setTimeout(() => this.hideSoldProgressBar(), 2000);
            }
        }
    }

    async updateSyncStatusDisplay() {
        // Get sync status from Supabase
        if (!supabaseService || !supabaseService.client) return;

        try {
            const syncStatus = await supabaseService.getSyncStatus();
            if (syncStatus) {
                console.log('📊 Sync Status:', {
                    inventory: `${syncStatus.total_inventory_items || 0} items`,
                    sales: `${syncStatus.total_sales || 0} sales`,
                    unsold: `${syncStatus.total_unsold || 0} unsold`,
                    lastSync: syncStatus.updated_at
                });
            }
        } catch (error) {
            console.error('Error getting sync status:', error);
        }
    }

    checkReadyToAnalyze() {
        const hasInventory = this.inventoryData.length > 0;
        const hasSold = this.soldData.length > 0;
        
        if (hasInventory || hasSold) {
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.textContent = '🚀 Generate Business Analytics';
        }
    }

    async generateAnalytics() {
        this.analyzeBtn.disabled = true;
        this.analyzeBtn.textContent = '⏳ Analyzing...';

        try {
            // Skip LocalStorage saving - just use data in memory
            // Collections and settings will still be saved separately
            console.log('📊 Analyzing data in memory (CSV data not persisted to save storage space)');
            console.log(`Processing ${this.inventoryData.length} inventory items and ${this.soldData.length} sold items`);
            
            // Use the current upload data directly without storing
            this.storedInventoryData = this.inventoryData;
            this.storedSoldData = this.soldData;
            
            // Initialize empty results
            this.analysisResults = {};
            this.soldAnalysisResults = {};

            // Analyze inventory data (use stored data for comprehensive analysis)
            if (this.storedInventoryData.length > 0) {
                this.analysisResults = this.analyzeInventory();
            }

            // Analyze sold data (use stored data for comprehensive analysis)
            if (this.storedSoldData.length > 0) {
                this.soldAnalysisResults = this.analyzeSoldData();
            }

            // Show executive dashboard
            this.showExecutiveDashboard();
        } catch (error) {
            console.error('Error generating analytics:', error);
            alert(`Error generating analytics: ${error.message}`);
        } finally {
            this.analyzeBtn.disabled = false;
            this.analyzeBtn.textContent = '🚀 Generate Business Analytics';
        }
    }

    showExecutiveDashboard() {
        // Hide all dashboards
        this.landingPage.style.display = 'none';
        this.inventoryDashboard.style.display = 'none';
        this.salesDashboard.style.display = 'none';
        if (this.collectionManagement) this.collectionManagement.style.display = 'none';
        if (this.businessSettings) this.businessSettings.style.display = 'none';
        if (this.cardCropper) this.cardCropper.style.display = 'none';
        
        // Show executive dashboard
        this.executiveDashboard.style.display = 'block';
        window.scrollTo(0, 0);

        this.updateExecutiveMetrics();
    }

    showInventoryDashboard() {
        // Hide all other dashboards
        this.executiveDashboard.style.display = 'none';
        this.salesDashboard.style.display = 'none';
        if (this.collectionManagement) this.collectionManagement.style.display = 'none';
        if (this.businessSettings) this.businessSettings.style.display = 'none';
        if (this.cardCropper) this.cardCropper.style.display = 'none';
        
        // Show inventory dashboard
        this.inventoryDashboard.style.display = 'block';
        window.scrollTo(0, 0);

        this.updateInventoryDashboard();
    }

    showSalesDashboard(defaultTab = null) {
        // Hide all other dashboards
        this.executiveDashboard.style.display = 'none';
        this.inventoryDashboard.style.display = 'none';
        if (this.collectionManagement) this.collectionManagement.style.display = 'none';
        if (this.businessSettings) this.businessSettings.style.display = 'none';
        if (this.cardCropper) this.cardCropper.style.display = 'none';
        
        // Show sales dashboard
        this.salesDashboard.style.display = 'block';
        window.scrollTo(0, 0);

        this.updateSalesDashboard();
        
        // Switch to specific tab if provided
        if (defaultTab) {
            this.switchTab(defaultTab);
        }
    }

    updateExecutiveMetrics() {
        // Show/hide Future Results bucket based on inventory data
        const futureResultsBucket = document.getElementById('futureResultsBucket');
        if (this.inventoryData && this.inventoryData.length > 0) {
            if (futureResultsBucket) futureResultsBucket.style.display = 'block';
        } else {
            if (futureResultsBucket) futureResultsBucket.style.display = 'none';
        }

        // Update SALES RESULTS metrics
        if (this.soldAnalysisResults && this.soldAnalysisResults.totalSales !== undefined) {
            // Total Revenue
            const execTotalRevenue = document.getElementById('execTotalRevenue');
            if (execTotalRevenue) {
                execTotalRevenue.textContent = `$${this.soldAnalysisResults.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            }

            // Total Items Sold
            const execTotalSales = document.getElementById('execTotalSales');
            if (execTotalSales) {
                execTotalSales.textContent = this.soldAnalysisResults.totalSales.toLocaleString();
            }

            // Calendar Year Run Rate
            const annualRunRate = this.calculateAnnualRunRate();
            const execAnnualRunRate = document.getElementById('execAnnualRunRate');
            if (execAnnualRunRate) {
                execAnnualRunRate.textContent = `$${annualRunRate.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            }
        } else {
            const execTotalRevenue = document.getElementById('execTotalRevenue');
            const execTotalSales = document.getElementById('execTotalSales');
            const execAnnualRunRate = document.getElementById('execAnnualRunRate');
            
            if (execTotalRevenue) execTotalRevenue.textContent = '$0';
            if (execTotalSales) execTotalSales.textContent = '0';
            if (execAnnualRunRate) execAnnualRunRate.textContent = '$0';
        }

        // Unique Collections (5+ sales)
        const collectionsCount = this.soldAnalysisResults?.collectionAnalysis?.collections?.filter(c => c.totalSales >= 5).length || 0;
        const execCollections = document.getElementById('execCollections');
        if (execCollections) {
            execCollections.textContent = collectionsCount;
        }

        // Update FUTURE RESULTS metrics (only if inventory exists)
        if (this.analysisResults && this.analysisResults.totalListings !== undefined) {
            // Total Inventory Value
            const execTotalValue = document.getElementById('execTotalValue');
            if (execTotalValue) {
                execTotalValue.textContent = `$${this.analysisResults.totalValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            }

            // Active Listings
            const execActiveListings = document.getElementById('execActiveListings');
            if (execActiveListings) {
                execActiveListings.textContent = this.analysisResults.totalListings.toLocaleString();
            }

            // Average Days Listed
            const execAvgDaysListed = document.getElementById('execAvgDaysListed');
            if (execAvgDaysListed) {
                execAvgDaysListed.textContent = Math.round(this.analysisResults.avgDaysListed);
            }
        }

        // Create weekly revenue projection chart
        this.createWeeklyRevenueProjectionChart();
    }

    createWeeklyRevenueProjectionChart() {
        const canvas = document.getElementById('weeklyRevenueProjectionChart');
        if (!canvas || !this.soldData || this.soldData.length === 0) return;

        // Destroy existing chart
        if (this.weeklyRevenueProjectionChartInstance) {
            this.weeklyRevenueProjectionChartInstance.destroy();
        }

        // Get weekly data
        const weeklyData = this.getWeeklyRevenueData();
        if (weeklyData.length === 0) return;

        // Calculate CUMULATIVE revenue
        let cumulativeActual = [];
        let runningTotal = 0;
        weeklyData.forEach(week => {
            runningTotal += week.revenue;
            cumulativeActual.push(runningTotal);
        });

        // Calculate projection for rest of year
        const now = new Date();
        const yearEnd = new Date(now.getFullYear(), 11, 31);
        const weeksRemaining = Math.ceil((yearEnd - now) / (7 * 24 * 60 * 60 * 1000));
        
        // Calculate average weekly revenue
        const avgWeeklyRevenue = weeklyData.reduce((sum, w) => sum + w.revenue, 0) / weeklyData.length;

        // Create labels with actual dates for projected weeks
        const labels = weeklyData.map(w => w.weekLabel);
        const projectionLabels = [];
        const projectionData = [];
        
        // Start projection from last actual week
        let projectionTotal = cumulativeActual[cumulativeActual.length - 1];
        let currentDate = new Date(weeklyData[weeklyData.length - 1].weekStart);
        
        for (let i = 1; i <= weeksRemaining; i++) {
            currentDate = new Date(currentDate.getTime() + (7 * 24 * 60 * 60 * 1000));
            projectionLabels.push((currentDate.getMonth() + 1) + '/' + currentDate.getDate());
            projectionTotal += avgWeeklyRevenue;
            projectionData.push(projectionTotal);
        }

        const allLabels = [...labels, ...projectionLabels];

        this.weeklyRevenueProjectionChartInstance = new Chart(canvas, {
            type: 'line',
            data: {
                labels: allLabels,
                datasets: [
                    {
                        label: 'Actual Cumulative Revenue',
                        data: cumulativeActual.concat(Array(weeksRemaining).fill(null)),
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.1)',
                        borderWidth: 3,
                        fill: true,
                        tension: 0.1,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    },
                    {
                        label: 'Projected Year-End Revenue',
                        data: Array(cumulativeActual.length - 1).fill(null).concat([cumulativeActual[cumulativeActual.length - 1]]).concat(projectionData),
                        borderColor: '#8b5cf6',
                        backgroundColor: 'rgba(139, 92, 246, 0.1)',
                        borderWidth: 3,
                        borderDash: [10, 5],
                        fill: true,
                        tension: 0.1,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        pointBackgroundColor: '#8b5cf6',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 20,
                            font: {
                                size: 13,
                                weight: '500'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(0, 0, 0, 0.8)',
                        padding: 12,
                        titleFont: {
                            size: 14,
                            weight: '600'
                        },
                        bodyFont: {
                            size: 13
                        },
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                if (value !== null) {
                                    return `${label}: $${value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
                                }
                                return null;
                            },
                            footer: (items) => {
                                const dataIndex = items[0].dataIndex;
                                if (dataIndex >= cumulativeActual.length) {
                                    const projectedYearEnd = projectionData[projectionData.length - 1];
                                    return `Year-End Projection: $${projectedYearEnd.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
                                }
                                return null;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '$' + value.toLocaleString()
                        },
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        title: {
                            display: true,
                            text: 'Cumulative Revenue',
                            font: {
                                size: 13,
                                weight: '600'
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }

    getWeeklyRevenueData() {
        if (!this.soldData || this.soldData.length === 0) return [];

        const weeklyMap = new Map();

        this.soldData.forEach(item => {
            const dateStr = item['Sold Date'] || item['Sale Date'] || item.date;
            if (!dateStr) return;

            const date = new Date(dateStr);
            if (isNaN(date.getTime())) return;

            // Get week start (Sunday)
            const weekStart = new Date(date);
            weekStart.setDate(date.getDate() - date.getDay());
            const weekKey = weekStart.toISOString().split('T')[0];

            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;

            if (!weeklyMap.has(weekKey)) {
                weeklyMap.set(weekKey, {
                    weekStart: weekStart,
                    revenue: 0,
                    count: 0
                });
            }

            const week = weeklyMap.get(weekKey);
            week.revenue += price;
            week.count++;
        });

        // Convert to array and sort by date
        const weeklyData = Array.from(weeklyMap.values())
            .sort((a, b) => a.weekStart - b.weekStart)
            .map(week => ({
                weekLabel: (week.weekStart.getMonth() + 1) + '/' + week.weekStart.getDate(),
                weekStart: week.weekStart, // Include the actual date object
                revenue: week.revenue,
                count: week.count
            }));

        return weeklyData;
    }

    updateInventoryDashboard() {
        this.updateSummaryCards();
        this.updateAnalysisTabs();
    }

    updateSalesDashboard() {
        this.updateSoldSummaryCards();
        this.updateProfitabilityMetrics();
        this.createDailySalesChart();
        this.updateSoldAnalysisTabs();
    }

    async processFiles(files) {
        const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
        
        if (!csvFile) {
            alert('Please select a valid CSV file.');
            return;
        }

        // Hide old progress and show new progress bar
        this.hideProgress();
        this.showInventoryProgress();
        
        try {
            // Show file size info
            const fileSizeKB = (csvFile.size / 1024).toFixed(1);
            console.log(`📁 Processing file: ${csvFile.name} (${fileSizeKB} KB)`);
            
            this.updateInventoryProgress(10, 'Reading file...');
            const csvText = await this.readFileAsText(csvFile);
            console.log('CSV text loaded:', csvText.substring(0, 200) + '...');
            
            // Show parsing progress
            console.log('🔄 Parsing CSV data...');
            this.updateInventoryProgress(30, 'Parsing CSV data...');
            this.inventoryData = this.parseCSV(csvText);
            console.log(`✅ Parsed ${this.inventoryData.length} inventory items`);
            
            if (this.inventoryData.length === 0) {
                throw new Error('No valid data found in CSV file. Please check the format.');
            }
            
            this.updateInventoryProgress(60, 'Analyzing data...');
            this.analyzeInventory();
            
            this.updateInventoryProgress(90, 'Finalizing...');
            this.hideProgress();
            this.displayDashboard();
            
            this.updateInventoryProgress(100, 'Complete!');
            setTimeout(() => this.hideInventoryProgress(), 2000);
            
        } catch (error) {
            console.error('Error processing file:', error);
            this.updateInventoryProgress(0, 'Error processing file', true);
            alert(`Error processing CSV file: ${error.message}. Please check that your CSV has the correct format with headers like "Item Title", "Current Price", etc.`);
            this.hideInventoryProgress();
        }
    }

    async processSoldFiles(files) {
        const csvFile = files.find(file => file.type === 'text/csv' || file.name.endsWith('.csv'));
        
        if (!csvFile) {
            alert('Please select a valid CSV file.');
            return;
        }

        // Hide old progress and show new progress bar
        this.hideSoldProgress();
        this.showSoldProgressBar();
        
        try {
            // Show file size info
            const fileSizeKB = (csvFile.size / 1024).toFixed(1);
            console.log(`📁 Processing sold file: ${csvFile.name} (${fileSizeKB} KB)`);
            
            this.updateSoldProgress(10, 'Reading file...');
            const csvText = await this.readFileAsText(csvFile);
            console.log('Sold CSV text loaded:', csvText.substring(0, 200) + '...');
            
            // Show parsing progress
            console.log('🔄 Parsing sold CSV data...');
            this.updateSoldProgress(30, 'Parsing CSV data...');
            this.soldData = this.parseSoldCSV(csvText);
            console.log(`✅ Parsed ${this.soldData.length} sold items`);
            
            if (this.soldData.length === 0) {
                throw new Error('No valid data found in sold listings CSV file. Please check the format.');
            }
            
            this.updateSoldProgress(60, 'Analyzing data...');
            this.analyzeSoldData();
            this.hideSoldProgress();
            this.displaySoldDashboard();
            
            this.updateSoldProgress(100, 'Complete!');
            setTimeout(() => this.hideSoldProgressBar(), 2000);
        } catch (error) {
            console.error('Error processing sold file:', error);
            this.updateSoldProgress(0, 'Error processing file', true);
            alert(`Error processing sold listings CSV file: ${error.message}. Please check that your CSV has the correct format.`);
            this.hideSoldProgressBar();
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    parseCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row.');
        }
        
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
        console.log('CSV Headers found:', headers);
        
        const data = [];
        const requiredFields = ['Item Title', 'Current Price'];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                
                // Create item object with available fields
                const item = {};
                headers.forEach((header, index) => {
                    if (values[index] !== undefined) {
                        item[header] = values[index];
                    }
                });
                
                // Only add items that have at least some basic data
                if (item['Item Title'] || item['Current Price'] || Object.keys(item).length > 0) {
                    data.push(item);
                }
            }
        }

        console.log(`Parsed ${data.length} items from CSV`);
        return data;
    }

    parseCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < line.length; i++) {
            const char = line[i];
            
            if (char === '"') {
                inQuotes = !inQuotes;
            } else if (char === ',' && !inQuotes) {
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
        
        result.push(current.trim());
        return result.map(v => v.replace(/^"|"$/g, '').trim());
    }

    parseSoldCSV(csvText) {
        // Split lines and filter out completely empty lines
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('Sold CSV file must have at least a header row and one data row.');
        }
        
        // Find the header row (skip any blank lines at the start)
        let headerLineIndex = 0;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].trim() && lines[i].includes('Sales Record')) {
                headerLineIndex = i;
                break;
            }
        }
        
        const headers = this.parseCSVLine(lines[headerLineIndex]).map(h => h.trim().replace(/"/g, ''));
        console.log('Sold CSV Headers found:', headers);
        
        const data = [];

        for (let i = headerLineIndex + 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                
                // Create item object with available fields
                const item = {};
                headers.forEach((header, index) => {
                    if (values[index] !== undefined) {
                        item[header] = values[index];
                    }
                });
                
                // Map to the actual eBay CSV field names
                const paidDate = item['Paid Date'] || '';
                const shippedDate = item['Shipped On'] || item['Shipped Date'] || '';
                const itemTitle = item['Item Title'] || '';
                const soldPrice = item['Sold For'] || item['Sold Price'] || '';
                const saleDate = item['Sale Date'] || '';
                const quantity = item['Quantity'] || '1';
                
                // Log the first few items for debugging
                if (i <= headerLineIndex + 3) {
                    console.log(`Item ${i - headerLineIndex}:`, {
                        paidDate,
                        shippedDate,
                        itemTitle,
                        soldPrice,
                        saleDate,
                        quantity,
                        allFields: Object.keys(item)
                    });
                }
                
                // Only add items that have both paid and shipped dates (PAID and SHIPPED)
                // OR if we can't find those fields, include items with basic sold data
                const hasPaidShipped = paidDate && shippedDate;
                const hasBasicSoldData = itemTitle && soldPrice;
                
                if (hasPaidShipped || hasBasicSoldData) {
                    data.push(item);
                }
            }
        }

        console.log(`Parsed ${data.length} sold items from CSV`);
        console.log('Sample sold item:', data[0]);
        return data;
    }

    parseInventoryCSV(csvText) {
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('CSV file must have at least a header row and one data row.');
        }
        
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
        console.log('Inventory CSV Headers found:', headers);
        
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                
                const item = {};
                headers.forEach((header, index) => {
                    if (values[index] !== undefined) {
                        item[header] = values[index];
                    }
                });
                
                if (item['Item Title'] || item['Current Price'] || Object.keys(item).length > 0) {
                    data.push(item);
                }
            }
        }

        console.log(`Parsed ${data.length} inventory items from CSV`);
        return data;
    }
    
    parseUnsoldCSV(csvText) {
        // Parse unsold report CSV - similar structure to inventory CSV
        const lines = csvText.split('\n').filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new Error('Unsold CSV file must have at least a header row and one data row.');
        }
        
        const headers = this.parseCSVLine(lines[0]).map(h => h.trim().replace(/"/g, ''));
        console.log('Unsold CSV Headers found:', headers);
        
        const data = [];

        for (let i = 1; i < lines.length; i++) {
            if (lines[i].trim()) {
                const values = this.parseCSVLine(lines[i]);
                
                const item = {};
                headers.forEach((header, index) => {
                    if (values[index] !== undefined) {
                        item[header] = values[index];
                    }
                });
                
                data.push(item);
            }
        }

        console.log(`Parsed ${data.length} unsold items from CSV`);
        return data;
    }

    loadSampleData() {
        // Load sample inventory data
        const sampleInventoryData = [
            {
                'Title': 'Vintage Baseball Card - Mickey Mantle 1952',
                'Current price': '$1250.00',
                'eBay categor': 'Trading Card',
                'Condition': 'Graded',
                'Start date': 'Nov-15-24 10',
                'Views': '156',
                'Watchers': '8',
                'Available qua': '1',
                'Format': 'FixedPrice'
            },
            {
                'Title': 'Pokemon Charizard Holo First Edition',
                'Current price': '$850.00',
                'eBay categor': 'Trading Card',
                'Condition': 'Graded',
                'Start date': 'Dec-05-24 14',
                'Views': '89',
                'Watchers': '12',
                'Available qua': '1',
                'Format': 'FixedPrice'
            },
            {
                'Title': 'Jordan Rookie Card 1986 Fleer',
                'Current price': '$2200.00',
                'eBay categor': 'Trading Card',
                'Condition': 'Graded',
                'Start date': 'Oct-20-24 09',
                'Views': '234',
                'Watchers': '15',
                'Available qua': '1',
                'Format': 'Auction'
            },
            {
                'Title': 'Magic: The Gathering Black Lotus',
                'Current price': '$15000.00',
                'eBay categor': 'Trading Card',
                'Condition': 'Graded',
                'Start date': 'Dec-16-24 16',
                'Views': '456',
                'Watchers': '23',
                'Available qua': '1',
                'Format': 'FixedPrice'
            },
            {
                'Title': 'Football Card Tom Brady Rookie',
                'Current price': '$450.00',
                'eBay categor': 'Trading Card',
                'Condition': 'Ungraded',
                'Start date': 'Nov-25-24 11',
                'Views': '78',
                'Watchers': '5',
                'Available qua': '1',
                'Format': 'Auction'
            },
            {
                'Title': 'Sold Out Item Example',
                'Current price': '$100.00',
                'eBay categor': 'Trading Card',
                'Condition': 'Graded',
                'Start date': 'Nov-01-24 08',
                'Views': '45',
                'Watchers': '3',
                'Available qua': '0',
                'Format': 'FixedPrice'
            }
        ];

        // Load sample sold data
        const sampleSoldData = [
            {
                'Item Title': '2023 Topps Heritage Baseball Hobby Box',
                'Sold For': '$120.00',
                'Quantity': '1',
                'Sale Date': 'Sep-24-24',
                'Paid Date': 'Sep-24-24',
                'Shipped On': 'Sep-25-24',
                'Custom Label (SKU)': '2023 Topps Heritage'
            },
            {
                'Item Title': '2023 Bowman Chrome Hobby Box',
                'Sold For': '$85.00',
                'Quantity': '1',
                'Sale Date': 'Sep-23-24',
                'Paid Date': 'Sep-23-24',
                'Shipped On': 'Sep-24-24',
                'Custom Label (SKU)': '2023 Bowman Chrome'
            }
        ];

        this.inventoryData = sampleInventoryData;
        this.soldData = sampleSoldData;
        
        // DON'T save sample data to localStorage - keep it in memory only
        console.log('Sample data loaded in memory only (not saved to localStorage)');
        
        this.showFileStatus('inventory', 'success', `${sampleInventoryData.length} sample inventory items loaded`);
        this.showFileStatus('sold', 'success', `${sampleSoldData.length} sample sold items loaded`);
        
        this.checkReadyToAnalyze();
    }

    loadSampleSoldData() {
        // Get current date and create some recent sales
        const now = new Date();
        const formatDate = (daysAgo) => {
            const d = new Date(now);
            d.setDate(d.getDate() - daysAgo);
            const month = d.toLocaleDateString('en-US', { month: 'short' });
            const day = String(d.getDate()).padStart(2, '0');
            const year = String(d.getFullYear()).slice(-2);
            return `${month}-${day}-${year}`;
        };
        
        const sampleSoldData = [
            // Recent sales (within last 30 days)
            {
                'Item Title': 'Recent Sale - Baseball Cards Pack',
                'Item number': '123456789001',
                'Sold Price': '$45.00',
                'Quantity': '1',
                'Sale Date': formatDate(2),
                'Paid Date': formatDate(2),
                'Shipped Date': formatDate(1),
                'Shipping and Handling': '$5.00',
                'eBay Collected Tax': '$2.00',
                'Custom Label (SKU)': 'Baseball Cards'
            },
            {
                'Item Title': 'Recent Sale - Pokemon Booster',
                'Item number': '123456789002',
                'Sold Price': '$35.00',
                'Quantity': '1',
                'Sale Date': formatDate(5),
                'Paid Date': formatDate(5),
                'Shipped Date': formatDate(4),
                'Shipping and Handling': '$4.00',
                'eBay Collected Tax': '$1.50',
                'Custom Label (SKU)': 'Pokemon'
            },
            {
                'Item Title': 'Recent Sale - Sports Card Lot',
                'Item number': '123456789003',
                'Sold Price': '$75.00',
                'Quantity': '1',
                'Sale Date': formatDate(10),
                'Paid Date': formatDate(10),
                'Shipped Date': formatDate(9),
                'Shipping and Handling': '$6.00',
                'eBay Collected Tax': '$3.00',
                'Custom Label (SKU)': 'Sports Cards'
            },
            {
                'Item Title': 'Recent Sale - Vintage Card',
                'Item number': '123456789004',
                'Sold Price': '$150.00',
                'Quantity': '1',
                'Sale Date': formatDate(15),
                'Paid Date': formatDate(15),
                'Shipped Date': formatDate(14),
                'Shipping and Handling': '$8.00',
                'eBay Collected Tax': '$6.00',
                'Custom Label (SKU)': 'Vintage'
            },
            {
                'Item Title': 'Recent Sale - Trading Card Game',
                'Item number': '123456789005',
                'Sold Price': '$25.00',
                'Quantity': '1',
                'Sale Date': formatDate(20),
                'Paid Date': formatDate(20),
                'Shipped Date': formatDate(19),
                'Shipping and Handling': '$3.50',
                'eBay Collected Tax': '$1.00',
                'Custom Label (SKU)': 'TCG'
            },
            // Older sales (for historical data)
            {
                'Item Title': '2023 Topps Heritage Baseball Hobby Box',
                'Item number': '123456789012',
                'Sold Price': '$120.00',
                'Quantity': '1',
                'Sale Date': 'Sep-24-24',
                'Paid Date': 'Sep-24-24',
                'Shipped Date': 'Sep-25-24',
                'Shipping and Handling': '$6.00',
                'eBay Collected Tax': '$2.49',
                'Custom Label (SKU)': '2023 Topps Heritage'
            },
            {
                'Item Title': '2023 Bowman Chrome Hobby Box',
                'Item number': '123456789013',
                'Sold Price': '$85.00',
                'Quantity': '1',
                'Sale Date': 'Sep-23-24',
                'Paid Date': 'Sep-23-24',
                'Shipped Date': 'Sep-24-24',
                'Shipping and Handling': '$5.00',
                'eBay Collected Tax': '$1.80',
                'Custom Label (SKU)': '2023 Bowman Chrome'
            },
            {
                'Item Title': 'Vintage Baseball Card - Mickey Mantle 1952',
                'Item number': '123456789014',
                'Sold Price': '$1250.00',
                'Quantity': '1',
                'Sale Date': 'Sep-20-24',
                'Paid Date': 'Sep-20-24',
                'Shipped Date': 'Sep-22-24',
                'Shipping and Handling': '$15.00',
                'eBay Collected Tax': '$25.00',
                'Custom Label (SKU)': 'Mantle 1952'
            },
            {
                'Item Title': 'Pokemon Charizard Holo First Edition',
                'Item number': '123456789015',
                'Sold Price': '$850.00',
                'Quantity': '1',
                'Sale Date': 'Sep-18-24',
                'Paid Date': 'Sep-18-24',
                'Shipped Date': 'Sep-19-24',
                'Shipping and Handling': '$8.00',
                'eBay Collected Tax': '$17.00',
                'Custom Label (SKU)': 'Charizard 1st Ed'
            },
            {
                'Item Title': 'Magic: The Gathering Black Lotus',
                'Item number': '123456789016',
                'Sold Price': '$15000.00',
                'Quantity': '1',
                'Sale Date': 'Sep-15-24',
                'Paid Date': 'Sep-15-24',
                'Shipped Date': 'Sep-17-24',
                'Shipping and Handling': '$25.00',
                'eBay Collected Tax': '$300.00',
                'Custom Label (SKU)': 'Black Lotus'
            },
            {
                'Item Title': 'Magic: The Gathering Black Lotus',
                'Item number': '123456789017',
                'Sold Price': '$14500.00',
                'Quantity': '1',
                'Sale Date': 'Sep-20-24',
                'Paid Date': 'Sep-20-24',
                'Shipped Date': 'Sep-22-24',
                'Shipping and Handling': '$25.00',
                'eBay Collected Tax': '$290.00',
                'Custom Label (SKU)': 'Black Lotus'
            },
            {
                'Item Title': 'Magic: The Gathering Black Lotus',
                'Item number': '123456789018',
                'Sold Price': '$16000.00',
                'Quantity': '1',
                'Sale Date': 'Sep-25-24',
                'Paid Date': 'Sep-25-24',
                'Shipped Date': 'Sep-27-24',
                'Shipping and Handling': '$25.00',
                'eBay Collected Tax': '$320.00',
                'Custom Label (SKU)': 'Black Lotus'
            },
            {
                'Item Title': 'Pokemon Charizard Base Set',
                'Item number': '123456789019',
                'Sold Price': '$2500.00',
                'Quantity': '1',
                'Sale Date': 'Sep-10-24',
                'Paid Date': 'Sep-10-24',
                'Shipped Date': 'Sep-12-24',
                'Shipping and Handling': '$15.00',
                'eBay Collected Tax': '$50.00',
                'Custom Label (SKU)': 'Pokemon'
            },
            {
                'Item Title': 'Pokemon Pikachu Yellow',
                'Item number': '123456789020',
                'Sold Price': '$800.00',
                'Quantity': '1',
                'Sale Date': 'Sep-08-24',
                'Paid Date': 'Sep-08-24',
                'Shipped Date': 'Sep-10-24',
                'Shipping and Handling': '$10.00',
                'eBay Collected Tax': '$16.00',
                'Custom Label (SKU)': 'Pokemon'
            },
            {
                'Item Title': 'Pokemon Blastoise',
                'Item number': '123456789021',
                'Sold Price': '$1200.00',
                'Quantity': '1',
                'Sale Date': 'Sep-05-24',
                'Paid Date': 'Sep-05-24',
                'Shipped Date': 'Sep-07-24',
                'Shipping and Handling': '$12.00',
                'eBay Collected Tax': '$24.00',
                'Custom Label (SKU)': 'Pokemon'
            }
        ];

        this.soldData = sampleSoldData;
        this.generateAnalytics();
    }

    analyzeInventory() {
        try {
            // Use stored data for comprehensive analysis
            const dataToAnalyze = this.storedInventoryData.length > 0 ? this.storedInventoryData : this.inventoryData;
            console.log('Starting inventory analysis with', dataToAnalyze.length, 'items');
            
            // Temporarily set inventoryData for analysis methods
            const originalData = this.inventoryData;
            this.inventoryData = dataToAnalyze;
            
            const totalValue = this.calculateTotalValue();
            console.log('Total value calculated:', totalValue);
            
            // Filter active listings (QTY > 0)
            const activeListings = this.getActiveListings();
            
            // Calculate aging metrics
            const agingMetrics = this.calculateAgingMetrics(activeListings);
            
            // Get actionable lists
            // IMPORTANT: Only analyzing CURRENT INVENTORY (activeListings)
            // This is filtered by qty > 0, so sold items are excluded
            const longestListed = this.getLongestListedItems(activeListings);
            const mostWatched = this.getMostWatchedItems(activeListings);
            
            console.log('Active listings count:', activeListings.length);
            console.log('Longest listed count:', longestListed.length);
            console.log('Most watched count:', mostWatched.length);
            
            const results = {
                totalListings: activeListings.length,
                totalValue: totalValue,
                avgDaysListed: this.calculateAvgDaysListed(activeListings),
                avgValuePerItem: this.calculateAvgValuePerItem(activeListings),
                items30Plus: agingMetrics.items30Plus,
                items60Plus: agingMetrics.items60Plus,
                items90Plus: agingMetrics.items90Plus,
                longestListed: longestListed,
                mostWatched: mostWatched
            };
            
            // Restore original data
            this.inventoryData = originalData;
            
            console.log('Analysis results:', results);
            return results;
        } catch (error) {
            console.error('Error in analyzeInventory:', error);
            throw new Error(`Analysis failed: ${error.message}`);
        }
    }

    analyzeSoldData() {
        try {
            // Use stored data for comprehensive analysis
            const dataToAnalyze = this.storedSoldData.length > 0 ? this.storedSoldData : this.soldData;
            console.log('Starting sold data analysis with', dataToAnalyze.length, 'items');
            
            // Temporarily set soldData for analysis methods
            const originalData = this.soldData;
            this.soldData = dataToAnalyze;
            
            const results = {
                totalSales: this.soldData.length,
                totalRevenue: this.calculateTotalRevenue(),
                avgSalePrice: this.calculateAvgSalePrice(),
                avgRevenuePerDay: this.calculateAvgRevenuePerDay(),
                salesByMonth: this.calculateSalesByMonth(),
                topSellingItems: this.calculateTopSellingItems(),
                recentSales: this.getRecentSales(),
                collectionAnalysis: this.analyzeCollections()
            };
            
            // Restore original data
            this.soldData = originalData;
            
            console.log('Sold analysis results:', results);
            return results;
        } catch (error) {
            console.error('Error in analyzeSoldData:', error);
            throw new Error(`Sold data analysis failed: ${error.message}`);
        }
    }

    calculateTotalRevenue() {
        return this.soldData.reduce((total, item) => {
            const priceStr = item['Sold Price'] || item['Sold For'] || item['Sold price'] || item['Price'] || item['price'] || '0';
            const price = parseFloat(priceStr.replace(/[$,]/g, '') || 0);
            return total + price;
        }, 0);
    }

    calculateAvgSalePrice() {
        if (this.soldData.length === 0) return 0;
        return this.calculateTotalRevenue() / this.soldData.length;
    }

    calculateAvgRevenuePerDay() {
        if (this.soldData.length === 0) return 0;
        
        // Find first and last sale dates
        let firstDate = null;
        let lastDate = null;
        
        this.soldData.forEach(item => {
            const soldDateStr = item['Sale Date'] || item['Sold Date'] || item['Order Date'];
            if (!soldDateStr) return;
            
            // Use the existing parseSoldDate function that handles eBay formats
            const date = this.parseSoldDate(soldDateStr);
            if (!date) return;
            
            if (!firstDate || date < firstDate) {
                firstDate = date;
            }
            if (!lastDate || date > lastDate) {
                lastDate = date;
            }
        });
        
        if (!firstDate || !lastDate) return 0;
        
        // Calculate days between first and last sale
        const daysDiff = Math.ceil((lastDate - firstDate) / (1000 * 60 * 60 * 24)) + 1; // +1 to include both days
        
        // Calculate total revenue
        const totalRevenue = this.calculateTotalRevenue();
        
        // Return average revenue per day
        return daysDiff > 0 ? totalRevenue / daysDiff : 0;
    }
    
    calculateTopRevenueMonth() {
        if (!this.soldData || this.soldData.length === 0) {
            return { display: '-', revenue: 0, month: '' };
        }
        
        // Group sales by month
        const monthlyRevenue = {};
        
        this.soldData.forEach(item => {
            const dateStr = item['Sale Date'] || item['Sold Date'] || '';
            if (!dateStr) return;
            
            const date = this.parseSoldDate(dateStr);
            if (!date) return;
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const monthDisplay = date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
            
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            
            if (!monthlyRevenue[monthKey]) {
                monthlyRevenue[monthKey] = {
                    revenue: 0,
                    display: monthDisplay
                };
            }
            monthlyRevenue[monthKey].revenue += price;
        });
        
        // Find the month with highest revenue
        let topMonth = { display: '-', revenue: 0, month: '' };
        
        Object.entries(monthlyRevenue).forEach(([key, data]) => {
            if (data.revenue > topMonth.revenue) {
                topMonth = {
                    month: key,
                    revenue: data.revenue,
                    display: `${data.display} ($${data.revenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})})`
                };
            }
        });
        
        return topMonth;
    }
    
    calculateAnnualRunRate() {
        if (!this.soldData || this.soldData.length === 0) return 0;
        
        // Find sales from Jan 1 of current year to last sale date
        const currentYear = new Date().getFullYear();
        const jan1 = new Date(currentYear, 0, 1); // January 1st of current year
        
        let lastSaleDate = null;
        let totalRevenueYTD = 0;
        
        this.soldData.forEach(item => {
            const dateStr = item['Sale Date'] || item['Sold Date'] || '';
            if (!dateStr) return;
            
            const date = this.parseSoldDate(dateStr);
            if (!date) return;
            
            // Only include sales from Jan 1 onwards
            if (date >= jan1) {
                const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
                totalRevenueYTD += price;
                
                if (!lastSaleDate || date > lastSaleDate) {
                    lastSaleDate = date;
                }
            }
        });
        
        if (!lastSaleDate || lastSaleDate < jan1) return 0;
        
        // Calculate # of selling days (from Jan 1 to last sale)
        const sellingDays = Math.ceil((lastSaleDate - jan1) / (1000 * 60 * 60 * 24)) + 1;
        
        if (sellingDays <= 0) return 0;
        
        // Annual run rate = (Revenue YTD / Selling Days) × 365
        const runRate = (totalRevenueYTD / sellingDays) * 365;
        
        return runRate;
    }

    calculateDaysBetween(dateStr1, dateStr2) {
        try {
            const date1 = this.parseSoldDate(dateStr1);
            const date2 = this.parseSoldDate(dateStr2);
            const diffTime = date2 - date1;
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch (error) {
            console.warn('Error calculating days between dates:', error);
            return 0;
        }
    }

    // parseSoldDate is defined later in the class with more robust date format handling

    calculateSalesByMonth() {
        const salesByMonth = {};
        
        this.soldData.forEach(item => {
            const saleDate = item['Sale Date'] || '';
            const month = this.getMonthFromDate(saleDate);
            
            if (month) {
                if (!salesByMonth[month]) {
                    salesByMonth[month] = { count: 0, revenue: 0 };
                }
                salesByMonth[month].count++;
                const price = parseFloat((item['Sold For'] || item['Sold Price'] || '0').replace(/[$,]/g, '') || 0);
                salesByMonth[month].revenue += price;
            }
        });
        
        return salesByMonth;
    }

    getMonthFromDate(dateStr) {
        try {
            const date = this.parseSoldDate(dateStr);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' });
        } catch (error) {
            return null;
        }
    }

    calculateTopSellingItems() {
        const itemCounts = {};
        
        this.soldData.forEach(item => {
            const title = item['Item Title'] || 'Unknown Item';
            const price = parseFloat((item['Sold For'] || item['Sold Price'] || '0').replace(/[$,]/g, '') || 0);
            
            if (!itemCounts[title]) {
                itemCounts[title] = { count: 0, totalRevenue: 0 };
            }
            itemCounts[title].count++;
            itemCounts[title].totalRevenue += price;
        });
        
        return Object.entries(itemCounts)
            .map(([title, data]) => ({ title, ...data }))
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 10);
    }

    getRecentSales() {
        return this.soldData
            .sort((a, b) => {
                const dateA = this.parseSoldDate(a['Sale Date'] || '');
                const dateB = this.parseSoldDate(b['Sale Date'] || '');
                return dateB - dateA;
            })
            .slice(0, 10);
    }

    getFastestShipping() {
        return this.soldData
            .map(item => ({
                ...item,
                daysToShip: this.calculateDaysBetween(
                    item['Paid Date'] || '', 
                    item['Shipped On'] || item['Shipped Date'] || ''
                )
            }))
            .sort((a, b) => a.daysToShip - b.daysToShip)
            .slice(0, 10);
    }

    analyzeCollections() {
        const collections = {};
        
        this.soldData.forEach(item => {
            let customLabel = item['Custom Label (SKU)'] || item['Custom Label'] || 'Unlabeled';
            // Rename "Unlabeled" to "RANDOM SALES"
            if (customLabel === 'Unlabeled' || customLabel === 'UNLABELED') {
                customLabel = 'RANDOM SALES';
            }
            const price = parseFloat((item['Sold For'] || '0').replace(/[$,]/g, '') || 0);
            const quantity = parseInt(item['Quantity'] || '1');
            
            if (!collections[customLabel]) {
                collections[customLabel] = {
                    name: customLabel,
                    totalRevenue: 0,
                    totalSales: 0,
                    totalQuantity: 0,
                    avgPrice: 0,
                    items: [],
                    firstSaleDate: null,
                    lastSaleDate: null,
                    totalDaysWorking: 0
                };
            }
            
            collections[customLabel].totalRevenue += price;
            collections[customLabel].totalSales += 1;
            collections[customLabel].totalQuantity += quantity;
            collections[customLabel].items.push(item);
            
            // Track date range for total days working
            const saleDate = this.parseSoldDate(item['Sale Date'] || '');
            if (saleDate) {
                if (!collections[customLabel].firstSaleDate || saleDate < collections[customLabel].firstSaleDate) {
                    collections[customLabel].firstSaleDate = saleDate;
                }
                if (!collections[customLabel].lastSaleDate || saleDate > collections[customLabel].lastSaleDate) {
                    collections[customLabel].lastSaleDate = saleDate;
                }
            }
        });
        
        // Calculate average prices and total days working
        Object.values(collections).forEach(collection => {
            collection.avgPrice = collection.totalRevenue / collection.totalSales;
            if (collection.firstSaleDate && collection.lastSaleDate) {
                collection.totalDaysWorking = Math.ceil((collection.lastSaleDate - collection.firstSaleDate) / (1000 * 60 * 60 * 24));
            }
        });
        
        const sortedCollections = Object.values(collections)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        return {
            collections: sortedCollections,
            totalCollections: sortedCollections.length,
            topCollection: sortedCollections[0] || null,
            totalCollectionRevenue: sortedCollections.reduce((sum, c) => sum + c.totalRevenue, 0)
        };
    }

    getActiveListings() {
        return this.inventoryData.filter(item => {
            const qty = parseInt(item['Available qua'] || item['Available quantity'] || item['Quantity'] || '0');
            return qty > 0;
        });
    }

    calculateTotalValue() {
        const activeListings = this.getActiveListings();
        return activeListings.reduce((total, item) => {
            const priceStr = item['Current price'] || item['Current Price'] || item['Price'] || '0';
            const price = parseFloat(priceStr.replace(/[$,]/g, '') || 0);
            return total + price;
        }, 0);
    }

    calculateAvgDaysListed(activeListings) {
        if (activeListings.length === 0) return 0;
        
        const totalDays = activeListings.reduce((total, item) => {
            const startDate = item['Start date'] || '';
            const daysListed = this.calculateDaysListed(startDate);
            return total + daysListed;
        }, 0);
        
        return Math.round(totalDays / activeListings.length);
    }

    calculateAvgValuePerItem(activeListings) {
        if (activeListings.length === 0) return 0;
        
        const totalValue = activeListings.reduce((total, item) => {
            const priceStr = item['Current price'] || item['Current Price'] || item['Price'] || '0';
            const price = parseFloat(priceStr.replace(/[$,]/g, '') || 0);
            return total + price;
        }, 0);
        
        return totalValue / activeListings.length;
    }

    calculateAgingMetrics(activeListings) {
        let items30Plus = 0;
        let items60Plus = 0;
        let items90Plus = 0;
        
        activeListings.forEach(item => {
            const daysListed = this.calculateDaysListed(item['Start date'] || item['Start Date'] || '');
            
            if (daysListed >= 30) items30Plus++;
            if (daysListed >= 60) items60Plus++;
            if (daysListed >= 90) items90Plus++;
        });
        
        return { items30Plus, items60Plus, items90Plus };
    }
    
    getLongestListedItems(activeListings) {
        // Only show current inventory (active listings with quantity > 0)
        // This excludes any sold items
        return activeListings
            .map(item => ({
                ...item,
                daysListed: this.calculateDaysListed(item['Start date'] || item['Start Date'] || '')
            }))
            .filter(item => {
                // Must be an active listing with quantity available
                const qty = parseInt(item['Available qua'] || item['Available quantity'] || item['Quantity'] || '0');
                return qty > 0;
            })
            .sort((a, b) => b.daysListed - a.daysListed)
            .slice(0, 20);
    }
    
    getMostWatchedItems(activeListings) {
        // Only show current inventory (active listings with quantity > 0)
        // Excludes sold items AND auction items (only show fixed price)
        return activeListings
            .map(item => ({
                ...item,
                watchers: parseInt(item['Watchers'] || item['watchers'] || 0),
                views: parseInt(item['Views'] || item['views'] || 0)
            }))
            .filter(item => {
                // Must have watchers and must be an active listing
                const qty = parseInt(item['Available qua'] || item['Available quantity'] || item['Quantity'] || '0');
                
                // Get listing format (check multiple possible column names)
                const format = item['Format'] || item['Listing format'] || item['Listing Format'] || item['Type'] || '';
                
                // Only include Fixed Price listings (exclude Auction, StoreInventory with auctions, etc.)
                const isFixedPrice = format.toLowerCase().includes('fixedprice') || 
                                    format.toLowerCase().includes('fixed') ||
                                    format.toLowerCase() === 'storeinventory' ||
                                    format === ''; // If no format specified, assume it's okay
                
                const isAuction = format.toLowerCase().includes('auction');
                
                return item.watchers > 0 && qty > 0 && !isAuction && (isFixedPrice || format === '');
            })
            .sort((a, b) => b.watchers - a.watchers)
            .slice(0, 20);
    }
    
    getHighViewsLowWatchers(activeListings) {
        return activeListings
            .map(item => {
                const views = parseInt(item['Views'] || item['views'] || 0);
                const watchers = parseInt(item['Watchers'] || item['watchers'] || 0);
                const watcherRatio = views > 0 ? (watchers / views) * 100 : 0;
                const daysListed = this.calculateDaysListed(item['Start date'] || item['Start Date'] || '');
                
                return { ...item, views, watchers, watcherRatio, daysListed };
            })
            .filter(item => item.views > 20 && item.watcherRatio < 2 && item.daysListed > 30)
            .sort((a, b) => b.daysListed - a.daysListed)
            .slice(0, 20);
    }
    
    getHighEngagementItems(activeListings) {
        return activeListings
            .map(item => {
                const views = parseInt(item['Views'] || item['views'] || 0);
                const watchers = parseInt(item['Watchers'] || item['watchers'] || 0);
                const watcherRatio = views > 0 ? (watchers / views) * 100 : 0;
                
                return { ...item, views, watchers, watcherRatio };
            })
            .filter(item => item.views > 5) // Must have some views to be meaningful
            .sort((a, b) => b.watcherRatio - a.watcherRatio)
            .slice(0, 20);
    }

    analyzePricing() {
        try {
            console.log('Starting pricing analysis...');
            const pricingData = this.inventoryData.map((item, index) => {
                try {
                    const priceStr = item['Current price'] || item['Current Price'] || item['Price'] || '0';
                    const price = parseFloat(priceStr.replace(/[$,]/g, '') || 0);
                    
                    // Get engagement metrics
                    const views = parseInt(item['Views'] || item['views'] || 0);
                    const watchers = parseInt(item['Watchers'] || item['watchers'] || 0);
                    const daysListed = this.calculateDaysListed(item['Start date'] || item['Start Date'] || '');
                    
                    // Calculate engagement ratio (watchers per 100 views)
                    const watcherRatio = views > 0 ? (watchers / views) * 100 : 0;
                    
                    // Determine pricing status based on real metrics
                    const pricingStatus = this.determinePricingStatusByEngagement(daysListed, views, watchers, watcherRatio);
                    
                    return {
                        ...item,
                        pricingStatus,
                        views,
                        watchers,
                        daysListed,
                        watcherRatio
                    };
                } catch (error) {
                    console.warn(`Error processing item ${index}:`, error, item);
                    return {
                        ...item,
                        pricingStatus: 'unknown',
                        views: 0,
                        watchers: 0,
                        daysListed: 0,
                        watcherRatio: 0
                    };
                }
            });

            const result = {
                overpriced: pricingData.filter(item => item.pricingStatus === 'overpriced'),
                wellPriced: pricingData.filter(item => item.pricingStatus === 'well-priced'),
                underpriced: pricingData.filter(item => item.pricingStatus === 'underpriced'),
                neutral: pricingData.filter(item => item.pricingStatus === 'neutral')
            };
            
            console.log('Pricing analysis result:', result);
            return result;
        } catch (error) {
            console.error('Error in analyzePricing:', error);
            return {
                overpriced: [],
                wellPriced: [],
                underpriced: [],
                neutral: []
            };
        }
    }

    determinePricingStatusByEngagement(daysListed, views, watchers, watcherRatio) {
        // OVERPRICED: Listed > 30 days AND high views but low watchers
        // High views (>20) but low watcher ratio (<2%) indicates people are looking but not interested
        if (daysListed > 30 && views > 20 && watcherRatio < 2) {
            return 'overpriced';
        }
        
        // WELL-PRICED: High watchers AND good views
        // Good engagement: watcher ratio > 3% OR watchers > 5
        if ((watchers >= 5 && views > 10) || watcherRatio > 3) {
            return 'well-priced';
        }
        
        // UNDERPRICED: Very high engagement (people watching!)
        // Exceptional engagement: watcher ratio > 5% OR watchers > 10
        if (watcherRatio > 5 || watchers > 10) {
            return 'underpriced';
        }
        
        // Default: neutral (not enough data to categorize)
        // This includes new listings, low-view items, etc.
        return 'neutral';
    }

    analyzeSellThrough() {
        return this.inventoryData.map(item => {
            // Calculate days listed from start date
            const startDate = item['Start date'] || '';
            const daysListed = this.calculateDaysListed(startDate);
            const views = parseInt(item['Views'] || 0);
            const watchers = parseInt(item['Watchers'] || 0);
            
            // Calculate estimated sell-through rate
            const engagementRate = views > 0 ? (watchers / views) * 100 : 0;
            const estimatedSellThrough = this.calculateSellThroughRate(daysListed, engagementRate);
            
            return {
                ...item,
                estimatedSellThrough,
                engagementRate,
                daysListed,
                views,
                watchers
            };
        });
    }

    calculateDaysListed(startDateStr) {
        if (!startDateStr) return 0;
        
        try {
            // Handle eBay date format like "Dec-10-24 1" or "Jul-02-25 15:"
            const dateStr = startDateStr.trim();
            const parts = dateStr.split(' ');
            const datePart = parts[0]; // "Dec-10-24"
            
            // Parse the date (eBay format: Mon-DD-YY)
            const [month, day, year] = datePart.split('-');
            const monthMap = {
                'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
            };
            
            const monthIndex = monthMap[month] || 0;
            const fullYear = 2000 + parseInt(year);
            const startDate = new Date(fullYear, monthIndex, parseInt(day));
            const now = new Date();
            const diffTime = now - startDate;
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            
            return Math.max(0, diffDays);
        } catch (error) {
            console.warn('Error parsing date:', startDateStr, error);
            return 0;
        }
    }

    calculateSellThroughRate(daysListed, engagementRate) {
        // Simulate sell-through calculation
        const baseRate = Math.max(0, 100 - (daysListed * 1.5));
        const engagementBonus = engagementRate * 0.5;
        return Math.min(100, Math.max(0, baseRate + engagementBonus));
    }

    generateRecommendations() {
        try {
            const recommendations = {
                priceAdjustments: [],
                listingOptimizations: []
            };

            // Check if pricingAnalysis exists and has the expected structure
            if (!this.analysisResults.pricingAnalysis) {
                console.warn('Pricing analysis not available for recommendations');
                return recommendations;
            }

            // Price adjustment recommendations for overpriced items
            if (this.analysisResults.pricingAnalysis.overpriced) {
                this.analysisResults.pricingAnalysis.overpriced.slice(0, 5).forEach(item => {
                    const currentPrice = item['Current price'] || item['Current Price'] || '0';
                    const views = item.views || 0;
                    const watchers = item.watchers || 0;
                    const daysListed = item.daysListed || 0;
                    recommendations.priceAdjustments.push({
                        title: item['Title'] || item['Item Title'],
                        currentPrice: currentPrice,
                        recommendedPrice: `$${(parseFloat(currentPrice.replace(/[$,]/g, '')) * 0.85).toFixed(2)}`,
                        reason: `Listed ${daysListed} days with ${views} views but only ${watchers} watchers - consider 15% price reduction`
                    });
                });
            }

            // Recommendations for underpriced items
            if (this.analysisResults.pricingAnalysis.underpriced) {
                this.analysisResults.pricingAnalysis.underpriced.slice(0, 5).forEach(item => {
                    const currentPrice = item['Current price'] || item['Current Price'] || '0';
                    const watchers = item.watchers || 0;
                    const views = item.views || 0;
                    recommendations.priceAdjustments.push({
                        title: item['Title'] || item['Item Title'],
                        currentPrice: currentPrice,
                        recommendedPrice: `$${(parseFloat(currentPrice.replace(/[$,]/g, '')) * 1.15).toFixed(2)}`,
                        reason: `High demand with ${watchers} watchers from ${views} views - consider 15% price increase`
                    });
                });
            }

            // Listing optimization recommendations
            this.inventoryData.forEach(item => {
                const startDate = item['Start date'] || '';
                const daysListed = this.calculateDaysListed(startDate);
                const views = parseInt(item['Views'] || 0);
                
                if (daysListed > 30 && views < 50) {
                    recommendations.listingOptimizations.push({
                        title: item['Title'] || item['Item Title'],
                        recommendation: 'Consider updating title and description for better SEO',
                        reason: 'Low view count after 30+ days'
                    });
                }
                
                if (daysListed > 60) {
                    recommendations.listingOptimizations.push({
                        title: item['Title'] || item['Item Title'],
                        recommendation: 'Consider relisting or adjusting price significantly',
                        reason: 'Item has been listed for over 60 days'
                    });
                }
            });

            return recommendations;
        } catch (error) {
            console.error('Error in generateRecommendations:', error);
            return {
                priceAdjustments: [],
                listingOptimizations: []
            };
        }
    }

    displayDashboard() {
        this.dashboard.style.display = 'block';
        this.updateSummaryCards();
        this.createCharts();
        this.updateAnalysisTabs();
    }

    displaySoldDashboard() {
        this.soldDashboard.style.display = 'block';
        this.updateSoldSummaryCards();
        this.createSoldCharts();
        this.updateSoldAnalysisTabs();
    }

    updateSummaryCards() {
        if (this.analysisResults) {
            this.totalListings.textContent = this.analysisResults.totalListings || 0;
            this.totalValue.textContent = `$${(this.analysisResults.totalValue || 0).toLocaleString()}`;
            this.avgDaysListed.textContent = this.analysisResults.avgDaysListed || 0;
            this.avgValuePerItem.textContent = `$${(this.analysisResults.avgValuePerItem || 0).toFixed(2)}`;
            
            // Update aging metrics
            if (this.items30Plus) this.items30Plus.textContent = this.analysisResults.items30Plus || 0;
            if (this.items60Plus) this.items60Plus.textContent = this.analysisResults.items60Plus || 0;
            if (this.items90Plus) this.items90Plus.textContent = this.analysisResults.items90Plus || 0;
        } else {
            this.totalListings.textContent = '0';
            this.totalValue.textContent = '$0';
            this.avgDaysListed.textContent = '0';
            this.avgValuePerItem.textContent = '$0';
            if (this.items30Plus) this.items30Plus.textContent = '0';
            if (this.items60Plus) this.items60Plus.textContent = '0';
            if (this.items90Plus) this.items90Plus.textContent = '0';
        }
    }

    calculatePricingScore() {
        if (!this.analysisResults || !this.analysisResults.pricingAnalysis) return 0;
        
        const totalItems = this.analysisResults.pricingAnalysis.overpriced.length + 
                          this.analysisResults.pricingAnalysis.wellPriced.length + 
                          this.analysisResults.pricingAnalysis.underpriced.length +
                          this.analysisResults.pricingAnalysis.neutral.length;
        
        if (totalItems === 0) return 0;
        
        // Score: Well-priced gets full points, underpriced gets partial points (70%), neutral gets 50%
        const wellPricedPoints = this.analysisResults.pricingAnalysis.wellPriced.length * 100;
        const underpricedPoints = this.analysisResults.pricingAnalysis.underpriced.length * 70;
        const neutralPoints = this.analysisResults.pricingAnalysis.neutral.length * 50;
        
        const score = Math.round((wellPricedPoints + underpricedPoints + neutralPoints) / (totalItems * 100) * 100);
        
        return Math.max(0, Math.min(100, score));
    }

    updateSoldSummaryCards() {
        if (this.soldAnalysisResults) {
            this.totalSales.textContent = this.soldAnalysisResults.totalSales || 0;
            this.totalRevenue.textContent = `$${(this.soldAnalysisResults.totalRevenue || 0).toLocaleString()}`;
            this.avgSalePrice.textContent = `$${(this.soldAnalysisResults.avgSalePrice || 0).toFixed(2)}`;
            this.avgRevenuePerDay.textContent = `$${(this.soldAnalysisResults.avgRevenuePerDay || 0).toFixed(2)}`;
        } else {
            this.totalSales.textContent = '0';
            this.totalRevenue.textContent = '$0';
            this.avgSalePrice.textContent = '$0';
            this.avgRevenuePerDay.textContent = '$0';
        }
    }
    
    updateProfitabilityMetrics() {
        if (!this.soldData || this.soldData.length === 0 || this.collections.length === 0) {
            // No data or no collections with purchase info
            if (this.totalCollectionProfits) this.totalCollectionProfits.textContent = '$0';
            if (this.avgDaysToBreakEven) this.avgDaysToBreakEven.textContent = '0';
            if (this.avgHoursPerCollection) this.avgHoursPerCollection.textContent = '0';
            if (this.avgGrossHourlyRate) this.avgGrossHourlyRate.textContent = '$0/hr';
            return;
        }
        
        // Get business metrics
        const minutesPerItem = this.businessMetrics.minutesPerItem || 0;
        const avgFeePercent = this.businessMetrics.avgFeePercent || 0;
        
        // Calculate metrics for each collection with purchase data
        const collectionMetrics = [];
        
        this.collections.forEach(purchaseData => {
            // Find all sales for this collection SKU
            const collectionSales = this.soldData.filter(sale => {
                const saleSKU = sale['Custom Label (SKU)'] || sale['Custom Label'] || '';
                return saleSKU.toLowerCase() === purchaseData.sku.toLowerCase() ||
                       saleSKU.toLowerCase() === purchaseData.name.toLowerCase();
            });
            
            if (collectionSales.length === 0) return;
            
            // Calculate total revenue for this collection
            const totalRevenue = collectionSales.reduce((sum, sale) => {
                const price = parseFloat((sale['Sold Price'] || sale['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
                return sum + price;
            }, 0);
            
            // Calculate total fees
            const totalFees = totalRevenue * (avgFeePercent / 100);
            
            // Calculate profit (Revenue - Cost - Fees)
            const purchaseCost = parseFloat(purchaseData.cost) || 0;
            const profit = totalRevenue - purchaseCost - totalFees;
            
            // Calculate hours worked
            const itemsSold = collectionSales.length;
            const hoursWorked = (itemsSold * minutesPerItem) / 60;
            
            // Calculate days to break-even
            let daysToBreakEven = 0;
            if (collectionSales.length > 0) {
                // Sort sales by date
                const sortedSales = [...collectionSales].sort((a, b) => {
                    const dateA = this.parseSoldDate(a['Sale Date'] || a['Sold Date'] || '');
                    const dateB = this.parseSoldDate(b['Sale Date'] || b['Sold Date'] || '');
                    return dateA - dateB;
                });
                
                // Calculate cumulative revenue until break-even
                let cumulativeRevenue = 0;
                let firstSaleDate = null;
                let breakEvenDate = null;
                
                for (const sale of sortedSales) {
                    const salePrice = parseFloat((sale['Sold Price'] || sale['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
                    cumulativeRevenue += salePrice;
                    
                    const saleDate = this.parseSoldDate(sale['Sale Date'] || sale['Sold Date'] || '');
                    if (!firstSaleDate) firstSaleDate = saleDate;
                    
                    // Check if we've broken even (revenue >= cost)
                    if (cumulativeRevenue >= purchaseCost && !breakEvenDate) {
                        breakEvenDate = saleDate;
                        break;
                    }
                }
                
                if (firstSaleDate && breakEvenDate) {
                    daysToBreakEven = Math.ceil((breakEvenDate - firstSaleDate) / (1000 * 60 * 60 * 24));
                }
            }
            
            collectionMetrics.push({
                profit,
                daysToBreakEven,
                hoursWorked,
                totalRevenue,
                itemsSold
            });
        });
        
        if (collectionMetrics.length === 0) {
            if (this.totalCollectionProfits) this.totalCollectionProfits.textContent = '$0';
            if (this.avgDaysToBreakEven) this.avgDaysToBreakEven.textContent = '0';
            if (this.avgHoursPerCollection) this.avgHoursPerCollection.textContent = '0';
            if (this.avgGrossHourlyRate) this.avgGrossHourlyRate.textContent = '$0/hr';
            return;
        }
        
        // Metric 1: Total Collection Profits
        const totalProfits = collectionMetrics.reduce((sum, m) => sum + m.profit, 0);
        
        // Metric 2: Average Days to Break-Even
        const validBreakEvenDays = collectionMetrics.filter(m => m.daysToBreakEven > 0);
        const avgDaysToBreakEven = validBreakEvenDays.length > 0 
            ? validBreakEvenDays.reduce((sum, m) => sum + m.daysToBreakEven, 0) / validBreakEvenDays.length 
            : 0;
        
        // Metric 3: Avg Hours Worked Per Collection
        const avgHours = collectionMetrics.reduce((sum, m) => sum + m.hoursWorked, 0) / collectionMetrics.length;
        
        // Metric 4: Avg Gross Hourly Rate (Total Revenue / Total Hours)
        const totalRevenue = collectionMetrics.reduce((sum, m) => sum + m.totalRevenue, 0);
        const totalHours = collectionMetrics.reduce((sum, m) => sum + m.hoursWorked, 0);
        const avgHourlyRate = totalHours > 0 ? totalRevenue / totalHours : 0;
        
        // Update UI
        if (this.totalCollectionProfits) {
            this.totalCollectionProfits.textContent = `$${totalProfits.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            // Color code based on profit/loss
            const profitCard = this.totalCollectionProfits.closest('.profit-metric');
            if (totalProfits >= 0) {
                this.totalCollectionProfits.style.color = '#059669';
                if (profitCard) profitCard.style.borderLeft = '4px solid #10b981';
            } else {
                this.totalCollectionProfits.style.color = '#dc2626';
                if (profitCard) profitCard.style.borderLeft = '4px solid #ef4444';
            }
        }
        
        if (this.avgDaysToBreakEven) {
            this.avgDaysToBreakEven.textContent = avgDaysToBreakEven > 0 ? Math.round(avgDaysToBreakEven) : 'N/A';
        }
        
        if (this.avgHoursPerCollection) {
            this.avgHoursPerCollection.textContent = avgHours.toFixed(1);
        }
        
        if (this.avgGrossHourlyRate) {
            this.avgGrossHourlyRate.textContent = `$${avgHourlyRate.toFixed(2)}/hr`;
        }
    }

    createDailySalesChart() {
        if (!this.soldData || this.soldData.length === 0) return;
        
        console.log('Creating Daily Sales Chart with', this.soldData.length, 'items');
        
        // Group sales by date and calculate daily revenue
        const dailyRevenue = {};
        
        this.soldData.forEach(item => {
            const soldDateStr = item['Sale Date'] || item['Sold Date'] || item['Order Date'];
            if (!soldDateStr) return;
            
            // Use the existing parseSoldDate function that handles eBay formats
            const date = this.parseSoldDate(soldDateStr);
            if (!date) return;
            
            const dateStr = date.toISOString().split('T')[0];
            
            // Parse price (handle $ and commas)
            const priceStr = String(item['Sold Price'] || item['Sold For'] || item['Total Price'] || '0');
            const price = parseFloat(priceStr.replace(/[$,]/g, '')) || 0;
            
            if (!dailyRevenue[dateStr]) {
                dailyRevenue[dateStr] = 0;
            }
            dailyRevenue[dateStr] += price;
        });
        
        console.log('Daily revenue data:', dailyRevenue);
        
        // Sort dates and create arrays for chart
        const sortedDates = Object.keys(dailyRevenue).sort();
        const revenues = sortedDates.map(date => dailyRevenue[date]);
        
        console.log('Chart data points:', sortedDates.length);
        
        const ctx = document.getElementById('dailySalesChart')?.getContext('2d');
        if (!ctx) {
            console.error('dailySalesChart canvas not found');
            return;
        }
        
        if (this.soldCharts.dailySales) {
            this.soldCharts.dailySales.destroy();
        }
        
        this.soldCharts.dailySales = new Chart(ctx, {
            type: 'line',
            data: {
                labels: sortedDates.map(date => new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })),
                datasets: [{
                    label: 'Daily Revenue',
                    data: revenues,
                    backgroundColor: 'rgba(16, 185, 129, 0.2)',
                    borderColor: 'rgba(16, 185, 129, 1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.3,
                    pointRadius: 4,
                    pointHoverRadius: 6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: true
                    },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                return 'Revenue: $' + context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2});
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
        
        console.log('Daily Sales Chart created successfully');
    }

    createTop10AvgPriceList() {
        if (!this.soldAnalysisResults?.collectionAnalysis?.collections) return;
        
        const collections = this.soldAnalysisResults.collectionAnalysis.collections
            .filter(c => c.totalSales >= 5)
            .sort((a, b) => b.avgPrice - a.avgPrice)
            .slice(0, 10);
        
        const container = document.getElementById('top10AvgPrice');
        container.innerHTML = '';
        
        collections.forEach((collection, index) => {
            const item = document.createElement('div');
            item.className = 'top-10-item';
            item.innerHTML = `
                <div class="top-10-rank">${index + 1}</div>
                <div class="top-10-name">${collection.name}</div>
                <div class="top-10-price">$${collection.avgPrice.toFixed(2)}</div>
            `;
            container.appendChild(item);
        });
    }

    createSalesChart() {
        const ctx = this.salesChart.getContext('2d');
        
        if (this.soldCharts.sales) {
            this.soldCharts.sales.destroy();
        }

        const salesByMonth = this.soldAnalysisResults.salesByMonth;
        const months = Object.keys(salesByMonth);
        const revenues = months.map(month => salesByMonth[month].revenue);

        this.soldCharts.sales = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: months,
                datasets: [{
                    label: 'Revenue ($)',
                    data: revenues,
                    backgroundColor: '#667eea',
                    borderColor: '#5a67d8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true
                    }
                }
            }
        });
    }

    createTopItemsChart() {
        const ctx = this.topItemsChart.getContext('2d');
        
        if (this.soldCharts.topItems) {
            this.soldCharts.topItems.destroy();
        }

        const topItems = this.soldAnalysisResults.topSellingItems.slice(0, 5);
        const labels = topItems.map(item => item.title.length > 20 ? item.title.substring(0, 20) + '...' : item.title);
        const revenues = topItems.map(item => item.totalRevenue);

        this.soldCharts.topItems = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: revenues,
                    backgroundColor: ['#ff6b6b', '#4ecdc4', '#45b7d1', '#96ceb4', '#feca57'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    updateSoldAnalysisTabs() {
        this.updateSoldSalesPerformanceTab();
        this.updateSoldRevenueBreakdownTab();
        this.updateCollectionPerformanceTab();
    }

    updateSoldSalesPerformanceTab() {
        // Populate the interactive sales table with all sold data
        if (this.soldData && this.soldData.length > 0) {
            this.populateSalesTable(this.soldData);
        }
    }
    
    populateSalesTable(data) {
        // Store current sales data
        this.currentSalesData = data.map(item => ({
            date: item['Sale Date'] || item['Sold Date'] || '',
            title: item['Item Title'] || item['Title'] || 'Unknown Item',
            itemNumber: item['Item number'] || item['Item Number'] || '',
            sku: item['Custom Label (SKU)'] || item['Custom Label'] || item['SKU'] || 'N/A',
            price: parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0,
            priceStr: item['Sold Price'] || item['Sold For'] || '$0',
            quantity: item['Quantity'] || '1',
            rawItem: item
        }));
        
        // Default sort by date (most recent first)
        this.filteredSalesData = [...this.currentSalesData];
        this.sortSalesTable('date');
    }
    
    renderSalesTable() {
        if (!this.salesTableBody) return;
        
        this.salesTableBody.innerHTML = '';
        
        this.filteredSalesData.forEach(item => {
            const row = document.createElement('tr');
            
            // Create clickable title if item number exists
            let titleHtml = item.title;
            if (item.itemNumber) {
                const ebayUrl = `https://www.ebay.com/itm/${item.itemNumber}`;
                titleHtml = `<a href="${ebayUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: none; font-weight: 500;">${item.title}</a>`;
            }
            
            // Find collection by matching Custom SKU
            let collectionHtml = '-';
            if (item.sku && item.sku !== '-' && this.collections && this.collections.length > 0) {
                const collection = this.collections.find(c => c.sku === item.sku);
                if (collection) {
                    collectionHtml = `<a href="#" onclick="appInstance.viewCollectionFromSKU('${collection.sku}'); return false;" style="color: #7c3aed; text-decoration: none; font-weight: 500;">${collection.sku}</a>`;
                } else {
                    collectionHtml = item.sku;
                }
            }
            
            row.innerHTML = `
                <td>${item.date}</td>
                <td>${titleHtml}</td>
                <td>${collectionHtml}</td>
                <td>$${item.price.toFixed(2)}</td>
                <td>${item.quantity}</td>
            `;
            this.salesTableBody.appendChild(row);
        });
        
        // Update count
        if (this.salesTableCount) {
            this.salesTableCount.textContent = `${this.filteredSalesData.length} of ${this.currentSalesData.length} sales`;
        }
    }
    
    filterSalesTable(searchTerm) {
        const search = searchTerm.toLowerCase();
        
        this.filteredSalesData = this.currentSalesData.filter(item => {
            return item.title.toLowerCase().includes(search) ||
                   item.sku.toLowerCase().includes(search) ||
                   item.priceStr.toLowerCase().includes(search) ||
                   item.price.toString().includes(search) ||
                   item.date.toLowerCase().includes(search);
        });
        
        this.renderSalesTable();
    }
    
    sortSalesTable(field) {
        // Toggle direction if clicking same field
        if (field === this.currentSortField) {
            this.currentSortDirection = this.currentSortDirection === 'asc' ? 'desc' : 'asc';
        } else {
            this.currentSortField = field;
            this.currentSortDirection = field === 'date' ? 'desc' : 'asc'; // Default desc for date, asc for others
        }
        
        // Sort the data
        this.filteredSalesData.sort((a, b) => {
            let compareA, compareB;
            
            switch(field) {
                case 'date':
                    const dateA = this.parseSoldDate(a.date);
                    const dateB = this.parseSoldDate(b.date);
                    compareA = dateA ? dateA.getTime() : 0;
                    compareB = dateB ? dateB.getTime() : 0;
                    break;
                case 'price':
                    compareA = a.price;
                    compareB = b.price;
                    break;
                case 'name':
                    compareA = a.title.toLowerCase();
                    compareB = b.title.toLowerCase();
                    break;
                case 'sku':
                    compareA = a.sku.toLowerCase();
                    compareB = b.sku.toLowerCase();
                    break;
                default:
                    return 0;
            }
            
            if (this.currentSortDirection === 'asc') {
                return compareA > compareB ? 1 : compareA < compareB ? -1 : 0;
            } else {
                return compareA < compareB ? 1 : compareA > compareB ? -1 : 0;
            }
        });
        
        this.renderSalesTable();
        
        // Update button states
        this.updateSortButtonStates(field);
    }
    
    updateSortButtonStates(activeField) {
        [this.sortByDate, this.sortByPrice, this.sortByName, this.sortBySKU].forEach(btn => {
            if (btn) btn.classList.remove('active');
        });
        
        const activeBtn = {
            'date': this.sortByDate,
            'price': this.sortByPrice,
            'name': this.sortByName,
            'sku': this.sortBySKU
        }[activeField];
        
        if (activeBtn) activeBtn.classList.add('active');
    }

    updateSoldRevenueBreakdownTab() {
        // Revenue Breakdown tab was removed - skip this
        // Keeping function for backwards compatibility
        return;
    }

    updateCollectionPerformanceTab() {
        console.log('🔍 updateCollectionPerformanceTab called');
        console.log('soldAnalysisResults:', this.soldAnalysisResults);
        console.log('collectionAnalysis:', this.soldAnalysisResults?.collectionAnalysis);
        
        if (!this.soldAnalysisResults?.collectionAnalysis) {
            console.warn('⚠️ No collection analysis data available');
            return;
        }
        
        // Always show the collection grid and hide details when updating the tab
        if (this.collectionsGrid) {
            this.collectionsGrid.style.display = 'grid';
            console.log('✅ Set collectionsGrid display to grid');
        } else {
            console.error('❌ collectionsGrid element not found!');
        }
        
        if (this.collectionDetails) {
            this.collectionDetails.style.display = 'none';
        }
        
        const collections = this.soldAnalysisResults.collectionAnalysis.collections;
        console.log('All collections:', collections);
        const qualifiedCollections = collections.filter(c => c.totalSales >= 5);
        console.log('Qualified collections (5+ sales):', qualifiedCollections);
        
        this.createCollectionBubbles(qualifiedCollections);
    }

    createCollectionBubbles(collections) {
        console.log('🔍 createCollectionBubbles called');
        console.log('Collections to display:', collections);
        console.log('Number of collections:', collections.length);
        
        const container = document.getElementById('collectionsGrid');
        console.log('Container element:', container);
        console.log('Container display style:', container ? container.style.display : 'N/A');
        
        if (!container) {
            console.error('❌ collectionsGrid container not found!');
            return;
        }
        
        container.innerHTML = '';
        console.log('Container cleared');
        
        if (collections.length === 0) {
            console.warn('⚠️ No collections to display');
            container.innerHTML = '<div class="no-data">No collections with 5+ sales found</div>';
            return;
        }
        
        console.log('✅ Creating bubbles for', collections.length, 'collections');
        
        // Sort collections by total revenue (highest first)
        const sortedCollections = [...collections].sort((a, b) => b.totalRevenue - a.totalRevenue);
        
        sortedCollections.forEach((collection, index) => {
            console.log(`Creating bubble ${index + 1}:`, collection.name);
            const bubble = document.createElement('div');
            
            // Determine ranking tier for color coding
            const totalCollections = sortedCollections.length;
            const tier = index / totalCollections;
            let tierClass = '';
            
            if (tier < 1/3) {
                tierClass = 'collection-bubble-top'; // Top 1/3 - Green
            } else if (tier < 2/3) {
                tierClass = 'collection-bubble-middle'; // Middle 1/3 - Yellow
            } else {
                tierClass = 'collection-bubble-bottom'; // Bottom 1/3 - Red
            }
            
            // Check if this collection has purchase data
            const hasPurchaseData = this.collections.some(c => 
                c.sku.toLowerCase() === collection.name.toLowerCase() ||
                c.name.toLowerCase() === collection.name.toLowerCase()
            );
            
            bubble.className = `collection-bubble ${tierClass}${hasPurchaseData ? ' has-purchase-data' : ''}`;
            bubble.dataset.collectionName = collection.name; // Add data attribute for matching
            
            // Rename "UNLABELED" to "RANDOM SALES"
            const displayName = collection.name === 'UNLABELED' ? 'RANDOM SALES' : collection.name;
            
            bubble.innerHTML = `
                <div class="collection-name">${displayName}</div>
                <div class="collection-metrics">
                    <div class="collection-metric">
                        <div class="collection-metric-label">Total Revenue</div>
                        <div class="collection-metric-value">$${collection.totalRevenue.toLocaleString()}</div>
                    </div>
                    <div class="collection-metric">
                        <div class="collection-metric-label">Items Sold</div>
                        <div class="collection-metric-value">${collection.totalSales}</div>
                    </div>
                </div>
                <div class="collection-days">Total Days Working: ${collection.totalDaysWorking || 0} days</div>
            `;
            
            bubble.addEventListener('click', () => {
                this.showCollectionDetails(collection);
            });
            container.appendChild(bubble);
        });
        
        console.log('Added', container.children.length, 'collection bubbles to grid');
    }

    populateSoldItemList(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item.title || item['Item Title'] || 'Unknown Item';
            const price = item.totalRevenue || item['Sold For'] || item['Sold Price'] || '$0';
            itemElement.innerHTML = `
                <div class="item-title">${title}</div>
                <div class="item-price">$${typeof price === 'number' ? price.toFixed(2) : price}</div>
            `;
            container.appendChild(itemElement);
        });
    }

    populateSoldShippingList(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item['Item Title'] || 'Unknown Item';
            const daysToShip = item.daysToShip || 0;
            itemElement.innerHTML = `
                <div class="item-title">${title}</div>
                <div class="item-price">${daysToShip} days</div>
            `;
            container.appendChild(itemElement);
        });
    }

    populateRevenueBreakdown(container, items) {
        container.innerHTML = '';
        items.slice(0, 5).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'recommendation-item';
            itemElement.innerHTML = `
                <div class="recommendation-title">${item.title}</div>
                <div class="recommendation-text">Revenue: $${item.totalRevenue.toFixed(2)} | Sales: ${item.count}</div>
            `;
            container.appendChild(itemElement);
        });
    }

    populateMonthlyTrends(container, salesByMonth) {
        container.innerHTML = '';
        Object.entries(salesByMonth).slice(0, 5).forEach(([month, data]) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'recommendation-item';
            itemElement.innerHTML = `
                <div class="recommendation-title">${month}</div>
                <div class="recommendation-text">Revenue: $${data.revenue.toFixed(2)} | Sales: ${data.count}</div>
            `;
            container.appendChild(itemElement);
        });
    }

    populateTopCollections(container, collections) {
        container.innerHTML = '';
        
        // Filter collections with 5+ sales
        const filteredCollections = collections.filter(collection => collection.totalSales >= 5);
        
        if (filteredCollections.length === 0) {
            container.innerHTML = '<div class="no-data">No collections with 5+ sales found</div>';
            return;
        }
        
        filteredCollections.forEach(collection => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item clickable-collection';
            itemElement.dataset.collectionName = collection.name;
            itemElement.innerHTML = `
                <div class="item-title">${collection.name}</div>
                <div class="item-price">$${collection.totalRevenue.toFixed(2)}</div>
                <div class="item-status">${collection.totalSales} sales</div>
                <div class="click-hint">Click for details →</div>
            `;
            
            // Add click event listener
            itemElement.addEventListener('click', () => this.showCollectionDetails(collection));
            container.appendChild(itemElement);
        });
    }

    populateCollectionRevenue(container, collections) {
        container.innerHTML = '';
        collections.forEach(collection => {
            const itemElement = document.createElement('div');
            itemElement.className = 'recommendation-item';
            itemElement.innerHTML = `
                <div class="recommendation-title">${collection.name}</div>
                <div class="recommendation-text">Revenue: $${collection.totalRevenue.toFixed(2)} | Avg: $${collection.avgPrice.toFixed(2)}</div>
            `;
            container.appendChild(itemElement);
        });
    }

    populateCollectionVolume(container, collections) {
        container.innerHTML = '';
        collections.forEach(collection => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            itemElement.innerHTML = `
                <div class="item-title">${collection.name}</div>
                <div class="item-price">${collection.totalSales} sales</div>
                <div class="item-status">${collection.totalQuantity} units</div>
            `;
            container.appendChild(itemElement);
        });
    }

    populateCollectionInsights(container, collectionAnalysis) {
        container.innerHTML = '';
        
        const insights = [];
        
        if (collectionAnalysis.topCollection) {
            insights.push({
                title: `Top Collection: ${collectionAnalysis.topCollection.name}`,
                text: `Generated $${collectionAnalysis.topCollection.totalRevenue.toFixed(2)} in revenue with ${collectionAnalysis.topCollection.totalSales} sales`
            });
        }
        
        const totalCollections = collectionAnalysis.totalCollections;
        const unlabeledCount = collectionAnalysis.collections.filter(c => c.name === 'Unlabeled').length;
        
        insights.push({
            title: `Collection Overview`,
            text: `${totalCollections} total collections identified, ${unlabeledCount} unlabeled items`
        });
        
        const avgRevenuePerCollection = collectionAnalysis.totalCollectionRevenue / totalCollections;
        insights.push({
            title: `Average Performance`,
            text: `Average revenue per collection: $${avgRevenuePerCollection.toFixed(2)}`
        });
        
        insights.forEach(insight => {
            const itemElement = document.createElement('div');
            itemElement.className = 'recommendation-item';
            itemElement.innerHTML = `
                <div class="recommendation-title">${insight.title}</div>
                <div class="recommendation-text">${insight.text}</div>
            `;
            container.appendChild(itemElement);
        });
    }

    showCollectionDetails(collection) {
        if (!collection) {
            return;
        }
        
        // Store current collection for reference
        this.currentCollection = collection;
        
        // Hide collection grid and show details
        if (this.collectionsGrid) {
            this.collectionsGrid.style.display = 'none';
            this.collectionsGrid.style.visibility = 'hidden';
            this.collectionsGrid.style.height = '0';
            this.collectionsGrid.style.overflow = 'hidden';
        }
        
        if (this.collectionDetails) {
            this.collectionDetails.style.display = 'block';
        }
        
        // Update title and metrics
        if (this.collectionDetailsTitle) {
            this.collectionDetailsTitle.textContent = collection.name;
        }
        
        if (this.collectionDetailTotalRevenue) {
            this.collectionDetailTotalRevenue.textContent = `$${collection.totalRevenue.toLocaleString()}`;
        }
        
        if (this.collectionDetailTotalSales) {
            this.collectionDetailTotalSales.textContent = collection.totalSales;
        }
        
        if (this.collectionDetailAvgPrice) {
            this.collectionDetailAvgPrice.textContent = `$${collection.avgPrice.toFixed(2)}`;
        }
        
        if (this.collectionDetailDaysRunning) {
            this.collectionDetailDaysRunning.textContent = collection.totalDaysWorking || 0;
        }
        
        // Calculate and display profitability metrics if purchase data exists
        this.calculateCollectionProfitability(collection);
        
        // Populate charts and lists
        this.createCollectionRevenueChart(collection);
        this.populateCollectionSalesList(collection);
        this.populateCollectionPriceRangeAnalysis(collection);
        
        // Populate quick collection entry form
        this.populateQuickCollectionForm(collection);
    }
    
    populateQuickCollectionForm(collection) {
        // Auto-fill the Display Name from collection name (readonly)
        const quickName = document.getElementById('quickCollectionName');
        if (quickName) {
            quickName.value = collection.name;
        }
        
        // Check if purchase data already exists for this collection
        const existingData = this.collections.find(c => 
            c.sku.toLowerCase() === collection.name.toLowerCase() ||
            c.name.toLowerCase() === collection.name.toLowerCase()
        );
        
        if (existingData) {
            // Pre-fill form with existing data
            const quickSKU = document.getElementById('quickCollectionSKU');
            const quickDate = document.getElementById('quickCollectionPurchaseDate');
            const quickCost = document.getElementById('quickCollectionCost');
            const quickNotes = document.getElementById('quickCollectionNotes');
            
            if (quickSKU) quickSKU.value = existingData.sku || collection.name;
            if (quickDate) quickDate.value = existingData.purchaseDate || '';
            if (quickCost) quickCost.value = existingData.cost || '';
            if (quickNotes) quickNotes.value = existingData.notes || '';
        } else {
            // Clear form for new entry, but suggest collection name as SKU
            this.clearQuickCollectionForm();
            // Set default SKU from collection name (editable)
            const quickSKU = document.getElementById('quickCollectionSKU');
            if (quickSKU) quickSKU.value = collection.name;
        }
    }
    
    handleQuickCollectionSubmit() {
        const collectionData = {
            name: document.getElementById('quickCollectionName').value,
            sku: document.getElementById('quickCollectionSKU').value,
            purchaseDate: document.getElementById('quickCollectionPurchaseDate').value,
            cost: parseFloat(document.getElementById('quickCollectionCost').value),
            notes: document.getElementById('quickCollectionNotes').value
        };
        
        if (!collectionData.name || !collectionData.sku || !collectionData.purchaseDate || !collectionData.cost) {
            alert('❌ Please fill in all required fields.');
            return;
        }
        
        if (this.saveCollection(collectionData)) {
            alert(`✅ Collection "${collectionData.name}" saved successfully!`);
            
            // Refresh the profitability metrics for this collection
            if (this.currentCollection) {
                this.calculateCollectionProfitability(this.currentCollection);
            }
            
            // Refresh profitability metrics on Sales Analytics
            this.updateProfitabilityMetrics();
            
            // Re-render collection grid to show the purchase data badge
            this.updateCollectionPerformanceTab();
        } else {
            alert('❌ Error saving collection. Please try again.');
        }
    }
    
    clearQuickCollectionForm() {
        // Don't clear Name (it's readonly) or SKU (keep the default suggestion)
        const quickDate = document.getElementById('quickCollectionPurchaseDate');
        const quickCost = document.getElementById('quickCollectionCost');
        const quickNotes = document.getElementById('quickCollectionNotes');
        
        if (quickDate) quickDate.value = '';
        if (quickCost) quickCost.value = '';
        if (quickNotes) quickNotes.value = '';
    }

    calculateCollectionProfitability(collection) {
        // Find matching collection purchase data by SKU or name
        const purchaseData = this.collections.find(c => 
            c.sku.toLowerCase() === collection.name.toLowerCase() ||
            c.name.toLowerCase() === collection.name.toLowerCase()
        );
        
        if (!purchaseData || !this.collectionProfitabilityMetrics) {
            // No purchase data, hide profitability metrics
            if (this.collectionProfitabilityMetrics) {
                this.collectionProfitabilityMetrics.style.display = 'none';
            }
            return;
        }
        
        // Show profitability metrics section
        this.collectionProfitabilityMetrics.style.display = 'block';
        
        // Get business metrics
        const minutesPerItem = this.businessMetrics.minutesPerItem || 0;
        const hourlyRate = this.businessMetrics.idealHourlyRate || 0;
        const avgFeePercent = this.businessMetrics.avgFeePercent || 0;
        
        // Calculate metrics
        const purchaseCost = parseFloat(purchaseData.cost) || 0;
        const totalRevenue = collection.totalRevenue || 0;
        const totalSales = collection.totalSales || 0;
        
        // 1. Gross Profit/Loss = Total Revenue - Purchase Cost
        const grossProfit = totalRevenue - purchaseCost;
        
        // 2. Hours Worked = (# of items sold × minutes per item) ÷ 60
        const hoursWorked = (totalSales * minutesPerItem) / 60;
        
        // 3. Total Fees = Total Revenue × Fee Percentage
        const totalFees = totalRevenue * (avgFeePercent / 100);
        
        // 4. Labor Cost = Hours Worked × Hourly Rate
        const laborCost = hoursWorked * hourlyRate;
        
        // 5. NET Profit/Loss = Gross Profit - Total Fees - Labor Cost
        const netProfit = grossProfit - totalFees - laborCost;
        
        // 6. Effective Hourly Rate = Net Profit ÷ Hours Worked
        const effectiveRate = hoursWorked > 0 ? netProfit / hoursWorked : 0;
        
        // Update UI
        if (this.collectionPurchaseCost) {
            this.collectionPurchaseCost.textContent = `$${purchaseCost.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        
        if (this.collectionGrossProfit) {
            this.collectionGrossProfit.textContent = `$${grossProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            this.collectionGrossProfit.style.color = grossProfit >= 0 ? '#065f46' : '#991b1b';
        }
        
        if (this.collectionHoursWorked) {
            this.collectionHoursWorked.textContent = hoursWorked.toFixed(1);
        }
        
        if (this.collectionTotalFees) {
            this.collectionTotalFees.textContent = `$${totalFees.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
        }
        
        if (this.collectionEffectiveRate) {
            this.collectionEffectiveRate.textContent = `$${effectiveRate.toFixed(2)}/hr`;
            this.collectionEffectiveRate.style.color = effectiveRate >= hourlyRate ? '#065f46' : '#991b1b';
        }
        
        // Update NET Profit with color coding
        if (this.collectionNetProfit) {
            const netProfitCard = this.collectionNetProfit.closest('.profit-card');
            
            this.collectionNetProfit.textContent = `$${netProfit.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
            
            if (netProfit < 0) {
                netProfitCard?.classList.add('negative');
                this.collectionNetProfit.style.color = '#991b1b';
                if (this.collectionNetProfitSubtext) {
                    this.collectionNetProfitSubtext.textContent = '⚠️ Operating at a loss';
                    this.collectionNetProfitSubtext.style.color = '#991b1b';
                }
            } else {
                netProfitCard?.classList.remove('negative');
                this.collectionNetProfit.style.color = '#065f46';
                if (this.collectionNetProfitSubtext) {
                    this.collectionNetProfitSubtext.textContent = '✅ Profitable!';
                    this.collectionNetProfitSubtext.style.color = '#065f46';
                }
            }
        }
    }

    showCollectionGrid() {
        // Hide collection details
        if (this.collectionDetails) {
            this.collectionDetails.style.display = 'none';
        }
        
        // Show collection grid with proper grid display
        if (this.collectionsGrid) {
            this.collectionsGrid.style.display = 'grid';
            this.collectionsGrid.style.visibility = 'visible';
            this.collectionsGrid.style.height = 'auto';
            this.collectionsGrid.style.overflow = 'visible';
        }
        
        // Reset current collection
        this.currentCollection = null;
    }

    createCollectionRevenueChart(collection) {
        const ctx = this.collectionRevenueChart.getContext('2d');
        
        // Group sales by date and calculate daily revenue
        const dailyRevenue = {};
        collection.items.forEach(item => {
            const saleDate = this.parseSoldDate(item['Sale Date'] || '');
            if (saleDate) {
                const dateKey = saleDate.toISOString().split('T')[0];
                const price = parseFloat((item['Sold For'] || '0').replace(/[$,]/g, '') || 0);
                dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + price;
            }
        });
        
        // Sort dates and create chart data
        const sortedDates = Object.keys(dailyRevenue).sort();
        const labels = sortedDates.map(date => new Date(date).toLocaleDateString());
        const data = sortedDates.map(date => dailyRevenue[date]);
        
        if (this.collectionRevenueChartInstance) {
            this.collectionRevenueChartInstance.destroy();
        }
        
        this.collectionRevenueChartInstance = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Daily Revenue',
                    data: data,
                    borderColor: '#3b82f6',
                    backgroundColor: 'rgba(59, 130, 246, 0.1)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.4
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }

    populateCollectionSalesList(collection, sortOrder = 'high') {
        this.collectionSalesList.innerHTML = '';
        
        // Sort items by price
        const sortedItems = collection.items.sort((a, b) => {
            const priceA = parseFloat((a['Sold For'] || '0').replace(/[$,]/g, '') || 0);
            const priceB = parseFloat((b['Sold For'] || '0').replace(/[$,]/g, '') || 0);
            return sortOrder === 'high' ? priceB - priceA : priceA - priceB;
        });
        
        // Show all items
        sortedItems.forEach((item, index) => {
            const itemElement = document.createElement('div');
            itemElement.className = 'sales-item';
            const title = item['Item Title'] || 'Unknown Item';
            const price = item['Sold For'] || '$0';
            const saleDate = item['Sale Date'] || 'Unknown Date';
            itemElement.innerHTML = `
                <div class="sales-item-title">${title}</div>
                <div class="sales-item-price">${price}</div>
                <div class="sales-item-date">${saleDate}</div>
            `;
            this.collectionSalesList.appendChild(itemElement);
        });
    }

    sortSalesByPrice(order) {
        console.log('Sorting sales by price:', order);
        console.log('Current collection:', this.currentCollection);
        
        if (this.currentCollection) {
            this.populateCollectionSalesList(this.currentCollection, order);
            console.log('Sales list updated with sort order:', order);
        } else {
            console.error('No current collection found');
        }
    }

    populateCollectionPriceRangeAnalysis(collection) {
        const prices = collection.items.map(item => 
            parseFloat((item['Sold For'] || '0').replace(/[$,]/g, '') || 0)
        ).filter(price => price > 0);
        
        if (prices.length === 0) {
            this.collectionPriceRangeAnalysis.innerHTML = '<div class="no-data">No price data available</div>';
            return;
        }
        
        const sortedPrices = prices.sort((a, b) => a - b);
        const minPrice = sortedPrices[0];
        const maxPrice = sortedPrices[sortedPrices.length - 1];
        const medianPrice = this.calculateMedian(sortedPrices);
        const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
        
        this.collectionPriceRangeAnalysis.innerHTML = `
            <div class="price-range-item">
                <div class="price-range-label">Lowest Price</div>
                <div class="price-range-value">$${minPrice.toFixed(2)}</div>
            </div>
            <div class="price-range-item">
                <div class="price-range-label">Highest Price</div>
                <div class="price-range-value">$${maxPrice.toFixed(2)}</div>
            </div>
            <div class="price-range-item">
                <div class="price-range-label">Median Price</div>
                <div class="price-range-value">$${medianPrice.toFixed(2)}</div>
            </div>
            <div class="price-range-item">
                <div class="price-range-label">Average Price</div>
                <div class="price-range-value">$${avgPrice.toFixed(2)}</div>
            </div>
            <div class="price-range-item">
                <div class="price-range-label">Price Range</div>
                <div class="price-range-value">$${(maxPrice - minPrice).toFixed(2)}</div>
            </div>
        `;
    }

    populateCollectionRecentSales(collection) {
        this.collectionRecentSales.innerHTML = '';
        
        // Sort items by sale date (most recent first)
        const sortedItems = collection.items.sort((a, b) => {
            const dateA = this.parseSoldDate(a['Sale Date'] || '');
            const dateB = this.parseSoldDate(b['Sale Date'] || '');
            return dateB - dateA;
        });
        
        sortedItems.slice(0, 10).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item['Item Title'] || 'Unknown Item';
            const price = item['Sold For'] || '$0';
            const saleDate = item['Sale Date'] || 'Unknown Date';
            itemElement.innerHTML = `
                <div class="item-title">${title}</div>
                <div class="item-price">${price}</div>
                <div class="item-status">${saleDate}</div>
            `;
            this.collectionRecentSales.appendChild(itemElement);
        });
    }

    populateCollectionPriceRange(collection) {
        const prices = collection.items.map(item => 
            parseFloat((item['Sold For'] || '0').replace(/[$,]/g, '') || 0)
        );
        
        const minPrice = Math.min(...prices);
        const maxPrice = Math.max(...prices);
        const medianPrice = this.calculateMedian(prices);
        
        this.collectionPriceRange.innerHTML = `
            <div class="price-range-item">
                <strong>Price Range:</strong> $${minPrice.toFixed(2)} - $${maxPrice.toFixed(2)}
            </div>
            <div class="price-range-item">
                <strong>Median Price:</strong> $${medianPrice.toFixed(2)}
            </div>
            <div class="price-range-item">
                <strong>Average Price:</strong> $${collection.avgPrice.toFixed(2)}
            </div>
        `;
    }

    populateCollectionTimeline(collection) {
        // Group sales by month
        const salesByMonth = {};
        
        collection.items.forEach(item => {
            const saleDate = item['Sale Date'] || '';
            const month = this.getMonthFromDate(saleDate);
            
            if (month) {
                if (!salesByMonth[month]) {
                    salesByMonth[month] = { count: 0, revenue: 0 };
                }
                salesByMonth[month].count++;
                const price = parseFloat((item['Sold For'] || '0').replace(/[$,]/g, '') || 0);
                salesByMonth[month].revenue += price;
            }
        });
        
        this.collectionTimeline.innerHTML = '';
        Object.entries(salesByMonth)
            .sort(([a], [b]) => new Date(a) - new Date(b))
            .forEach(([month, data]) => {
                const itemElement = document.createElement('div');
                itemElement.className = 'timeline-item';
                itemElement.innerHTML = `
                    <div class="timeline-month">${month}</div>
                    <div class="timeline-stats">${data.count} sales • $${data.revenue.toFixed(2)}</div>
                `;
                this.collectionTimeline.appendChild(itemElement);
            });
    }

    calculateMedian(numbers) {
        const sorted = numbers.sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
    }

    parseSoldDate(dateStr) {
        if (!dateStr) return null;
        
        // Handle various date formats from eBay
        const dateFormats = [
            /(\w{3})-(\d{1,2})-(\d{2})/,  // Sep-17-24
            /(\d{1,2})\/(\d{1,2})\/(\d{2,4})/,  // 9/17/24 or 9/17/2024
            /(\d{4})-(\d{1,2})-(\d{1,2})/  // 2024-09-17
        ];
        
        for (const format of dateFormats) {
            const match = dateStr.match(format);
            if (match) {
                if (format === dateFormats[0]) { // Sep-17-24
                    const months = {
                        'Jan': 0, 'Feb': 1, 'Mar': 2, 'Apr': 3, 'May': 4, 'Jun': 5,
                        'Jul': 6, 'Aug': 7, 'Sep': 8, 'Oct': 9, 'Nov': 10, 'Dec': 11
                    };
                    const year = 2000 + parseInt(match[3]);
                    return new Date(year, months[match[1]], parseInt(match[2]));
                } else if (format === dateFormats[1]) { // M/D/YY or M/D/YYYY
                    const month = parseInt(match[1]) - 1;
                    const day = parseInt(match[2]);
                    const year = match[3].length === 2 ? 2000 + parseInt(match[3]) : parseInt(match[3]);
                    return new Date(year, month, day);
                } else if (format === dateFormats[2]) { // YYYY-MM-DD
                    return new Date(parseInt(match[1]), parseInt(match[2]) - 1, parseInt(match[3]));
                }
            }
        }
        
        // Fallback to Date constructor
        const date = new Date(dateStr);
        return isNaN(date.getTime()) ? null : date;
    }

    createCharts() {
        this.createPricingChart();
        this.createSellThroughChart();
    }

    createPricingChart() {
        const ctx = this.pricingChart.getContext('2d');
        
        if (this.charts.pricing) {
            this.charts.pricing.destroy();
        }

        const pricingData = this.analysisResults.pricingAnalysis;
        this.charts.pricing = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: ['Overpriced', 'Well-Priced', 'Underpriced'],
                datasets: [{
                    data: [
                        pricingData.overpriced.length,
                        pricingData.wellPriced.length,
                        pricingData.underpriced.length
                    ],
                    backgroundColor: ['#ff6b6b', '#51cf66', '#ffd43b'],
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom'
                    }
                }
            }
        });
    }

    createSellThroughChart() {
        const ctx = this.sellThroughChart.getContext('2d');
        
        if (this.charts.sellThrough) {
            this.charts.sellThrough.destroy();
        }

        const categories = [...new Set(this.inventoryData.map(item => item['eBay categor'] || item['Category'] || 'Unknown'))];
        const categoryData = categories.map(category => {
            const categoryItems = this.analysisResults.sellThroughAnalysis.filter(item => 
                (item['eBay categor'] || item['Category'] || 'Unknown') === category);
            const avgSellThrough = categoryItems.reduce((sum, item) => sum + item.estimatedSellThrough, 0) / categoryItems.length;
            return { category, avgSellThrough };
        });

        this.charts.sellThrough = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: categoryData.map(item => item.category),
                datasets: [{
                    label: 'Avg. Sell-Through Rate (%)',
                    data: categoryData.map(item => item.avgSellThrough),
                    backgroundColor: '#667eea',
                    borderColor: '#5a67d8',
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: {
                    y: {
                        beginAtZero: true,
                        max: 100
                    }
                }
            }
        });
    }

    updateAnalysisTabs() {
        if (this.analysisResults) {
            console.log('Populating inventory analysis with data:', {
                longestListed: this.analysisResults.longestListed?.length,
                mostWatched: this.analysisResults.mostWatched?.length
            });
            
            if (this.longestListedItems) {
                this.populateLongestListedItems(this.longestListedItems, this.analysisResults.longestListed || []);
            }
            if (this.mostWatchedItems) {
                this.populateMostWatchedItems(this.mostWatchedItems, this.analysisResults.mostWatched || []);
            }
        }
    }

    updateRecommendationsTab() {
        if (this.analysisResults.recommendations) {
            this.populateRecommendations(this.priceRecommendations, this.analysisResults.recommendations.priceAdjustments || []);
            this.populateRecommendations(this.listingRecommendations, this.analysisResults.recommendations.listingOptimizations || []);
        } else {
            console.warn('Recommendations not available for display');
        }
    }

    populateLongestListedItems(container, items) {
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 1rem;">No items to display</p>';
            return;
        }
        
        items.slice(0, 15).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item['Title'] || item['Item Title'] || 'Unknown Item';
            const price = item['Current price'] || item['Current Price'] || '$0';
            const daysListed = item.daysListed || 0;
            const views = parseInt(item['Views'] || item['views'] || 0);
            const watchers = parseInt(item['Watchers'] || item['watchers'] || 0);
            
            itemElement.innerHTML = `
                <div style="flex: 1;">
                <div class="item-title">${title}</div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${views} views • ${watchers} watchers</div>
                </div>
                <div style="text-align: right;">
                <div class="item-price">${price}</div>
                    <div style="font-size: 0.75rem; color: #ef4444; margin-top: 0.25rem; font-weight: 600;">${daysListed} days</div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }
    
    populateMostWatchedItems(container, items) {
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 1rem;">No fixed-price items with watchers</p>';
            return;
        }
        
        items.slice(0, 15).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item['Title'] || item['Item Title'] || 'Unknown Item';
            const price = item['Current price'] || item['Current Price'] || '$0';
            const watchers = item.watchers || 0;
            const views = item.views || 0;
            const daysListed = this.calculateDaysListed(item['Start date'] || item['Start Date'] || '');
            
            itemElement.innerHTML = `
                <div style="flex: 1;">
                    <div class="item-title">${title}</div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${views} views • ${daysListed} days listed • Fixed Price</div>
                </div>
                <div style="text-align: right;">
                    <div class="item-price">${price}</div>
                    <div style="font-size: 0.75rem; color: #10b981; margin-top: 0.25rem; font-weight: 600;">⭐ ${watchers} watchers</div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }
    
    populateHighViewsLowWatchersItems(container, items) {
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 1rem;">No items match this criteria</p>';
            return;
        }
        
        items.slice(0, 15).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item['Title'] || item['Item Title'] || 'Unknown Item';
            const price = item['Current price'] || item['Current Price'] || '$0';
            const views = item.views || 0;
            const watchers = item.watchers || 0;
            const daysListed = item.daysListed || 0;
            const watcherRatio = item.watcherRatio || 0;
            
            itemElement.innerHTML = `
                <div style="flex: 1;">
                    <div class="item-title">${title}</div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${views} views, ${watchers} watchers (${watcherRatio.toFixed(1)}% ratio) • ${daysListed} days</div>
                </div>
                <div style="text-align: right;">
                    <div class="item-price">${price}</div>
                    <div style="font-size: 0.75rem; color: #f59e0b; margin-top: 0.25rem; font-weight: 600;">⚠️ Low interest</div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }
    
    populateHighEngagementItems(container, items) {
        container.innerHTML = '';
        
        if (items.length === 0) {
            container.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 1rem;">No items to display</p>';
            return;
        }
        
        items.slice(0, 15).forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item['Title'] || item['Item Title'] || 'Unknown Item';
            const price = item['Current price'] || item['Current Price'] || '$0';
            const views = item.views || 0;
            const watchers = item.watchers || 0;
            const watcherRatio = item.watcherRatio || 0;
            const daysListed = this.calculateDaysListed(item['Start date'] || item['Start Date'] || '');
            
            itemElement.innerHTML = `
                <div style="flex: 1;">
                    <div class="item-title">${title}</div>
                    <div style="font-size: 0.75rem; color: #6b7280; margin-top: 0.25rem;">${views} views, ${watchers} watchers • ${daysListed} days</div>
                </div>
                <div style="text-align: right;">
                    <div class="item-price">${price}</div>
                    <div style="font-size: 0.75rem; color: #10b981; margin-top: 0.25rem; font-weight: 600;">✅ ${watcherRatio.toFixed(1)}% engaged</div>
                </div>
            `;
            container.appendChild(itemElement);
        });
    }

    populatePerformanceList(container, items) {
        container.innerHTML = '';
        items.forEach(item => {
            const itemElement = document.createElement('div');
            itemElement.className = 'item-item';
            const title = item['Title'] || item['Item Title'] || 'Unknown Item';
            itemElement.innerHTML = `
                <div class="item-title">${title}</div>
                <div class="item-price">${item.estimatedSellThrough.toFixed(1)}%</div>
            `;
            container.appendChild(itemElement);
        });
    }

    populateRecommendations(container, recommendations) {
        container.innerHTML = '';
        recommendations.slice(0, 5).forEach(rec => {
            const recElement = document.createElement('div');
            recElement.className = 'recommendation-item';
            recElement.innerHTML = `
                <div class="recommendation-title">${rec.title}</div>
                <div class="recommendation-text">${rec.recommendation || rec.reason}</div>
            `;
            container.appendChild(recElement);
        });
    }

    switchTab(tabName) {
        // Update tab buttons
        this.tabBtns.forEach(btn => btn.classList.remove('active'));
        const targetBtn = document.querySelector(`[data-tab="${tabName}"]`);
        if (targetBtn) {
            targetBtn.classList.add('active');
        }

        // Update tab panels
        this.tabPanels.forEach(panel => panel.classList.remove('active'));
        const targetPanel = document.getElementById(`${tabName}-tab`);
        if (targetPanel) {
            targetPanel.classList.add('active');
        }
        
        // Reset collection view when switching to collection-performance tab
        if (tabName === 'collection-performance') {
            if (this.collectionsGrid) {
                this.collectionsGrid.style.display = 'grid';
                this.collectionsGrid.style.visibility = 'visible';
                this.collectionsGrid.style.height = 'auto';
                this.collectionsGrid.style.overflow = 'visible';
            }
            if (this.collectionDetails) {
                this.collectionDetails.style.display = 'none';
            }
            this.currentCollection = null;
        }
    }

    showProgress() {
        this.uploadProgress.style.display = 'block';
        this.progressFill.style.width = '0%';
        this.progressText.textContent = 'Processing inventory...';
    }

    updateProgress(percentage) {
        this.progressFill.style.width = `${percentage}%`;
        this.progressText.textContent = `Processing inventory... ${Math.round(percentage)}%`;
    }

    hideProgress() {
        this.uploadProgress.style.display = 'none';
    }

    showSoldProgress() {
        this.soldUploadProgress.style.display = 'block';
        this.soldProgressFill.style.width = '0%';
        this.soldProgressText.textContent = 'Processing sold listings...';
    }

    hideSoldProgress() {
        this.soldUploadProgress.style.display = 'none';
    }

    exportToCSV() {
        const csvData = this.inventoryData.map(item => ({
            'Item Title': item['Item Title'],
            'Current Price': item['Current Price'],
            'Category': item['Category'],
            'Condition': item['Condition'],
            'Days Listed': item['Days Listed'],
            'Views': item['Views'],
            'Watchers': item['Watchers']
        }));

        const csv = this.convertToCSV(csvData);
        this.downloadFile(csv, 'ebay-inventory-analysis.csv', 'text/csv');
    }

    exportToPDF() {
        // Simple PDF export simulation
        const reportData = {
            totalListings: this.analysisResults.totalListings,
            totalValue: this.analysisResults.totalValue,
            pricingAnalysis: this.analysisResults.pricingAnalysis,
            recommendations: this.analysisResults.recommendations
        };

        const reportText = this.generateReportText(reportData);
        this.downloadFile(reportText, 'ebay-inventory-report.txt', 'text/plain');
    }

    convertToCSV(data) {
        if (data.length === 0) return '';
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => headers.map(header => `"${row[header] || ''}"`).join(','))
        ].join('\n');
        
        return csvContent;
    }

    generateReportText(data) {
        return `
Reseller Numbers Analytics Report
Generated: ${new Date().toLocaleDateString()}

SUMMARY
-------
Total Listings: ${data.totalListings}
Total Inventory Value: $${data.totalValue.toLocaleString()}

PRICING ANALYSIS
---------------
Overpriced Items: ${data.pricingAnalysis.overpriced.length}
Well-Priced Items: ${data.pricingAnalysis.wellPriced.length}
Underpriced Items: ${data.pricingAnalysis.underpriced.length}

RECOMMENDATIONS
--------------
Price Adjustments: ${data.recommendations.priceAdjustments.length}
Listing Optimizations: ${data.recommendations.listingOptimizations.length}

DETAILED RECOMMENDATIONS
------------------------
${data.recommendations.priceAdjustments.map(rec => 
    `• ${rec.title}: ${rec.recommendation || rec.reason}`
).join('\n')}

${data.recommendations.listingOptimizations.map(rec => 
    `• ${rec.title}: ${rec.recommendation || rec.reason}`
).join('\n')}
        `;
    }

    downloadFile(content, filename, mimeType) {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        link.click();
        URL.revokeObjectURL(url);
    }

    // ========== COLLECTION MANAGEMENT METHODS ==========
    
    showCollectionManagement() {
        // Hide all other sections
        if (this.landingPage) this.landingPage.style.display = 'none';
        if (this.executiveDashboard) this.executiveDashboard.style.display = 'none';
        if (this.inventoryDashboard) this.inventoryDashboard.style.display = 'none';
        if (this.salesDashboard) this.salesDashboard.style.display = 'none';
        if (this.businessSettings) this.businessSettings.style.display = 'none';
        if (this.cardCropper) this.cardCropper.style.display = 'none';
        
        // Show collection management and scroll to top
        if (this.collectionManagement) {
            this.collectionManagement.style.display = 'block';
            window.scrollTo(0, 0);
        }
        
        this.populateSavedCollections();
        this.loadBusinessSettingsIntoForm();
    }

    viewCollectionFromSKU(sku) {
        // Navigate to Sales Dashboard, Collection Performance tab
        this.showSalesDashboard('collection-performance');
        
        // Find and click the collection bubble (matched by SKU which is the collection name)
        setTimeout(() => {
            const bubbles = document.querySelectorAll('.collection-bubble');
            let found = false;
            
            bubbles.forEach(bubble => {
                const collectionName = bubble.dataset.collectionName;
                // Match by collection name (which is the SKU in the sales data)
                if (collectionName && collectionName.toLowerCase() === sku.toLowerCase()) {
                    bubble.scrollIntoView({ behavior: 'smooth', block: 'center' });
                    bubble.style.animation = 'pulse-highlight 1s ease-in-out 3';
                    
                    // Auto-click the bubble to show details
                    setTimeout(() => {
                        bubble.click();
                    }, 1500);
                    
                    found = true;
                }
            });
            
            if (!found) {
                console.log(`Collection "${sku}" not found in bubbles. May have less than 5 sales.`);
            }
        }, 500);
    }
    
    showCsvHelp() {
        if (this.csvHelpModal) {
            this.csvHelpModal.style.display = 'flex';
        }
    }
    
    hideCsvHelp() {
        if (this.csvHelpModal) {
            this.csvHelpModal.style.display = 'none';
        }
    }
    
    // Progress bar methods
    showInventoryProgress() {
        const progressBar = document.getElementById('inventoryProgress');
        if (progressBar) {
            progressBar.style.display = 'block';
            this.updateInventoryProgress(0, 'Starting...');
        }
    }
    
    hideInventoryProgress() {
        const progressBar = document.getElementById('inventoryProgress');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }
    
    updateInventoryProgress(percent, text, isError = false) {
        const progressFill = document.getElementById('inventoryProgressFill');
        const progressText = document.getElementById('inventoryProgressText');
        const progressPercent = document.getElementById('inventoryProgressPercent');
        const progressBar = document.getElementById('inventoryProgress');
        
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressText) progressText.textContent = text;
        if (progressPercent) progressPercent.textContent = percent + '%';
        
        if (progressBar) {
            progressBar.className = 'upload-progress';
            if (isError) {
                progressBar.classList.add('progress-error');
            } else if (percent === 100) {
                progressBar.classList.add('progress-complete');
            } else {
                progressBar.classList.add('progress-processing');
            }
        }
    }
    
    showSoldProgressBar() {
        const progressBar = document.getElementById('soldProgress');
        if (progressBar) {
            progressBar.style.display = 'block';
            this.updateSoldProgress(0, 'Starting...');
        }
    }
    
    hideSoldProgressBar() {
        const progressBar = document.getElementById('soldProgress');
        if (progressBar) {
            progressBar.style.display = 'none';
        }
    }
    
    updateSoldProgress(percent, text, isError = false) {
        const progressFill = document.getElementById('soldProgressFill');
        const progressText = document.getElementById('soldProgressText');
        const progressPercent = document.getElementById('soldProgressPercent');
        const progressBar = document.getElementById('soldProgress');
        
        if (progressFill) progressFill.style.width = percent + '%';
        if (progressText) progressText.textContent = text;
        if (progressPercent) progressPercent.textContent = percent + '%';
        
        if (progressBar) {
            progressBar.className = 'upload-progress';
            if (isError) {
                progressBar.classList.add('progress-error');
            } else if (percent === 100) {
                progressBar.classList.add('progress-complete');
            } else {
                progressBar.classList.add('progress-processing');
            }
        }
    }
    
    handleCollectionFormSubmit() {
        const collectionData = {
            name: document.getElementById('collectionName').value,
            sku: document.getElementById('collectionSKU').value,
            purchaseDate: document.getElementById('collectionPurchaseDate').value,
            cost: parseFloat(document.getElementById('collectionCost').value),
            notes: document.getElementById('collectionNotes').value
        };
        
        if (this.saveCollection(collectionData)) {
            alert(`✅ Collection "${collectionData.name}" saved successfully!`);
            this.clearCollectionForm();
            this.populateSavedCollections();
        } else {
            alert('❌ Error saving collection. Please try again.');
        }
    }
    
    clearCollectionForm() {
        document.getElementById('collectionName').value = '';
        document.getElementById('collectionSKU').value = '';
        document.getElementById('collectionPurchaseDate').value = '';
        document.getElementById('collectionCost').value = '';
        document.getElementById('collectionNotes').value = '';
    }
    
    populateSavedCollections() {
        if (!this.savedCollectionsList) return;
        
        this.savedCollectionsList.innerHTML = '';
        
        if (this.collections.length === 0) {
            this.savedCollectionsList.innerHTML = '<p style="color: #6b7280; text-align: center; padding: 2rem;">No collections saved yet. Add your first collection above!</p>';
            return;
        }
        
        this.collections.forEach(collection => {
            const collectionItem = document.createElement('div');
            collectionItem.className = 'collection-item';
            
            const purchaseDate = new Date(collection.purchaseDate).toLocaleDateString();
            
            collectionItem.innerHTML = `
                <div class="collection-item-header">
                    <div class="collection-item-name">${collection.name}</div>
                    <div class="collection-item-sku">${collection.sku}</div>
                </div>
                <div class="collection-item-details">
                    <div class="collection-detail">
                        <span class="collection-detail-label">Purchase Date</span>
                        <span class="collection-detail-value">${purchaseDate}</span>
                    </div>
                    <div class="collection-detail">
                        <span class="collection-detail-label">Cost</span>
                        <span class="collection-detail-value">$${collection.cost.toLocaleString()}</span>
                    </div>
                    <div class="collection-detail">
                        <span class="collection-detail-label">SKU</span>
                        <span class="collection-detail-value">${collection.sku}</span>
                    </div>
                </div>
                ${collection.notes ? `<div class="collection-item-notes">📝 ${collection.notes}</div>` : ''}
                <div class="collection-item-actions">
                    <button class="btn-small-action" onclick="window.appInstance.editCollection('${collection.sku}')">✏️ Edit</button>
                    <button class="btn-small-action delete" onclick="window.appInstance.confirmDeleteCollection('${collection.sku}')">🗑️ Delete</button>
                </div>
            `;
            
            this.savedCollectionsList.appendChild(collectionItem);
        });
    }
    
    editCollection(sku) {
        const collection = this.getCollectionBySKU(sku);
        if (collection) {
            document.getElementById('collectionName').value = collection.name;
            document.getElementById('collectionSKU').value = collection.sku;
            document.getElementById('collectionPurchaseDate').value = collection.purchaseDate;
            document.getElementById('collectionCost').value = collection.cost;
            document.getElementById('collectionNotes').value = collection.notes || '';
            
            // Scroll to form
            this.collectionForm.scrollIntoView({ behavior: 'smooth' });
        }
    }
    
    confirmDeleteCollection(sku) {
        const collection = this.getCollectionBySKU(sku);
        if (collection && confirm(`Are you sure you want to delete "${collection.name}"? This cannot be undone.`)) {
            if (this.deleteCollection(sku)) {
                this.populateSavedCollections();
                alert(`✅ Collection "${collection.name}" deleted successfully.`);
            }
        }
    }
    
    // ========== BUSINESS SETTINGS METHODS ==========
    
    showBusinessSettings() {
        // Hide all other sections
        if (this.landingPage) this.landingPage.style.display = 'none';
        if (this.executiveDashboard) this.executiveDashboard.style.display = 'none';
        if (this.inventoryDashboard) this.inventoryDashboard.style.display = 'none';
        if (this.salesDashboard) this.salesDashboard.style.display = 'none';
        if (this.collectionManagement) this.collectionManagement.style.display = 'none';
        if (this.cardCropper) this.cardCropper.style.display = 'none';
        
        // Show business settings and scroll to top
        if (this.businessSettings) {
            this.businessSettings.style.display = 'block';
            window.scrollTo(0, 0);
        }
        
        this.loadBusinessSettingsIntoForm();
        this.updateBusinessSettingsDisplay();
    }
    
    loadBusinessSettingsIntoForm() {
        if (this.businessMetrics) {
            document.getElementById('minutesPerItem').value = this.businessMetrics.minutesPerItem || '';
            document.getElementById('idealHourlyRate').value = this.businessMetrics.idealHourlyRate || '';
            document.getElementById('avgFeePercent').value = this.businessMetrics.avgFeePercent || '';
            document.getElementById('taxBracket').value = this.businessMetrics.taxBracket || '';
        }
    }
    
    handleBusinessMetricsSubmit() {
        const metrics = {
            minutesPerItem: parseFloat(document.getElementById('minutesPerItem').value) || 0,
            idealHourlyRate: parseFloat(document.getElementById('idealHourlyRate').value) || 0,
            avgFeePercent: parseFloat(document.getElementById('avgFeePercent').value) || 0,
            taxBracket: parseFloat(document.getElementById('taxBracket').value) || 0
        };
        
        if (this.saveBusinessMetrics(metrics)) {
            alert('✅ Business settings saved successfully!');
            this.updateBusinessSettingsDisplay();
        } else {
            alert('❌ Error saving settings. Please try again.');
        }
    }
    
    updateBusinessSettingsDisplay() {
        if (this.displayMinutesPerItem) {
            this.displayMinutesPerItem.textContent = this.businessMetrics.minutesPerItem > 0 
                ? `${this.businessMetrics.minutesPerItem} minutes` 
                : 'Not set';
        }
        if (this.displayHourlyRate) {
            this.displayHourlyRate.textContent = this.businessMetrics.idealHourlyRate > 0 
                ? `$${this.businessMetrics.idealHourlyRate.toFixed(2)}/hr` 
                : 'Not set';
        }
        if (this.displayFeePercent) {
            this.displayFeePercent.textContent = this.businessMetrics.avgFeePercent > 0 
                ? `${this.businessMetrics.avgFeePercent}%` 
                : 'Not set';
        }
        if (this.displayTaxBracket) {
            this.displayTaxBracket.textContent = this.businessMetrics.taxBracket > 0 
                ? `${this.businessMetrics.taxBracket}%` 
                : 'Not set';
        }
    }
    
    // ========== DATA PERSISTENCE METHODS ==========
    
    loadStoredData() {
        try {
            // Load stored inventory data
            const storedInventory = localStorage.getItem('ebay_inventory_data');
            if (storedInventory) {
                this.storedInventoryData = JSON.parse(storedInventory);
                console.log('Loaded', this.storedInventoryData.length, 'stored inventory items');
            }
            
            // Load stored sold data
            const storedSold = localStorage.getItem('ebay_sold_data');
            if (storedSold) {
                this.storedSoldData = JSON.parse(storedSold);
                console.log('Loaded', this.storedSoldData.length, 'stored sold items');
            }
            
            // Load stored unsold data
            const storedUnsold = localStorage.getItem('ebay_unsold_data');
            if (storedUnsold) {
                this.storedUnsoldData = JSON.parse(storedUnsold);
                this.unsoldData = this.storedUnsoldData;
                console.log('Loaded', this.storedUnsoldData.length, 'stored unsold items');
            }
            
            // Load collection purchase data
            const storedCollections = localStorage.getItem('ebay_collections');
            if (storedCollections) {
                this.collections = JSON.parse(storedCollections);
                console.log('Loaded', this.collections.length, 'collections');
            }
            
            // Load business metrics
            const storedMetrics = localStorage.getItem('ebay_business_metrics');
            if (storedMetrics) {
                this.businessMetrics = JSON.parse(storedMetrics);
                console.log('Loaded business metrics');
            }
        } catch (error) {
            console.error('Error loading stored data:', error);
        }
    }
    
    saveInventoryData(data, append = true) {
        try {
            if (append && this.storedInventoryData.length > 0) {
                // Merge with existing data, avoiding duplicates
                const merged = this.mergeInventoryData(this.storedInventoryData, data);
                this.storedInventoryData = merged;
            } else {
                this.storedInventoryData = data;
            }
            
            // Limit stored data to prevent quota issues (keep last 5,000 items)
            if (this.storedInventoryData.length > 5000) {
                this.storedInventoryData = this.storedInventoryData.slice(-5000);
                console.warn('Trimmed inventory data to 5,000 most recent items to save storage');
            }
            
            localStorage.setItem('ebay_inventory_data', JSON.stringify(this.storedInventoryData));
            console.log('Saved', this.storedInventoryData.length, 'inventory items');
            return this.storedInventoryData.length;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded. Keeping data in memory only.');
                alert('⚠️ Storage limit reached. Data will be kept in memory for this session but not saved permanently.');
                // Keep data in memory but don't save to localStorage
                return this.storedInventoryData.length;
            }
            console.error('Error saving inventory data:', error);
            return 0;
        }
    }
    
    saveSoldData(data, append = true) {
        try {
            if (append && this.storedSoldData.length > 0) {
                // Merge with existing data, avoiding duplicates
                const merged = this.mergeSoldData(this.storedSoldData, data);
                this.storedSoldData = merged;
            } else {
                this.storedSoldData = data;
            }
            
            // Limit stored data to prevent quota issues (keep last 10,000 items)
            if (this.storedSoldData.length > 10000) {
                this.storedSoldData = this.storedSoldData.slice(-10000);
                console.warn('Trimmed sold data to 10,000 most recent items to save storage');
            }
            
            localStorage.setItem('ebay_sold_data', JSON.stringify(this.storedSoldData));
            console.log('Saved', this.storedSoldData.length, 'sold items');
            return this.storedSoldData.length;
        } catch (error) {
            if (error.name === 'QuotaExceededError') {
                console.error('LocalStorage quota exceeded. Keeping data in memory only.');
                alert('⚠️ Storage limit reached. Data will be kept in memory for this session but not saved permanently. Consider clearing old data.');
                // Keep data in memory but don't save to localStorage
                return this.storedSoldData.length;
            }
            console.error('Error saving sold data:', error);
            return 0;
        }
    }
    
    mergeInventoryData(existing, newData) {
        // Create a Set of unique item identifiers from existing data
        const existingKeys = new Set(
            existing.map(item => `${item['Item Title']}_${item['Start date']}_${item['Current price']}`)
        );
        
        // Filter out duplicates from new data
        const uniqueNew = newData.filter(item => {
            const key = `${item['Item Title']}_${item['Start date']}_${item['Current price']}`;
            return !existingKeys.has(key);
        });
        
        console.log('Adding', uniqueNew.length, 'new inventory items (', newData.length - uniqueNew.length, 'duplicates skipped)');
        return [...existing, ...uniqueNew];
    }
    
    mergeSoldData(existing, newData) {
        // Create a Set of unique item identifiers from existing data
        const existingKeys = new Set(
            existing.map(item => `${item['Item Title']}_${item['Sale Date']}_${item['Sold For']}`)
        );
        
        // Filter out duplicates from new data
        const uniqueNew = newData.filter(item => {
            const key = `${item['Item Title']}_${item['Sale Date']}_${item['Sold For']}`;
            return !existingKeys.has(key);
        });
        
        console.log('Adding', uniqueNew.length, 'new sold items (', newData.length - uniqueNew.length, 'duplicates skipped)');
        return [...existing, ...uniqueNew];
    }
    
    saveCollection(collectionData) {
        try {
            // Check if collection already exists (by SKU)
            const existingIndex = this.collections.findIndex(c => c.sku === collectionData.sku);
            
            if (existingIndex >= 0) {
                // Update existing collection
                this.collections[existingIndex] = { ...this.collections[existingIndex], ...collectionData };
            } else {
                // Add new collection
                this.collections.push(collectionData);
            }
            
            localStorage.setItem('ebay_collections', JSON.stringify(this.collections));
            console.log('Saved collection:', collectionData.name);
            
            // Also save to Supabase if available
            if (supabaseService && supabaseService.client) {
                this.saveCollectionToSupabase(collectionData, existingIndex >= 0);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving collection:', error);
            return false;
        }
    }
    
    async saveCollectionToSupabase(collectionData, isUpdate) {
        try {
            if (isUpdate) {
                // Find the collection ID
                const existingCollection = this.collections.find(c => c.sku === collectionData.sku);
                if (existingCollection && existingCollection.id) {
                    await supabaseService.updateCollection(existingCollection.id, collectionData);
                }
            } else {
                await supabaseService.saveCollection(collectionData);
                // Reload collections from Supabase to get the ID
                const collections = await supabaseService.getCollections();
                if (collections) {
                    this.collections = collections.map(c => ({
                        name: c.name,
                        sku: c.sku,
                        purchaseDate: c.purchase_date,
                        cost: c.cost,
                        notes: c.notes,
                        id: c.id
                    }));
                    localStorage.setItem('ebay_collections', JSON.stringify(this.collections));
                }
            }
        } catch (error) {
            console.error('Error saving collection to Supabase:', error);
        }
    }
    
    deleteCollection(sku) {
        try {
            this.collections = this.collections.filter(c => c.sku !== sku);
            localStorage.setItem('ebay_collections', JSON.stringify(this.collections));
            console.log('Deleted collection with SKU:', sku);
            return true;
        } catch (error) {
            console.error('Error deleting collection:', error);
            return false;
        }
    }
    
    saveBusinessMetrics(metrics) {
        try {
            this.businessMetrics = { ...this.businessMetrics, ...metrics };
            localStorage.setItem('ebay_business_metrics', JSON.stringify(this.businessMetrics));
            console.log('Saved business metrics');
            
            // Also save to Supabase if available
            if (supabaseService && supabaseService.client) {
                this.saveBusinessMetricsToSupabase(metrics);
            }
            
            return true;
        } catch (error) {
            console.error('Error saving business metrics:', error);
            return false;
        }
    }
    
    async saveBusinessMetricsToSupabase(metrics) {
        try {
            await supabaseService.saveBusinessMetrics(metrics);
        } catch (error) {
            console.error('Error saving business metrics to Supabase:', error);
        }
    }
    
    clearAllData() {
        if (confirm('⚠️ Clear CSV Data?\n\nThis will delete:\n- All inventory data\n- All sold data\n- All unsold data\n\n✅ This will KEEP:\n- Collection purchase data\n- Business settings\n\nContinue?')) {
            localStorage.removeItem('ebay_inventory_data');
            localStorage.removeItem('ebay_sold_data');
            localStorage.removeItem('ebay_unsold_data');
            
            // Preserve collections and business metrics
            // localStorage.removeItem('ebay_collections'); // REMOVED - Keep this!
            // localStorage.removeItem('ebay_business_metrics'); // REMOVED - Keep this!
            
            this.storedInventoryData = [];
            this.storedSoldData = [];
            this.storedUnsoldData = [];
            this.unsoldData = [];
            this.inventoryData = [];
            this.soldData = [];
            
            // Keep collections and business metrics intact
            // this.collections = []; // REMOVED
            // this.businessMetrics = {...}; // REMOVED
            
            console.log('CSV data cleared (Collections & Settings preserved)');
            alert('✅ CSV data has been cleared.\n\nYour Collection Information and Business Settings are safe! 🎯\n\nThe page will reload.');
            location.reload();
        }
    }
    
    clearCSVData() {
        if (confirm('Clear stored CSV data only?\n\nThis will free up storage space but keep your collections and settings.\n\nContinue?')) {
            localStorage.removeItem('ebay_inventory_data');
            localStorage.removeItem('ebay_sold_data');
            localStorage.removeItem('ebay_unsold_data');
            
            this.storedInventoryData = [];
            this.storedSoldData = [];
            this.storedUnsoldData = [];
            this.unsoldData = [];
            
            console.log('CSV data cleared');
            alert('✅ CSV data cleared. Storage space freed up!');
        }
    }
    
    getCollectionBySKU(sku) {
        return this.collections.find(c => c.sku === sku);
    }
    
    // ============= ANNUAL BUSINESS REVIEW FUNCTIONS =============
    
    switchExecTab(tabName) {
        // Update tab buttons
        this.execTabBtns.forEach(btn => {
            if (btn.getAttribute('data-tab') === tabName) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });
        
        // Update tab content
        this.execTabContents.forEach(content => {
            if (content.id === `${tabName}-tab`) {
                content.classList.add('active');
            } else {
                content.classList.remove('active');
            }
        });
        
        // If switching to annual review, populate it
        if (tabName === 'annual-review') {
            this.populateAnnualBusinessReview();
        }
        
        // If switching to secret analysis, populate it
        if (tabName === 'secret-analysis') {
            this.populateSecretAnalysis();
        }
    }
    
    populateAnnualBusinessReview() {
        if (!this.soldData || this.soldData.length === 0) {
            if (this.monthsGrid) {
                this.monthsGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">No sales data available</p>';
            }
            return;
        }
        
        // Calculate monthly and weekly data
        this.calculateMonthlyData();
        this.calculateWeeklyData();
        
        // Populate the month grid and weekly chart
        this.populateMonthGrid();
        this.createWeeklyBarChart();
        
        // Populate current snapshots
        this.populateCurrentSnapshots();
        
        // Populate store snapshot
        this.populateStoreSnapshot();
    }
    
    calculateMonthlyData() {
        const monthlyMap = {};
        
        this.soldData.forEach(item => {
            const dateStr = item['Sale Date'] || item['Sold Date'] || '';
            if (!dateStr) return;
            
            const date = this.parseSoldDate(dateStr);
            if (!date) return;
            
            const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            
            if (!monthlyMap[monthKey]) {
                monthlyMap[monthKey] = {
                    monthKey,
                    year: date.getFullYear(),
                    month: date.getMonth(),
                    monthName: date.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
                    totalSales: 0,
                    itemsSold: 0,
                    items: []
                };
            }
            
            monthlyMap[monthKey].totalSales += price;
            monthlyMap[monthKey].itemsSold++;
            monthlyMap[monthKey].items.push({
                title: item['Item Title'] || item['Title'] || 'Unknown Item',
                price: price,
                date: dateStr,
                itemNumber: item['Item number'] || item['Item Number'] || ''
            });
        });
        
        this.monthlyData = Object.values(monthlyMap).sort((a, b) => a.monthKey.localeCompare(b.monthKey));
    }
    
    calculateWeeklyData() {
        const weeklyMap = {};
        
        // Get the first and last dates to determine week range
        let minDate = null;
        let maxDate = null;
        
        this.soldData.forEach(item => {
            const dateStr = item['Sale Date'] || item['Sold Date'] || '';
            if (!dateStr) return;
            
            const date = this.parseSoldDate(dateStr);
            if (!date) return;
            
            if (!minDate || date < minDate) minDate = date;
            if (!maxDate || date > maxDate) maxDate = date;
        });
        
        if (!minDate || !maxDate) {
            this.weeklyData = [];
            return;
        }
        
        // Helper to get week number of year
        const getWeekNumber = (date) => {
            const onejan = new Date(date.getFullYear(), 0, 1);
            const numberOfDays = Math.floor((date - onejan) / (24 * 60 * 60 * 1000));
            return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
        };
        
        this.soldData.forEach(item => {
            const dateStr = item['Sale Date'] || item['Sold Date'] || '';
            if (!dateStr) return;
            
            const date = this.parseSoldDate(dateStr);
            if (!date) return;
            
            const year = date.getFullYear();
            const weekNum = getWeekNumber(date);
            const weekKey = `${year}-W${String(weekNum).padStart(2, '0')}`;
            
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            
            if (!weeklyMap[weekKey]) {
                weeklyMap[weekKey] = {
                    weekKey,
                    year,
                    weekNumber: weekNum,
                    weekLabel: `Week ${weekNum}, ${year}`,
                    totalSales: 0,
                    itemsSold: 0,
                    items: []
                };
            }
            
            weeklyMap[weekKey].totalSales += price;
            weeklyMap[weekKey].itemsSold++;
            weeklyMap[weekKey].items.push({
                title: item['Item Title'] || item['Title'] || 'Unknown Item',
                price: price,
                date: dateStr,
                itemNumber: item['Item number'] || item['Item Number'] || ''
            });
        });
        
        this.weeklyData = Object.values(weeklyMap).sort((a, b) => a.weekKey.localeCompare(b.weekKey));
    }
    
    populateMonthGrid() {
        if (!this.monthsGrid) return;
        
        if (this.monthlyData.length === 0) {
            this.monthsGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">No monthly data available</p>';
            return;
        }
        
        // Filter to only show current calendar year
        const currentYear = new Date().getFullYear();
        const currentYearMonths = this.monthlyData.filter(m => m.year === currentYear);
        
        if (currentYearMonths.length === 0) {
            this.monthsGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">No data for current year</p>';
            return;
        }
        
        // Find min/max sales for color coding (using only current year data)
        const salesValues = currentYearMonths.map(m => m.totalSales);
        const minSales = Math.min(...salesValues);
        const maxSales = Math.max(...salesValues);
        
        // Helper to get color based on sales amount
        const getColorForSales = (sales) => {
            if (maxSales === minSales) {
                return 'rgb(34, 197, 94)'; // Green if all same
            }
            
            const ratio = (sales - minSales) / (maxSales - minSales);
            
            // Color gradient from red (low) to yellow to green (high)
            if (ratio < 0.5) {
                // Red to Yellow
                const r = 239;
                const g = Math.round(68 + (234 - 68) * (ratio * 2));
                const b = 68;
                return `rgb(${r}, ${g}, ${b})`;
            } else {
                // Yellow to Green
                const r = Math.round(234 - (234 - 34) * ((ratio - 0.5) * 2));
                const g = Math.round(179 + (197 - 179) * ((ratio - 0.5) * 2));
                const b = Math.round(8 + (94 - 8) * ((ratio - 0.5) * 2));
                return `rgb(${r}, ${g}, ${b})`;
            }
        };
        
        this.monthsGrid.innerHTML = '';
        
        // Only display current year months
        currentYearMonths.forEach(monthData => {
            const monthBox = document.createElement('div');
            monthBox.className = 'month-box';
            monthBox.style.background = getColorForSales(monthData.totalSales);
            monthBox.innerHTML = `
                <div class="month-name">${monthData.monthName}</div>
                <div class="month-sales">$${monthData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                <div class="month-items">${monthData.itemsSold} items sold</div>
            `;
            
            monthBox.addEventListener('click', () => this.showMonthDetails(monthData));
            
            this.monthsGrid.appendChild(monthBox);
        });
    }
    
    createWeeklyBarChart() {
        if (!this.weeklyBarChart) return;
        
        if (this.weeklyData.length === 0) {
            return;
        }
        
        // Destroy existing chart if it exists
        if (this.weeklyBarChartInstance) {
            this.weeklyBarChartInstance.destroy();
        }
        
        // Find min/max sales for color coding
        const salesValues = this.weeklyData.map(w => w.totalSales);
        const minSales = Math.min(...salesValues);
        const maxSales = Math.max(...salesValues);
        
        // Calculate median weekly revenue
        const sortedSales = [...salesValues].sort((a, b) => a - b);
        const median = sortedSales.length % 2 === 0
            ? (sortedSales[sortedSales.length / 2 - 1] + sortedSales[sortedSales.length / 2]) / 2
            : sortedSales[Math.floor(sortedSales.length / 2)];
        
        // Generate colors for each bar
        const backgroundColors = this.weeklyData.map(week => {
            const ratio = (week.totalSales - minSales) / (maxSales - minSales);
            
            if (ratio < 0.33) {
                return `rgba(239, 68, 68, 0.8)`; // Red
            } else if (ratio < 0.67) {
                return `rgba(234, 179, 8, 0.8)`; // Yellow/Orange
            } else {
                return `rgba(34, 197, 94, 0.8)`; // Green
            }
        });
        
        // Calculate max value for secondary y-axis
        const maxItems = Math.max(...this.weeklyData.map(w => w.itemsSold));
        
        this.weeklyBarChartInstance = new Chart(this.weeklyBarChart, {
            type: 'bar',
            data: {
                labels: this.weeklyData.map(w => `W${w.weekNumber}`),
                datasets: [
                    {
                    label: 'Weekly Sales',
                    data: this.weeklyData.map(w => w.totalSales),
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors.map(c => c.replace('0.8', '1')),
                        borderWidth: 1,
                        yAxisID: 'y',
                        order: 2
                    },
                    {
                        label: 'Median Revenue',
                        data: Array(this.weeklyData.length).fill(median),
                        type: 'line',
                        borderColor: 'rgba(102, 126, 234, 0.8)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0,
                        pointHoverRadius: 0,
                        fill: false,
                        yAxisID: 'y',
                        order: 1
                    },
                    {
                        label: 'Items Sold',
                        data: this.weeklyData.map(w => w.itemsSold),
                        type: 'line',
                        borderColor: 'rgba(147, 51, 234, 0.8)',
                        backgroundColor: 'rgba(147, 51, 234, 0.1)',
                        borderWidth: 2,
                        pointRadius: 3,
                        pointHoverRadius: 5,
                        fill: false,
                        yAxisID: 'y1',
                        order: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                onClick: (event, activeElements) => {
                    if (activeElements.length > 0) {
                        const index = activeElements[0].index;
                        this.showWeekDetails(this.weeklyData[index]);
                    }
                },
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            usePointStyle: true,
                            padding: 15
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const weekData = this.weeklyData[context.dataIndex];
                                if (context.dataset.label === 'Weekly Sales') {
                                    return `Total Sales: $${weekData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
                                } else if (context.dataset.label === 'Items Sold') {
                                    return `Items Sold: ${weekData.itemsSold}`;
                                } else if (context.dataset.label === 'Median Revenue') {
                                    return `Median: $${median.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
                                }
                                return '';
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        type: 'linear',
                        display: true,
                        position: 'left',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Revenue ($)'
                        },
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    y1: {
                        type: 'linear',
                        display: true,
                        position: 'right',
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: 'Items Sold'
                        },
                        grid: {
                            drawOnChartArea: false
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 90,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }
    
    showMonthDetails(monthData) {
        if (!this.monthlyDetailView || !this.annualReviewMain) return;
        
        // Hide main view, show detail view
        this.annualReviewMain.style.display = 'none';
        this.monthlyDetailView.style.display = 'block';
        
        // Update title
        if (this.monthlyDetailTitle) {
            this.monthlyDetailTitle.textContent = `${monthData.monthName} - Detailed Analysis`;
        }
        
        // Update summary cards
        if (this.monthlyTotalSales) {
            this.monthlyTotalSales.textContent = `$${monthData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.monthlyItemsSold) {
            this.monthlyItemsSold.textContent = monthData.itemsSold;
        }
        
        // Calculate average daily sales
        const daysInMonth = new Date(monthData.year, monthData.month + 1, 0).getDate();
        const avgDaily = monthData.totalSales / daysInMonth;
        if (this.monthlyAvgDaily) {
            this.monthlyAvgDaily.textContent = `$${avgDaily.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        
        // Find best day
        const dailyTotals = {};
        monthData.items.forEach(item => {
            if (!dailyTotals[item.date]) {
                dailyTotals[item.date] = 0;
            }
            dailyTotals[item.date] += item.price;
        });
        
        let bestDay = { date: '-', total: 0 };
        Object.entries(dailyTotals).forEach(([date, total]) => {
            if (total > bestDay.total) {
                bestDay = { date, total };
            }
        });
        
        if (this.monthlyBestDay) {
            this.monthlyBestDay.textContent = `${bestDay.date} ($${bestDay.total.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})})`;
        }
        
        // Create daily sales chart
        this.createMonthlyDailyChart(monthData);
        
        // Populate top 50 items
        this.populateMonthlyTopItems(monthData);
    }
    
    createMonthlyDailyChart(monthData) {
        if (!this.monthlyDailyChart) return;
        
        // Group sales by day
        const dailyMap = {};
        
        monthData.items.forEach(item => {
            const date = item.date;
            if (!dailyMap[date]) {
                dailyMap[date] = 0;
            }
            dailyMap[date] += item.price;
        });
        
        // Sort by date
        const sortedDays = Object.keys(dailyMap).sort((a, b) => {
            const dateA = this.parseSoldDate(a);
            const dateB = this.parseSoldDate(b);
            return dateA - dateB;
        });
        
        const dailyValues = sortedDays.map(day => dailyMap[day]);
        
        // Destroy existing chart if it exists
        if (this.monthlyDailyChartInstance) {
            this.monthlyDailyChartInstance.destroy();
        }
        
        this.monthlyDailyChartInstance = new Chart(this.monthlyDailyChart, {
            type: 'line',
            data: {
                labels: sortedDays,
                datasets: [{
                    label: 'Daily Sales',
                    data: dailyValues,
                    borderColor: 'rgb(124, 58, 237)',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `$${context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
        
        // Also create the daily performance chart with color coding
        this.createMonthlyDailyPerformanceChart(monthData);
    }
    
    createMonthlyDailyPerformanceChart(monthData) {
        if (!this.monthlyDailyPerformanceChart) return;
        
        // Group sales by day
        const dailyMap = {};
        
        monthData.items.forEach(item => {
            const date = item.date;
            if (!dailyMap[date]) {
                dailyMap[date] = 0;
            }
            dailyMap[date] += item.price;
        });
        
        // Sort by date
        const sortedDays = Object.keys(dailyMap).sort((a, b) => {
            const dateA = this.parseSoldDate(a);
            const dateB = this.parseSoldDate(b);
            return dateA - dateB;
        });
        
        const dailyValues = sortedDays.map(day => dailyMap[day]);
        
        // Calculate percentiles
        const sortedValues = [...dailyValues].sort((a, b) => a - b);
        const count = sortedValues.length;
        const top10Threshold = sortedValues[Math.floor(count * 0.9)] || 0;
        const bottom10Threshold = sortedValues[Math.floor(count * 0.1)] || 0;
        
        // Create color array based on performance
        const backgroundColors = dailyValues.map(value => {
            if (value >= top10Threshold) {
                return 'rgba(34, 197, 94, 0.8)'; // Green for top 10%
            } else if (value <= bottom10Threshold) {
                return 'rgba(239, 68, 68, 0.8)'; // Red for bottom 10%
            } else {
                return 'rgba(234, 179, 8, 0.8)'; // Yellow for middle 80%
            }
        });
        
        // Destroy existing chart if it exists
        if (this.monthlyDailyPerformanceChartInstance) {
            this.monthlyDailyPerformanceChartInstance.destroy();
        }
        
        this.monthlyDailyPerformanceChartInstance = new Chart(this.monthlyDailyPerformanceChart, {
            type: 'bar',
            data: {
                labels: sortedDays,
                datasets: [{
                    label: 'Daily Sales',
                    data: dailyValues,
                    backgroundColor: backgroundColors,
                    borderColor: backgroundColors,
                    borderWidth: 1
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                let performance = '';
                                if (value >= top10Threshold) {
                                    performance = ' (Top 10%)';
                                } else if (value <= bottom10Threshold) {
                                    performance = ' (Bottom 10%)';
                                } else {
                                    performance = ' (Middle 80%)';
                                }
                                return `$${value.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}${performance}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    },
                    x: {
                        ticks: {
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    }
    
    populateMonthlyTopItems(monthData) {
        if (!this.monthlyTopItemsBody) return;
        
        // Sort items by price descending and take top 50
        const topItems = [...monthData.items]
            .sort((a, b) => b.price - a.price)
            .slice(0, 50);
        
        this.monthlyTopItemsBody.innerHTML = '';
        
        topItems.forEach((item, index) => {
            const row = document.createElement('tr');
            
            let titleHtml = item.title;
            if (item.itemNumber) {
                const ebayUrl = `https://www.ebay.com/itm/${item.itemNumber}`;
                titleHtml = `<a href="${ebayUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: none; font-weight: 500;">${item.title}</a>`;
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${titleHtml}</td>
                <td style="color: #059669; font-weight: 600;">$${item.price.toFixed(2)}</td>
                <td>${item.date}</td>
            `;
            
            this.monthlyTopItemsBody.appendChild(row);
        });
    }
    
    showWeekDetails(weekData) {
        if (!this.weeklyDetailView || !this.annualReviewMain) return;
        
        // Hide main view, show detail view
        this.annualReviewMain.style.display = 'none';
        this.weeklyDetailView.style.display = 'block';
        
        // Update title
        if (this.weeklyDetailTitle) {
            this.weeklyDetailTitle.textContent = `${weekData.weekLabel} - Detailed Analysis`;
        }
        
        // Update summary cards
        if (this.weeklyTotalSales) {
            this.weeklyTotalSales.textContent = `$${weekData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.weeklyItemsSold) {
            this.weeklyItemsSold.textContent = weekData.itemsSold;
        }
        
        // Calculate average daily sales (7 days in a week)
        const avgDaily = weekData.totalSales / 7;
        if (this.weeklyAvgDaily) {
            this.weeklyAvgDaily.textContent = `$${avgDaily.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        
        // Find best day
        const dailyTotals = {};
        weekData.items.forEach(item => {
            if (!dailyTotals[item.date]) {
                dailyTotals[item.date] = 0;
            }
            dailyTotals[item.date] += item.price;
        });
        
        let bestDay = { date: '-', total: 0 };
        Object.entries(dailyTotals).forEach(([date, total]) => {
            if (total > bestDay.total) {
                bestDay = { date, total };
            }
        });
        
        if (this.weeklyBestDay) {
            this.weeklyBestDay.textContent = `${bestDay.date} ($${bestDay.total.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})})`;
        }
        
        // Create daily sales chart
        this.createWeeklyDailyChart(weekData);
        
        // Populate all items for the week
        this.populateWeeklyItems(weekData);
    }
    
    createWeeklyDailyChart(weekData) {
        if (!this.weeklyDailyChart) return;
        
        // Group sales by day
        const dailyMap = {};
        
        weekData.items.forEach(item => {
            const date = item.date;
            if (!dailyMap[date]) {
                dailyMap[date] = 0;
            }
            dailyMap[date] += item.price;
        });
        
        // Sort by date
        const sortedDays = Object.keys(dailyMap).sort((a, b) => {
            const dateA = this.parseSoldDate(a);
            const dateB = this.parseSoldDate(b);
            return dateA - dateB;
        });
        
        const dailyValues = sortedDays.map(day => dailyMap[day]);
        
        // Destroy existing chart if it exists
        if (this.weeklyDailyChartInstance) {
            this.weeklyDailyChartInstance.destroy();
        }
        
        this.weeklyDailyChartInstance = new Chart(this.weeklyDailyChart, {
            type: 'line',
            data: {
                labels: sortedDays,
                datasets: [{
                    label: 'Daily Sales',
                    data: dailyValues,
                    borderColor: 'rgb(124, 58, 237)',
                    backgroundColor: 'rgba(124, 58, 237, 0.1)',
                    tension: 0.3,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `$${context.parsed.y.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: function(value) {
                                return '$' + value.toLocaleString();
                            }
                        }
                    }
                }
            }
        });
    }
    
    populateWeeklyItems(weekData) {
        if (!this.weeklyItemsBody) return;
        
        // Sort items by price descending
        const sortedItems = [...weekData.items]
            .sort((a, b) => b.price - a.price);
        
        this.weeklyItemsBody.innerHTML = '';
        
        sortedItems.forEach((item, index) => {
            const row = document.createElement('tr');
            
            let titleHtml = item.title;
            if (item.itemNumber) {
                const ebayUrl = `https://www.ebay.com/itm/${item.itemNumber}`;
                titleHtml = `<a href="${ebayUrl}" target="_blank" rel="noopener noreferrer" style="color: #7c3aed; text-decoration: none; font-weight: 500;">${item.title}</a>`;
            }
            
            row.innerHTML = `
                <td>${index + 1}</td>
                <td>${titleHtml}</td>
                <td style="color: #059669; font-weight: 600;">$${item.price.toFixed(2)}</td>
                <td>${item.date}</td>
            `;
            
            this.weeklyItemsBody.appendChild(row);
        });
    }
    
    showAnnualReviewMain() {
        if (!this.annualReviewMain || !this.monthlyDetailView || !this.weeklyDetailView) return;
        
        // Show main view, hide detail views
        this.annualReviewMain.style.display = 'block';
        this.monthlyDetailView.style.display = 'none';
        this.weeklyDetailView.style.display = 'none';
    }
    
    populateCurrentSnapshots() {
        // Get the current date
        const now = new Date();
        const currentYear = now.getFullYear();
        const currentMonth = now.getMonth();
        const currentMonthKey = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}`;
        
        // Helper to get week number
        const getWeekNumber = (date) => {
            const onejan = new Date(date.getFullYear(), 0, 1);
            const numberOfDays = Math.floor((date - onejan) / (24 * 60 * 60 * 1000));
            return Math.ceil((date.getDay() + 1 + numberOfDays) / 7);
        };
        
        const currentWeek = getWeekNumber(now);
        const currentWeekKey = `${currentYear}-W${String(currentWeek).padStart(2, '0')}`;
        
        // Update current date and days remaining
        const daysInMonth = new Date(currentYear, currentMonth + 1, 0).getDate();
        const currentDay = now.getDate();
        const daysRemaining = daysInMonth - currentDay;
        
        if (this.currentMonthDate) {
            this.currentMonthDate.textContent = now.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
        }
        
        if (this.daysRemainingText) {
            this.daysRemainingText.textContent = `${daysRemaining} day${daysRemaining !== 1 ? 's' : ''} remaining`;
        }
        
        // Find current month data
        const currentMonthData = this.monthlyData.find(m => m.monthKey === currentMonthKey);
        
        if (currentMonthData) {
            // Update total sales
            if (this.currentMonthSales) {
                this.currentMonthSales.textContent = `$${currentMonthData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            }
            
            // Calculate ranking (1 = best)
            const sortedMonths = [...this.monthlyData].sort((a, b) => b.totalSales - a.totalSales);
            const ranking = sortedMonths.findIndex(m => m.monthKey === currentMonthKey) + 1;
            const rankSuffix = ranking === 1 ? 'st' : ranking === 2 ? 'nd' : ranking === 3 ? 'rd' : 'th';
            
            if (this.currentMonthRanking) {
                this.currentMonthRanking.textContent = `Ranks ${ranking}${rankSuffix} of ${this.monthlyData.length} months`;
            }
            
            // Items sold
            if (this.currentMonthItemsSold) {
                this.currentMonthItemsSold.textContent = currentMonthData.itemsSold.toLocaleString();
            }
            
            if (this.currentMonthItemsSubtext) {
                const avgItemsPerDay = (currentMonthData.itemsSold / currentDay).toFixed(1);
                this.currentMonthItemsSubtext.textContent = `${avgItemsPerDay} items/day`;
            }
            
            // Calculate run rate (projected full month based on current progress)
            const runRate = (currentMonthData.totalSales / currentDay) * daysInMonth;
            
            if (this.currentMonthRunRate) {
                this.currentMonthRunRate.textContent = `$${runRate.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            }
            
            // Calculate run rate ranking
            if (this.runRateRanking) {
                const runRateRanking = sortedMonths.findIndex(m => m.totalSales <= runRate) + 1;
                if (runRateRanking > 0 && runRateRanking <= this.monthlyData.length) {
                    const runRateSuffix = runRateRanking === 1 ? 'st' : runRateRanking === 2 ? 'nd' : runRateRanking === 3 ? 'rd' : 'th';
                    this.runRateRanking.textContent = `Would rank ${runRateRanking}${runRateSuffix} if maintained`;
                } else {
                    this.runRateRanking.textContent = 'On pace for #1 month!';
                }
            }
            
            // Average sale price
            const avgPrice = currentMonthData.itemsSold > 0 ? currentMonthData.totalSales / currentMonthData.itemsSold : 0;
            if (this.currentMonthAvgPrice) {
                this.currentMonthAvgPrice.textContent = `$${avgPrice.toFixed(2)}`;
            }
            
            // Calculate average price ranking
            if (this.avgPriceRanking) {
                const monthsWithAvgPrices = this.monthlyData
                    .filter(m => m.itemsSold > 0)
                    .map(m => ({
                        ...m,
                        avgPrice: m.totalSales / m.itemsSold
                    }))
                    .sort((a, b) => b.avgPrice - a.avgPrice);
                
                const avgPriceRank = monthsWithAvgPrices.findIndex(m => m.monthKey === currentMonthKey) + 1;
                if (avgPriceRank > 0) {
                    const avgPriceSuffix = avgPriceRank === 1 ? 'st' : avgPriceRank === 2 ? 'nd' : avgPriceRank === 3 ? 'rd' : 'th';
                    this.avgPriceRanking.textContent = `Ranks ${avgPriceRank}${avgPriceSuffix} of ${monthsWithAvgPrices.length} months`;
                } else {
                    this.avgPriceRanking.textContent = '-';
                }
            }
        } else {
            // No data for current month
            if (this.currentMonthSales) this.currentMonthSales.textContent = '$0';
            if (this.currentMonthRanking) this.currentMonthRanking.textContent = 'No data yet';
            if (this.currentMonthItemsSold) this.currentMonthItemsSold.textContent = '0';
            if (this.currentMonthItemsSubtext) this.currentMonthItemsSubtext.textContent = '-';
            if (this.currentMonthRunRate) this.currentMonthRunRate.textContent = '$0';
            if (this.runRateRanking) this.runRateRanking.textContent = '-';
            if (this.currentMonthAvgPrice) this.currentMonthAvgPrice.textContent = '$0';
            if (this.avgPriceRanking) this.avgPriceRanking.textContent = '-';
        }
        
        // Find current week data
        const currentWeekData = this.weeklyData.find(w => w.weekKey === currentWeekKey);
        
        if (currentWeekData && this.currentWeekName) {
            // Update week name
            this.currentWeekName.textContent = currentWeekData.weekLabel;
            
            // Update total sales
            if (this.currentWeekSales) {
                this.currentWeekSales.textContent = `$${currentWeekData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            }
            
            // Calculate ranking (1 = best)
            const sortedWeeks = [...this.weeklyData].sort((a, b) => b.totalSales - a.totalSales);
            const weekRanking = sortedWeeks.findIndex(w => w.weekKey === currentWeekKey) + 1;
            const weekRankSuffix = weekRanking === 1 ? 'st' : weekRanking === 2 ? 'nd' : weekRanking === 3 ? 'rd' : 'th';
            
            if (this.currentWeekRanking) {
                this.currentWeekRanking.textContent = `${weekRanking}${weekRankSuffix} of ${this.weeklyData.length}`;
            }
            
            // Calculate run rate (projected full week based on current progress)
            const dayOfWeek = now.getDay();
            const daysElapsed = dayOfWeek === 0 ? 7 : dayOfWeek; // Sunday = 7
            const weekRunRate = (currentWeekData.totalSales / daysElapsed) * 7;
            
            if (this.currentWeekRunRate) {
                this.currentWeekRunRate.textContent = `$${weekRunRate.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
            }
            
            // Average sale price
            const weekAvgPrice = currentWeekData.itemsSold > 0 ? currentWeekData.totalSales / currentWeekData.itemsSold : 0;
            if (this.currentWeekAvgPrice) {
                this.currentWeekAvgPrice.textContent = `$${weekAvgPrice.toFixed(2)}`;
            }
        } else {
            // No data for current week
            if (this.currentWeekName) this.currentWeekName.textContent = `Week ${currentWeek}, ${currentYear}`;
            if (this.currentWeekSales) this.currentWeekSales.textContent = '$0';
            if (this.currentWeekRanking) this.currentWeekRanking.textContent = 'No data';
            if (this.currentWeekRunRate) this.currentWeekRunRate.textContent = '$0';
            if (this.currentWeekAvgPrice) this.currentWeekAvgPrice.textContent = '$0';
        }
    }
    
    populateStoreSnapshot() {
        // Calculate Sell Through Rate for trailing 30 days
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(now.getDate() - 30);
        
        // Count items sold in last 30 days
        let itemsSoldLast30Days = 0;
        if (this.soldData) {
            this.soldData.forEach(item => {
                const dateStr = item['Sale Date'] || item['Sold Date'] || '';
                if (!dateStr) return;
                
                const date = this.parseSoldDate(dateStr);
                if (date && date >= thirtyDaysAgo && date <= now) {
                    itemsSoldLast30Days++;
                }
            });
        }
        
        // Count items that were listed but didn't sell (from unsold report)
        // Only count items that have NOT been relisted
        let unsoldItemsLast30Days = 0;
        if (this.unsoldData && this.unsoldData.length > 0) {
            this.unsoldData.forEach(item => {
                // Only count if Relist Status = "Not Relisted"
                const relistStatus = item['Relist status'] || item['Relist Status'] || '';
                if (relistStatus.toLowerCase() !== 'not relisted') {
                    return; // Skip relisted items
                }
                
                // Check if item ended in the last 30 days
                const dateStr = item['End date'] || item['End Date'] || '';
                if (!dateStr) {
                    // If no end date, assume it was recently unsold
                    unsoldItemsLast30Days++;
                    return;
                }
                
                const date = this.parseSoldDate(dateStr);
                if (date && date >= thirtyDaysAgo && date <= now) {
                    unsoldItemsLast30Days++;
                }
            });
        }
        
        // Count current active inventory
        let currentActiveInventory = 0;
        const dataToCheck = this.inventoryData && this.inventoryData.length > 0 
            ? this.inventoryData 
            : this.storedInventoryData;
        
        if (dataToCheck && dataToCheck.length > 0) {
            currentActiveInventory = dataToCheck.filter(item => {
                const qty = parseInt(item['Available quantity'] || item['Quantity'] || item['Available'] || item['Qty'] || item['Available qua'] || '0');
                return qty > 0;
            }).length;
        }
        
        // Calculate 30-day sell through rate
        // Formula: (Items Sold) / (Items Sold + Unsold Not Relisted + Current Inventory) × 100
        const totalItems30Days = itemsSoldLast30Days + unsoldItemsLast30Days + currentActiveInventory;
        const sellThroughRate30Days = totalItems30Days > 0 ? (itemsSoldLast30Days / totalItems30Days) * 100 : 0;
        
        if (this.sellThroughRate30) {
            if (totalItems30Days === 0) {
                this.sellThroughRate30.textContent = 'No data';
            } else {
                const displayText = this.unsoldData && this.unsoldData.length > 0 
                    ? `${sellThroughRate30Days.toFixed(1)}% ✓` 
                    : `${sellThroughRate30Days.toFixed(1)}%*`;
                this.sellThroughRate30.textContent = displayText;
            }
        }
        
        // Calculate Average Sell Through Rate for previous 3 months
        const monthlySellThroughRates = [];
        
        for (let i = 1; i <= 3; i++) {
            const monthStart = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const monthEnd = new Date(now.getFullYear(), now.getMonth() - i + 1, 0);
            
            // Count items sold in this month
            let itemsSoldInMonth = 0;
            if (this.soldData) {
                this.soldData.forEach(item => {
                    const dateStr = item['Sale Date'] || item['Sold Date'] || '';
                    if (!dateStr) return;
                    
                    const date = this.parseSoldDate(dateStr);
                    if (date && date >= monthStart && date <= monthEnd) {
                        itemsSoldInMonth++;
                    }
                });
            }
            
            // Count unsold items from this month period (if unsold report available)
            // Only count items that were NOT relisted
            let unsoldItemsInMonth = 0;
            if (this.unsoldData && this.unsoldData.length > 0) {
                this.unsoldData.forEach(item => {
                    // Only count if Relist Status = "Not Relisted"
                    const relistStatus = item['Relist status'] || item['Relist Status'] || '';
                    if (relistStatus.toLowerCase() !== 'not relisted') {
                        return; // Skip relisted items
                    }
                    
                    // Check if item ended in this month period
                    const dateStr = item['End date'] || item['End Date'] || '';
                    if (!dateStr) {
                        unsoldItemsInMonth++;
                        return;
                    }
                    
                    const date = this.parseSoldDate(dateStr);
                    if (date && date >= monthStart && date <= monthEnd) {
                        unsoldItemsInMonth++;
                    }
                });
            }
            
            // Count current active inventory
            let activeInventoryForMonth = 0;
            const dataToCheck = this.inventoryData && this.inventoryData.length > 0 
                ? this.inventoryData 
                : this.storedInventoryData;
            
            if (dataToCheck && dataToCheck.length > 0) {
                activeInventoryForMonth = dataToCheck.filter(item => {
                    const qty = parseInt(item['Available quantity'] || item['Quantity'] || item['Available'] || item['Qty'] || item['Available qua'] || '0');
                    return qty > 0;
                }).length;
            }
            
            // Total = Sold + Unsold (not relisted) + Current Active Inventory
            const totalItemsInMonth = itemsSoldInMonth + unsoldItemsInMonth + activeInventoryForMonth;
            
            if (totalItemsInMonth > 0 && itemsSoldInMonth > 0) {
                const monthlyRate = (itemsSoldInMonth / totalItemsInMonth) * 100;
                monthlySellThroughRates.push(monthlyRate);
            }
        }
        
        // Calculate average
        const avgSellThroughRate = monthlySellThroughRates.length > 0
            ? monthlySellThroughRates.reduce((sum, rate) => sum + rate, 0) / monthlySellThroughRates.length
            : 0;
        
        if (this.avgSellThroughRate) {
            if (monthlySellThroughRates.length === 0) {
                this.avgSellThroughRate.textContent = 'No data';
            } else {
                const displayText = this.unsoldData && this.unsoldData.length > 0 
                    ? `${avgSellThroughRate.toFixed(1)}% ✓` 
                    : `${avgSellThroughRate.toFixed(1)}%*`;
                this.avgSellThroughRate.textContent = displayText;
            }
        }
    }
    
    // ============= SECRET ANALYSIS FUNCTIONS =============
    
    populateSecretAnalysis() {
        if (!this.soldData || this.soldData.length === 0) {
            if (this.daysOfWeekGrid) {
                this.daysOfWeekGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">No sales data available</p>';
            }
            if (this.keywordsContainer) {
                this.keywordsContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">No sales data available</p>';
            }
            if (this.stateMapWrapper) {
                this.stateMapWrapper.innerHTML = '<p style="text-align: center; color: #6b7280;">No sales data available</p>';
            }
            return;
        }
        
        // Calculate and display all secret analyses
        this.calculateDayOfWeekData();
        this.calculateKeywordData();
        this.calculateStateData();
        this.calculateRepeatCustomerData();
        this.calculateRetentionMetrics();
        
        this.populateDaysOfWeek();
        this.populateKeywords();
        this.populateStateAnalysis();
        this.populateRetentionDashboard();
        this.populateRepeatCustomerAnalysis();
        this.populateInsights();
    }
    
    calculateDayOfWeekData() {
        const dayMap = {
            0: 'Sunday',
            1: 'Monday',
            2: 'Tuesday',
            3: 'Wednesday',
            4: 'Thursday',
            5: 'Friday',
            6: 'Saturday'
        };
        
        const dayData = {};
        
        // Initialize all days
        for (let i = 0; i < 7; i++) {
            dayData[i] = {
                dayNum: i,
                dayName: dayMap[i],
                totalSales: 0,
                itemsSold: 0
            };
        }
        
        // Aggregate sales by day of week
        this.soldData.forEach(item => {
            const dateStr = item['Sale Date'] || item['Sold Date'] || '';
            if (!dateStr) return;
            
            const date = this.parseSoldDate(dateStr);
            if (!date) return;
            
            const dayOfWeek = date.getDay();
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            
            dayData[dayOfWeek].totalSales += price;
            dayData[dayOfWeek].itemsSold++;
        });
        
        // Calculate averages
        Object.values(dayData).forEach(day => {
            day.avgPerItem = day.itemsSold > 0 ? day.totalSales / day.itemsSold : 0;
        });
        
        this.dayOfWeekData = Object.values(dayData);
    }
    
    populateDaysOfWeek() {
        if (!this.daysOfWeekGrid) return;
        
        if (this.dayOfWeekData.length === 0) {
            this.daysOfWeekGrid.innerHTML = '<p style="text-align: center; color: #6b7280;">No day-of-week data available</p>';
            return;
        }
        
        // Find min/max for color coding
        const salesValues = this.dayOfWeekData.map(d => d.totalSales);
        const minSales = Math.min(...salesValues);
        const maxSales = Math.max(...salesValues);
        
        // Helper to get color based on sales amount
        const getColorForSales = (sales) => {
            if (maxSales === minSales) {
                return 'rgb(34, 197, 94)'; // Green if all same
            }
            
            const ratio = (sales - minSales) / (maxSales - minSales);
            
            // Color gradient from red (low) to yellow to green (high)
            if (ratio < 0.5) {
                // Red to Yellow
                const r = 239;
                const g = Math.round(68 + (234 - 68) * (ratio * 2));
                const b = 68;
                return `rgb(${r}, ${g}, ${b})`;
            } else {
                // Yellow to Green
                const r = Math.round(234 - (234 - 34) * ((ratio - 0.5) * 2));
                const g = Math.round(179 + (197 - 179) * ((ratio - 0.5) * 2));
                const b = Math.round(8 + (94 - 8) * ((ratio - 0.5) * 2));
                return `rgb(${r}, ${g}, ${b})`;
            }
        };
        
        this.daysOfWeekGrid.innerHTML = '';
        
        // Order days starting with Monday
        const orderedDays = [
            this.dayOfWeekData[1], // Monday
            this.dayOfWeekData[2], // Tuesday
            this.dayOfWeekData[3], // Wednesday
            this.dayOfWeekData[4], // Thursday
            this.dayOfWeekData[5], // Friday
            this.dayOfWeekData[6], // Saturday
            this.dayOfWeekData[0]  // Sunday
        ];
        
        orderedDays.forEach(dayData => {
            const dayBox = document.createElement('div');
            dayBox.className = 'day-box';
            dayBox.style.background = getColorForSales(dayData.totalSales);
            dayBox.innerHTML = `
                <div class="day-name">${dayData.dayName}</div>
                <div class="day-total">$${dayData.totalSales.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                <div class="day-avg">${dayData.itemsSold} items</div>
                <div class="day-avg">Avg: $${dayData.avgPerItem.toFixed(2)}/item</div>
            `;
            
            this.daysOfWeekGrid.appendChild(dayBox);
        });
    }
    
    calculateKeywordData() {
        // Common words to exclude
        const stopWords = new Set([
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'up', 'about', 'into', 'through', 'new',
            'used', 'lot', 'set', 'pack', 'box', 'item', 'items', 'sale', 'free',
            'shipping', 'fast', 'brand', 'new', 'condition', 'good', 'great',
            'nice', 'rare', 'vintage', 'authentic', 'original', 'sealed', 'mint'
        ]);
        
        const keywordMap = {};
        
        this.soldData.forEach(item => {
            const title = (item['Item Title'] || item['Title'] || '').toLowerCase();
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            
            // Split title into words and clean them
            const words = title.split(/\s+/).map(w => w.replace(/[^a-z0-9]/g, '')).filter(w => w.length > 2);
            
            words.forEach(word => {
                if (stopWords.has(word)) return;
                
                if (!keywordMap[word]) {
                    keywordMap[word] = {
                        keyword: word,
                        totalRevenue: 0,
                        count: 0
                    };
                }
                
                keywordMap[word].totalRevenue += price;
                keywordMap[word].count++;
            });
        });
        
        // Sort by revenue and take top 20
        this.keywordData = Object.values(keywordMap)
            .sort((a, b) => b.totalRevenue - a.totalRevenue)
            .slice(0, 20);
    }
    
    populateKeywords() {
        if (!this.keywordsContainer) return;
        
        if (this.keywordData.length === 0) {
            this.keywordsContainer.innerHTML = '<p style="text-align: center; color: #6b7280;">No keyword data available</p>';
            return;
        }
        
        this.keywordsContainer.innerHTML = '';
        
        // Calculate sizes based on revenue
        const maxRevenue = this.keywordData[0].totalRevenue;
        
        this.keywordData.forEach((keyword, index) => {
            const keywordBox = document.createElement('div');
            keywordBox.className = 'keyword-box';
            
            // Vary opacity based on ranking
            const opacity = 1 - (index / this.keywordData.length) * 0.3;
            keywordBox.style.opacity = opacity;
            
            keywordBox.innerHTML = `
                <div class="keyword-text">#${index + 1} ${keyword.keyword}</div>
                <div class="keyword-revenue">$${keyword.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
                <div class="keyword-count">${keyword.count} listings</div>
            `;
            
            this.keywordsContainer.appendChild(keywordBox);
        });
    }
    
    calculateStateData() {
        // Note: eBay CSV exports often include buyer location in the "Buyer State" or similar field
        // We'll check for common field names
        const stateMap = {};
        
        this.soldData.forEach(item => {
            // Try to find state from various possible field names
            const state = item['Buyer State'] || 
                         item['Ship To State'] || 
                         item['State'] || 
                         item['Buyer Location'] ||
                         '';
            
            if (!state || state.length > 2) return; // Skip if not a 2-letter state code
            
            const stateCode = state.toUpperCase();
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            
            if (!stateMap[stateCode]) {
                stateMap[stateCode] = {
                    state: stateCode,
                    totalRevenue: 0,
                    itemsSold: 0
                };
            }
            
            stateMap[stateCode].totalRevenue += price;
            stateMap[stateCode].itemsSold++;
        });
        
        // Sort by revenue
        this.stateData = Object.values(stateMap)
            .sort((a, b) => b.totalRevenue - a.totalRevenue);
    }
    
    populateStateAnalysis() {
        if (!this.stateRankings) return;
        
        if (this.stateData.length === 0) {
            // Show message if no state data
            if (this.usaMap) {
                this.usaMap.innerHTML = `
                    <text x="480" y="300" text-anchor="middle" style="font-size: 18px; fill: #6b7280;">
                        No state data available
                    </text>
                `;
            }
            this.stateRankings.innerHTML = '<p style="text-align: center; color: #6b7280;">No data</p>';
            return;
        }
        
        // Populate top 10 states ranking
        const top10States = this.stateData.slice(0, 10);
        
        this.stateRankings.innerHTML = '';
        
        top10States.forEach((stateInfo, index) => {
            const rankItem = document.createElement('div');
            rankItem.className = 'state-rank-item';
            
            // Vary border color for top 3
            if (index === 0) {
                rankItem.style.borderLeftColor = '#eab308'; // Gold
            } else if (index === 1) {
                rankItem.style.borderLeftColor = '#94a3b8'; // Silver
            } else if (index === 2) {
                rankItem.style.borderLeftColor = '#cd7f32'; // Bronze
            }
            
            rankItem.innerHTML = `
                <div>
                    <span class="state-name">#${index + 1} ${stateInfo.state}</span>
                    <div style="font-size: 0.75rem; color: #6b7280;">${stateInfo.itemsSold} items</div>
                </div>
                <div class="state-revenue">$${stateInfo.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</div>
            `;
            
            this.stateRankings.appendChild(rankItem);
        });
        
        // Create color-coded USA map
        this.createUSAMap();
    }
    
    createUSAMap() {
        if (!this.usaMap) return;
        
        // Find max revenue for color coding
        const maxRevenue = this.stateData[0]?.totalRevenue || 1;
        const minRevenue = this.stateData[this.stateData.length - 1]?.totalRevenue || 0;
        
        // Create a map of state data for quick lookup
        const stateDataMap = {};
        this.stateData.forEach((s, index) => {
            stateDataMap[s.state] = {
                revenue: s.totalRevenue,
                orders: s.itemsSold,
                rank: index + 1
            };
        });
        
        // Helper function to get color based on revenue
        const getStateColor = (state) => {
            const stateInfo = stateDataMap[state];
            if (!stateInfo) return '#e5e7eb'; // No data - gray
            
            const ratio = (stateInfo.revenue - minRevenue) / (maxRevenue - minRevenue || 1);
            
            // Color gradient from red (low) to yellow (mid) to green (high)
            if (ratio > 0.8) return '#22c55e'; // Dark green - highest
            if (ratio > 0.6) return '#4ade80'; // Green
            if (ratio > 0.4) return '#fbbf24'; // Yellow - middle
            if (ratio > 0.2) return '#fb923c'; // Orange
            return '#ef4444'; // Red - lowest
        };
        
        // Simplified US state positions for visualization
        // Using a grid-based representation
        const stateGrid = {
            'WA': {x: 50, y: 50}, 'OR': {x: 50, y: 120}, 'CA': {x: 50, y: 190},
            'MT': {x: 150, y: 50}, 'ID': {x: 150, y: 120}, 'NV': {x: 150, y: 190}, 'AZ': {x: 150, y: 260},
            'WY': {x: 230, y: 120}, 'UT': {x: 230, y: 190}, 'CO': {x: 310, y: 190}, 'NM': {x: 310, y: 260},
            'ND': {x: 310, y: 50}, 'SD': {x: 390, y: 50}, 'NE': {x: 390, y: 120}, 'KS': {x: 390, y: 190},
            'OK': {x: 390, y: 260}, 'TX': {x: 390, y: 330},
            'MN': {x: 470, y: 50}, 'IA': {x: 470, y: 120}, 'MO': {x: 470, y: 190}, 'AR': {x: 470, y: 260}, 'LA': {x: 470, y: 330},
            'WI': {x: 550, y: 50}, 'IL': {x: 550, y: 120}, 'TN': {x: 630, y: 190}, 'MS': {x: 550, y: 260}, 'AL': {x: 630, y: 260},
            'MI': {x: 630, y: 50}, 'IN': {x: 630, y: 120}, 'KY': {x: 630, y: 160}, 'GA': {x: 710, y: 260}, 'FL': {x: 710, y: 330},
            'OH': {x: 710, y: 120}, 'WV': {x: 710, y: 160}, 'VA': {x: 790, y: 160}, 'NC': {x: 790, y: 220}, 'SC': {x: 790, y: 260},
            'PA': {x: 790, y: 120}, 'NY': {x: 790, y: 80}, 'MD': {x: 870, y: 160}, 'DE': {x: 870, y: 140}, 'NJ': {x: 870, y: 120},
            'CT': {x: 870, y: 100}, 'RI': {x: 870, y: 80}, 'MA': {x: 870, y: 60}, 'VT': {x: 850, y: 40}, 'NH': {x: 870, y: 40}, 'ME': {x: 890, y: 20},
            'AK': {x: 50, y: 400}, 'HI': {x: 230, y: 450}
        };
        
        // Clear and build SVG map
        this.usaMap.innerHTML = '';
        
        // Create tooltip div that will follow cursor
        let tooltip = document.getElementById('stateMapTooltip');
        if (!tooltip) {
            tooltip = document.createElement('div');
            tooltip.id = 'stateMapTooltip';
            tooltip.className = 'state-map-tooltip';
            tooltip.style.display = 'none';
            document.body.appendChild(tooltip);
        }
        
        Object.entries(stateGrid).forEach(([state, pos]) => {
            const color = getStateColor(state);
            const stateInfo = stateDataMap[state];
            
            // Create state rectangle
            const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
            rect.setAttribute('x', pos.x);
            rect.setAttribute('y', pos.y);
            rect.setAttribute('width', '60');
            rect.setAttribute('height', '50');
            rect.setAttribute('fill', color);
            rect.setAttribute('stroke', '#ffffff');
            rect.setAttribute('stroke-width', '2');
            rect.setAttribute('rx', '4');
            rect.style.cursor = 'pointer';
            rect.style.transition = 'all 0.2s ease';
            
            // Add hover effect with enhanced tooltip
            rect.addEventListener('mouseenter', (e) => {
                rect.setAttribute('stroke', '#667eea');
                rect.setAttribute('stroke-width', '3');
                rect.style.filter = 'brightness(0.9)';
                
                // Show detailed tooltip
                if (stateInfo) {
                    tooltip.innerHTML = `
                        <div style="font-weight: 700; font-size: 1rem; margin-bottom: 0.5rem; color: #1f2937;">${state}</div>
                        <div style="font-size: 0.875rem; color: #6b7280; margin-bottom: 0.25rem;">
                            <strong>Rank:</strong> #${stateInfo.rank} of ${this.stateData.length}
                        </div>
                        <div style="font-size: 0.875rem; color: #059669; font-weight: 600; margin-bottom: 0.25rem;">
                            <strong>Total Revenue:</strong> $${stateInfo.revenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}
                        </div>
                        <div style="font-size: 0.875rem; color: #6b7280;">
                            <strong># of Orders:</strong> ${stateInfo.orders}
                        </div>
                    `;
                } else {
                    tooltip.innerHTML = `
                        <div style="font-weight: 700; font-size: 1rem; color: #1f2937;">${state}</div>
                        <div style="font-size: 0.875rem; color: #6b7280; margin-top: 0.25rem;">No sales data</div>
                    `;
                }
                tooltip.style.display = 'block';
            });
            
            rect.addEventListener('mousemove', (e) => {
                // Position tooltip near cursor
                tooltip.style.left = (e.pageX + 15) + 'px';
                tooltip.style.top = (e.pageY + 15) + 'px';
            });
            
            rect.addEventListener('mouseleave', (e) => {
                rect.setAttribute('stroke', '#ffffff');
                rect.setAttribute('stroke-width', '2');
                rect.style.filter = 'none';
                tooltip.style.display = 'none';
            });
            
            this.usaMap.appendChild(rect);
            
            // Add state abbreviation text
            const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            text.setAttribute('x', pos.x + 30);
            text.setAttribute('y', pos.y + 30);
            text.setAttribute('text-anchor', 'middle');
            text.setAttribute('dominant-baseline', 'middle');
            text.style.fontSize = '11px';
            text.style.fontWeight = '700';
            text.style.fill = stateInfo && getStateColor(state) !== '#e5e7eb' ? '#ffffff' : '#6b7280';
            text.style.pointerEvents = 'none';
            text.textContent = state;
            
            this.usaMap.appendChild(text);
        });
    }
    
    populateInsights() {
        if (!this.insightsGrid) return;
        
        this.insightsGrid.innerHTML = '';
        
        const insights = [];
        
        // 1. Best Days to End Listings
        if (this.dayOfWeekData && this.dayOfWeekData.length > 0) {
            const sortedDays = [...this.dayOfWeekData].sort((a, b) => b.totalSales - a.totalSales);
            const topDays = sortedDays.slice(0, 3);
            const dayNames = topDays.map(d => d.dayName).join(', ');
            const topRevenue = topDays[0].totalSales;
            
            insights.push({
                icon: '📅',
                title: 'Best Days for Sales',
                text: `Your top selling days are <strong>${dayNames}</strong>, with ${topDays[0].dayName} generating <strong>$${topRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong> in total revenue.`,
                recommendation: `💡 Schedule your auction-style listings to end on ${topDays[0].dayName} or ${topDays[1]?.dayName || 'your other top days'} for maximum visibility and bidding activity.`
            });
        }
        
        // 2. Top Keywords
        if (this.keywordData && this.keywordData.length > 0) {
            const topKeywords = this.keywordData.slice(0, 5);
            const keywordList = topKeywords.map((k, i) => `<strong>${k.keyword}</strong> ($${k.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})})`).join(', ');
            
            insights.push({
                icon: '🔤',
                title: 'Power Keywords',
                text: `Your top revenue-generating keywords are: ${keywordList}. These words appear in your most successful listings.`,
                recommendation: `💡 Feature these keywords prominently in your titles and descriptions. Items with "${topKeywords[0].keyword}" in the title have generated the most revenue.`
            });
        }
        
        // 3. Geographic Insights
        if (this.stateData && this.stateData.length > 0) {
            const topStates = this.stateData.slice(0, 5);
            const stateList = topStates.map(s => `<strong>${s.state}</strong> ($${s.totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})})`).join(', ');
            const topStateRevenue = topStates[0].totalRevenue;
            const totalRevenue = this.stateData.reduce((sum, s) => sum + s.totalRevenue, 0);
            const topStatePercent = ((topStateRevenue / totalRevenue) * 100).toFixed(1);
            
            insights.push({
                icon: '🗺️',
                title: 'Top Markets',
                text: `Your biggest markets are: ${stateList}. ${topStates[0].state} alone represents <strong>${topStatePercent}%</strong> of your revenue.`,
                recommendation: `💡 Consider offering free shipping or special promotions for customers in ${topStates[0].state} and ${topStates[1]?.state || 'your top states'} to increase loyalty and repeat business.`
            });
        }
        
        // 4. Pricing Insights
        if (this.dayOfWeekData && this.dayOfWeekData.length > 0) {
            const avgPrices = this.dayOfWeekData.map(d => ({
                day: d.dayName,
                avg: d.avgPerItem
            })).sort((a, b) => b.avg - a.avg);
            
            const highestAvgDay = avgPrices[0];
            
            insights.push({
                icon: '💰',
                title: 'Best Average Sale Price',
                text: `Items selling on <strong>${highestAvgDay.day}</strong> have the highest average price at <strong>$${highestAvgDay.avg.toFixed(2)}</strong> per item, suggesting buyers are more willing to spend on this day.`,
                recommendation: `💡 List your premium or higher-value items to end on ${highestAvgDay.day} when buyers appear most willing to pay top dollar.`
            });
        }
        
        // 5. Overall Performance Summary
        if (this.soldData && this.soldData.length > 0) {
            const totalRevenue = this.soldData.reduce((sum, item) => {
                const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
                return sum + price;
            }, 0);
            const avgSalePrice = totalRevenue / this.soldData.length;
            
            insights.push({
                icon: '📊',
                title: 'Performance Summary',
                text: `You've sold <strong>${this.soldData.length} items</strong> for a total of <strong>$${totalRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong>, with an average sale price of <strong>$${avgSalePrice.toFixed(2)}</strong>.`,
                recommendation: `💡 Focus on scaling what's working: list more items with your top keywords, target your best-performing states, and schedule listings to end on your peak days.`
            });
        }
        
        // Render insight cards
        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'insight-card';
            card.innerHTML = `
                <span class="insight-icon">${insight.icon}</span>
                <div class="insight-title">${insight.title}</div>
                <div class="insight-text">${insight.text}</div>
                ${insight.recommendation ? `<div class="insight-recommendation">${insight.recommendation}</div>` : ''}
            `;
            this.insightsGrid.appendChild(card);
        });
    }

    // ============= CUSTOMER RETENTION DASHBOARD FUNCTIONS =============
    
    calculateRetentionMetrics() {
        if (!this.soldData || this.soldData.length === 0 || !this.repeatCustomerData) {
            this.retentionData = null;
            return;
        }
        
        const data = this.repeatCustomerData;
        
        // Calculate CLV metrics
        const avgCLV = data.totalRevenue / data.totalCustomers;
        const repeatCLV = data.repeatRevenue / data.repeatCustomerCount;
        const oneTimeCLV = (data.totalRevenue - data.repeatRevenue) / data.oneTimeCustomerCount;
        
        // Project annual CLV based on current trends
        // Assume average purchase frequency and growth
        const avgPurchaseFrequency = data.repeatOrders / data.repeatCustomerCount;
        const projectedCLV = avgCLV * (1 + (avgPurchaseFrequency * 0.3)); // 30% growth factor
        
        // Calculate business value scenarios
        const monthlyRevenue = data.totalRevenue / 12; // Simplified annual projection
        const annualRevenue = data.totalRevenue;
        
        // Current business model (with repeats)
        const currentBusinessValue = annualRevenue;
        const currentNewCustomerRevenue = data.totalRevenue - data.repeatRevenue;
        const currentRepeatCustomerRevenue = data.repeatRevenue;
        
        // Without repeats scenario
        const noRepeatBusinessValue = currentNewCustomerRevenue;
        const lostRevenue = data.repeatRevenue;
        
        // 50% retention loss scenario
        const reducedBusinessValue = currentNewCustomerRevenue + (data.repeatRevenue * 0.5);
        const reducedRepeatRevenue = data.repeatRevenue * 0.5;
        
        // Calculate retention rates
        const repeatPurchaseRate = (data.repeatCustomerCount / data.totalCustomers) * 100;
        
        // Monthly retention (customers who came back within 30 days)
        let monthlyReturns = 0;
        let monthlyOpportunities = 0;
        
        data.repeatBuyers.forEach(buyer => {
            for (let i = 0; i < buyer.orders.length - 1; i++) {
                const daysDiff = this.daysBetween(buyer.orders[i].date, buyer.orders[i + 1].date);
                monthlyOpportunities++;
                if (daysDiff <= 30) {
                    monthlyReturns++;
                }
            }
        });
        
        const monthlyRetention = monthlyOpportunities > 0 ? (monthlyReturns / monthlyOpportunities) * 100 : 0;
        
        // Quarterly retention (customers who came back within 90 days)
        let quarterlyReturns = 0;
        let quarterlyOpportunities = 0;
        
        data.repeatBuyers.forEach(buyer => {
            for (let i = 0; i < buyer.orders.length - 1; i++) {
                const daysDiff = this.daysBetween(buyer.orders[i].date, buyer.orders[i + 1].date);
                quarterlyOpportunities++;
                if (daysDiff <= 90) {
                    quarterlyReturns++;
                }
            }
        });
        
        const quarterlyRetention = quarterlyOpportunities > 0 ? (quarterlyReturns / quarterlyOpportunities) * 100 : 0;
        
        // Store all retention metrics
        this.retentionData = {
            avgCLV,
            repeatCLV,
            oneTimeCLV,
            projectedCLV,
            currentBusinessValue,
            currentNewCustomerRevenue,
            currentRepeatCustomerRevenue,
            noRepeatBusinessValue,
            noRepeatRevenue: currentNewCustomerRevenue,
            lostRevenue,
            reducedBusinessValue,
            reducedNewRevenue: currentNewCustomerRevenue,
            reducedRepeatRevenue,
            monthlyRetention,
            monthlyReturns,
            monthlyOpportunities,
            quarterlyRetention,
            quarterlyReturns,
            quarterlyOpportunities,
            repeatPurchaseRate
        };
    }
    
    populateRetentionDashboard() {
        if (!this.retentionData) {
            return;
        }
        
        const data = this.retentionData;
        
        // Populate business value scenarios
        if (this.currentBusinessValue) {
            this.currentBusinessValue.textContent = `$${data.currentBusinessValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.currentNewCustomerRevenue) {
            this.currentNewCustomerRevenue.textContent = `$${data.currentNewCustomerRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.currentRepeatCustomerRevenue) {
            this.currentRepeatCustomerRevenue.textContent = `$${data.currentRepeatCustomerRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        
        if (this.noRepeatBusinessValue) {
            this.noRepeatBusinessValue.textContent = `$${data.noRepeatBusinessValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.noRepeatRevenue) {
            this.noRepeatRevenue.textContent = `$${data.noRepeatRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.lostRevenue) {
            this.lostRevenue.textContent = `-$${data.lostRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        
        if (this.reducedBusinessValue) {
            this.reducedBusinessValue.textContent = `$${data.reducedBusinessValue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.reducedNewRevenue) {
            this.reducedNewRevenue.textContent = `$${data.reducedNewRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.reducedRepeatRevenue) {
            this.reducedRepeatRevenue.textContent = `$${data.reducedRepeatRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        
        // Add retention value insight
        if (this.retentionValueInsight) {
            const percentOfTotal = ((data.lostRevenue / data.currentBusinessValue) * 100).toFixed(1);
            const insightText = `🚨 Customer retention represents <strong>${percentOfTotal}%</strong> of your total business value. Losing even half of your repeat customers would cost you <strong>$${(data.lostRevenue / 2).toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}</strong> annually!`;
            this.retentionValueInsight.innerHTML = insightText;
        }
        
        // Populate CLV metrics
        if (this.avgCLV) {
            this.avgCLV.textContent = `$${data.avgCLV.toFixed(2)}`;
        }
        if (this.repeatCLV) {
            this.repeatCLV.textContent = `$${data.repeatCLV.toFixed(2)}`;
        }
        if (this.oneTimeCLV) {
            this.oneTimeCLV.textContent = `$${data.oneTimeCLV.toFixed(2)}`;
        }
        if (this.projectedCLV) {
            this.projectedCLV.textContent = `$${data.projectedCLV.toFixed(2)}`;
        }
        
        // Populate retention rates
        if (this.monthlyRetention) {
            this.monthlyRetention.textContent = `${data.monthlyRetention.toFixed(1)}%`;
        }
        if (this.monthlyRetentionDetail) {
            this.monthlyRetentionDetail.textContent = `${data.monthlyReturns} of ${data.monthlyOpportunities} returned within 30 days`;
        }
        
        if (this.quarterlyRetention) {
            this.quarterlyRetention.textContent = `${data.quarterlyRetention.toFixed(1)}%`;
        }
        if (this.quarterlyRetentionDetail) {
            this.quarterlyRetentionDetail.textContent = `${data.quarterlyReturns} of ${data.quarterlyOpportunities} returned within 90 days`;
        }
        
        if (this.repeatPurchaseRate) {
            this.repeatPurchaseRate.textContent = `${data.repeatPurchaseRate.toFixed(1)}%`;
        }
        if (this.repeatPurchaseDetail) {
            this.repeatPurchaseDetail.textContent = `${this.repeatCustomerData.repeatCustomerCount} of ${this.repeatCustomerData.totalCustomers} customers`;
        }
    }
    
    // ============= REPEAT CUSTOMER ANALYSIS FUNCTIONS =============
    
    calculateRepeatCustomerData() {
        if (!this.soldData || this.soldData.length === 0) {
            this.repeatCustomerData = null;
            return;
        }
        
        // Group sales by buyer username
        const buyerMap = new Map();
        
        this.soldData.forEach(item => {
            const buyer = item['Buyer Username'] || item['Buyer'] || 'Unknown';
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            const dateStr = item['Sale Date'] || item['Sold Date'] || '';
            const date = this.parseSoldDate(dateStr);
            
            if (!buyerMap.has(buyer)) {
                buyerMap.set(buyer, {
                    buyer: buyer,
                    orders: [],
                    totalSpent: 0,
                    orderCount: 0
                });
            }
            
            const buyerData = buyerMap.get(buyer);
            buyerData.orders.push({
                price: price,
                date: date,
                dateStr: dateStr,
                title: item['Item Title'] || item['Title'] || 'Unknown'
            });
            buyerData.totalSpent += price;
            buyerData.orderCount++;
        });
        
        // Sort orders by date for each buyer
        buyerMap.forEach(buyerData => {
            buyerData.orders.sort((a, b) => a.date - b.date);
        });
        
        // Separate repeat vs one-time buyers
        const repeatBuyers = Array.from(buyerMap.values()).filter(b => b.orderCount >= 2);
        const oneTimeBuyers = Array.from(buyerMap.values()).filter(b => b.orderCount === 1);
        
        // Calculate metrics
        const totalCustomers = buyerMap.size;
        const repeatCustomerCount = repeatBuyers.length;
        const repeatCustomerPercent = (repeatCustomerCount / totalCustomers) * 100;
        
        const totalRevenue = this.soldData.reduce((sum, item) => {
            const price = parseFloat((item['Sold Price'] || item['Sold For'] || '0').replace(/[$,]/g, '')) || 0;
            return sum + price;
        }, 0);
        
        const repeatRevenue = repeatBuyers.reduce((sum, b) => sum + b.totalSpent, 0);
        const repeatRevenuePercent = (repeatRevenue / totalRevenue) * 100;
        
        const repeatOrders = repeatBuyers.reduce((sum, b) => sum + b.orderCount, 0);
        const totalOrders = this.soldData.length;
        const repeatOrdersPercent = (repeatOrders / totalOrders) * 100;
        
        const avgOrderValueRepeat = repeatOrders > 0 ? repeatRevenue / repeatOrders : 0;
        const singleOrders = oneTimeBuyers.reduce((sum, b) => sum + b.orderCount, 0);
        const singleRevenue = oneTimeBuyers.reduce((sum, b) => sum + b.totalSpent, 0);
        const avgOrderValueSingle = singleOrders > 0 ? singleRevenue / singleOrders : 0;
        
        // Calculate days between orders
        const timeBetweenOrders = {
            '1to2': [],
            '2to3': [],
            '3to4': []
        };
        
        repeatBuyers.forEach(buyer => {
            if (buyer.orders.length >= 2) {
                const days = this.daysBetween(buyer.orders[0].date, buyer.orders[1].date);
                if (days >= 0) timeBetweenOrders['1to2'].push(days);
            }
            if (buyer.orders.length >= 3) {
                const days = this.daysBetween(buyer.orders[1].date, buyer.orders[2].date);
                if (days >= 0) timeBetweenOrders['2to3'].push(days);
            }
            if (buyer.orders.length >= 4) {
                const days = this.daysBetween(buyer.orders[2].date, buyer.orders[3].date);
                if (days >= 0) timeBetweenOrders['3to4'].push(days);
            }
        });
        
        const avg1to2 = timeBetweenOrders['1to2'].length > 0
            ? timeBetweenOrders['1to2'].reduce((sum, d) => sum + d, 0) / timeBetweenOrders['1to2'].length
            : 0;
        const avg2to3 = timeBetweenOrders['2to3'].length > 0
            ? timeBetweenOrders['2to3'].reduce((sum, d) => sum + d, 0) / timeBetweenOrders['2to3'].length
            : 0;
        const avg3to4 = timeBetweenOrders['3to4'].length > 0
            ? timeBetweenOrders['3to4'].reduce((sum, d) => sum + d, 0) / timeBetweenOrders['3to4'].length
            : 0;
        
        // Calculate loyalty distribution
        const loyaltyDistribution = {
            '2 orders': repeatBuyers.filter(b => b.orderCount === 2).length,
            '3 orders': repeatBuyers.filter(b => b.orderCount === 3).length,
            '4 orders': repeatBuyers.filter(b => b.orderCount === 4).length,
            '5 orders': repeatBuyers.filter(b => b.orderCount === 5).length,
            '6+ orders': repeatBuyers.filter(b => b.orderCount >= 6).length
        };
        
        // Sort repeat buyers by total spent
        const topRepeatCustomers = [...repeatBuyers]
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 20);
        
        this.repeatCustomerData = {
            totalCustomers,
            repeatCustomerCount,
            repeatCustomerPercent,
            oneTimeCustomerCount: oneTimeBuyers.length,
            totalRevenue,
            repeatRevenue,
            repeatRevenuePercent,
            totalOrders,
            repeatOrders,
            repeatOrdersPercent,
            avgOrderValueRepeat,
            avgOrderValueSingle,
            repeatBuyerOrderCount: repeatOrders,
            singleBuyerOrderCount: singleOrders,
            avg1to2,
            avg2to3,
            avg3to4,
            loyaltyDistribution,
            topRepeatCustomers,
            repeatBuyers,
            oneTimeBuyers
        };
    }
    
    daysBetween(date1, date2) {
        if (!date1 || !date2) return -1;
        const diffTime = Math.abs(date2 - date1);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    }
    
    populateRepeatCustomerAnalysis() {
        if (!this.repeatCustomerData) {
            return;
        }
        
        const data = this.repeatCustomerData;
        
        // Update overview metrics
        if (this.repeatCustomerCount) {
            this.repeatCustomerCount.textContent = data.repeatCustomerCount.toLocaleString();
        }
        if (this.repeatCustomerPercent) {
            this.repeatCustomerPercent.textContent = `${data.repeatCustomerPercent.toFixed(1)}% of customers`;
        }
        
        if (this.repeatCustomerRevenue) {
            this.repeatCustomerRevenue.textContent = `$${data.repeatRevenue.toLocaleString(undefined, {minimumFractionDigits: 0, maximumFractionDigits: 0})}`;
        }
        if (this.repeatRevenuePercent) {
            this.repeatRevenuePercent.textContent = `${data.repeatRevenuePercent.toFixed(1)}% of total revenue`;
        }
        
        if (this.repeatCustomerOrders) {
            this.repeatCustomerOrders.textContent = data.repeatOrders.toLocaleString();
        }
        if (this.repeatOrdersPercent) {
            this.repeatOrdersPercent.textContent = `${data.repeatOrdersPercent.toFixed(1)}% of total orders`;
        }
        
        // Update CLV comparison
        const repeatCLV = data.repeatRevenue / data.repeatCustomerCount;
        const oneTimeCLV = data.avgOrderValueSingle; // One-time customers only have one purchase
        
        if (this.repeatCustomerCLV) {
            this.repeatCustomerCLV.textContent = `$${repeatCLV.toFixed(2)}`;
        }
        if (this.oneTimeCustomerValue) {
            this.oneTimeCustomerValue.textContent = `$${oneTimeCLV.toFixed(2)}`;
        }
        if (this.repeatCustomerCount2) {
            this.repeatCustomerCount2.textContent = `${data.repeatCustomerCount} customers`;
        }
        if (this.oneTimeCustomerCount2) {
            this.oneTimeCustomerCount2.textContent = `${data.oneTimeCustomerCount} customers`;
        }
        
        // Add comparison insight
        if (this.orderValueInsight) {
            const diff = repeatCLV - oneTimeCLV;
            const diffPercent = ((diff / oneTimeCLV) * 100).toFixed(1);
            let insightText = '';
            
            if (diff > 0) {
                insightText = `💡 The average repeat customer generates <strong>${diffPercent}% more</strong> lifetime value than a one-time buyer! Each repeat customer is worth an additional <strong>$${diff.toFixed(2)}</strong>.`;
            } else if (diff < 0) {
                insightText = `💡 Focus on converting more customers to repeat buyers to increase lifetime value.`;
            } else {
                insightText = `💡 Lifetime values are similar between repeat and one-time customers.`;
            }
            
            this.orderValueInsight.innerHTML = insightText;
        }
        
        // Update time between orders
        if (this.avgDays1to2) {
            this.avgDays1to2.textContent = data.avg1to2 > 0 ? Math.round(data.avg1to2) : '-';
        }
        if (this.avgDays2to3) {
            this.avgDays2to3.textContent = data.avg2to3 > 0 ? Math.round(data.avg2to3) : '-';
        }
        if (this.avgDays3to4) {
            this.avgDays3to4.textContent = data.avg3to4 > 0 ? Math.round(data.avg3to4) : '-';
        }
        
        // Create loyalty distribution chart
        this.createLoyaltyChart(data.loyaltyDistribution);
        
        // Populate top repeat customers table
        this.populateTopRepeatCustomers(data.topRepeatCustomers);
        
        // Generate insights
        this.generateRepeatCustomerInsights(data);
    }
    
    createLoyaltyChart(distribution) {
        if (!this.loyaltyDistributionChart) return;
        
        // Destroy existing chart
        if (this.loyaltyChartInstance) {
            this.loyaltyChartInstance.destroy();
        }
        
        const labels = Object.keys(distribution);
        const values = Object.values(distribution);
        
        this.loyaltyChartInstance = new Chart(this.loyaltyDistributionChart, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: values,
                    backgroundColor: [
                        'rgba(147, 51, 234, 0.8)',
                        'rgba(124, 58, 237, 0.8)',
                        'rgba(102, 126, 234, 0.8)',
                        'rgba(79, 70, 229, 0.8)',
                        'rgba(67, 56, 202, 0.8)'
                    ],
                    borderColor: [
                        'rgb(147, 51, 234)',
                        'rgb(124, 58, 237)',
                        'rgb(102, 126, 234)',
                        'rgb(79, 70, 229)',
                        'rgb(67, 56, 202)'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: {
                            padding: 15,
                            usePointStyle: true
                        }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.label || '';
                                const value = context.parsed || 0;
                                const total = context.dataset.data.reduce((sum, val) => sum + val, 0);
                                const percent = ((value / total) * 100).toFixed(1);
                                return `${label}: ${value} customers (${percent}%)`;
                            }
                        }
                    }
                }
            }
        });
    }
    
    populateTopRepeatCustomers(topCustomers) {
        if (!this.topRepeatCustomersBody) return;
        
        this.topRepeatCustomersBody.innerHTML = '';
        
        topCustomers.forEach((customer, index) => {
            const avgOrder = customer.totalSpent / customer.orderCount;
            const firstOrderDate = customer.orders[0]?.dateStr || 'Unknown';
            
            // Create eBay message link
            const messageLink = `https://www.ebay.com/cnt/ViewMessage?other_user_id=${encodeURIComponent(customer.buyer)}&_caprdt=1&group_type=CORE&reference_type=LISTING`;
            
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td><strong>${customer.buyer}</strong></td>
                <td><strong>${customer.orderCount}</strong></td>
                <td><strong>$${customer.totalSpent.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}</strong></td>
                <td>$${avgOrder.toFixed(2)}</td>
                <td>${firstOrderDate}</td>
                <td style="text-align: center;">
                    <a href="${messageLink}" target="_blank" class="thank-you-btn" title="Send a message to ${customer.buyer}">
                        <span class="thank-you-icon">💜</span>
                        Say Thanks
                    </a>
                </td>
            `;
            this.topRepeatCustomersBody.appendChild(row);
        });
    }
    
    generateRepeatCustomerInsights(data) {
        if (!this.repeatCustomerInsights) return;
        
        this.repeatCustomerInsights.innerHTML = '';
        
        const insights = [];
        
        // Insight 1: Repeat customer value
        if (data.repeatRevenuePercent > 30) {
            insights.push({
                icon: '🎯',
                text: `Repeat customers represent ${data.repeatCustomerPercent.toFixed(1)}% of your customer base but generate ${data.repeatRevenuePercent.toFixed(1)}% of revenue! Focus on customer retention strategies.`
            });
        }
        
        // Insight 2: Order value difference
        if (data.avgOrderValueRepeat > data.avgOrderValueSingle * 1.1) {
            insights.push({
                icon: '💎',
                text: `Repeat customers spend ${((data.avgOrderValueRepeat / data.avgOrderValueSingle - 1) * 100).toFixed(1)}% more per order. Consider loyalty programs or special offers for returning customers.`
            });
        }
        
        // Insight 3: Purchase frequency
        if (data.avg1to2 > 0) {
            insights.push({
                icon: '⏰',
                text: `Customers typically return after ${Math.round(data.avg1to2)} days. Send follow-up emails or promotions around this timeframe to encourage repeat purchases.`
            });
        }
        
        // Insight 4: Most loyal customers
        const superLoyal = data.repeatBuyers.filter(b => b.orderCount >= 5);
        if (superLoyal.length > 0) {
            insights.push({
                icon: '👑',
                text: `You have ${superLoyal.length} super-loyal customers with 5+ orders! These VIP customers should receive special attention and exclusive offers.`
            });
        }
        
        insights.forEach(insight => {
            const card = document.createElement('div');
            card.className = 'repeat-insight-card';
            card.innerHTML = `
                <div class="insight-icon">${insight.icon}</div>
                <div class="insight-text">${insight.text}</div>
            `;
            this.repeatCustomerInsights.appendChild(card);
        });
    }
    
    // ==================== CARD CROPPER METHODS ====================
    
    showCardCropper() {
        console.log('Showing Card Cropper');
        // Hide all other sections
        if (this.landingPage) this.landingPage.style.display = 'none';
        if (this.executiveDashboard) this.executiveDashboard.style.display = 'none';
        if (this.inventoryDashboard) this.inventoryDashboard.style.display = 'none';
        if (this.salesDashboard) this.salesDashboard.style.display = 'none';
        if (this.collectionManagement) this.collectionManagement.style.display = 'none';
        if (this.businessSettings) this.businessSettings.style.display = 'none';
        
        // Show Card Cropper and scroll to top
        if (this.cardCropper) {
            this.cardCropper.style.display = 'block';
            window.scrollTo(0, 0);
        }
    }
    
    handleCropperDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        this.cropperUploadArea.classList.add('dragover');
    }
    
    handleCropperDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        this.cropperUploadArea.classList.remove('dragover');
    }
    
    handleCropperDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        this.cropperUploadArea.classList.remove('dragover');
        
        const files = Array.from(e.dataTransfer.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            this.addScans(files);
        }
    }
    
    handleCropperFileSelect(e) {
        const files = Array.from(e.target.files).filter(file => 
            file.type.startsWith('image/')
        );
        
        if (files.length > 0) {
            this.addScans(files);
        }
    }
    
    addScans(files) {
        // Sort files by name to maintain order
        files.sort((a, b) => a.name.localeCompare(b.name));
        
        files.forEach(file => {
            this.uploadedScans.push(file);
        });
        
        this.updateFileList();
        this.processScansBtn.disabled = false;
        this.clearScansBtn.style.display = 'inline-block';
    }
    
    updateFileList() {
        this.cropperFileList.innerHTML = '';
        
        this.uploadedScans.forEach((file, index) => {
            const fileItem = document.createElement('div');
            fileItem.className = 'cropper-file-item';
            
            // Determine if this is a front or back scan
            const isFront = index % 2 === 0;
            const scanType = isFront ? 'Fronts' : 'Backs';
            const batchNumber = Math.floor(index / 2) + 1;
            
            fileItem.innerHTML = `
                <div class="file-item-info">
                    <div class="file-item-icon">🖼️</div>
                    <div class="file-item-details">
                        <div class="file-item-name">${file.name}</div>
                        <div class="file-item-meta">Batch ${batchNumber} - ${scanType} • ${(file.size / 1024 / 1024).toFixed(2)} MB</div>
                    </div>
                </div>
                <button class="file-item-remove" data-index="${index}">Remove</button>
            `;
            
            const removeBtn = fileItem.querySelector('.file-item-remove');
            removeBtn.addEventListener('click', () => this.removeScan(index));
            
            this.cropperFileList.appendChild(fileItem);
        });
    }
    
    removeScan(index) {
        this.uploadedScans.splice(index, 1);
        this.updateFileList();
        
        if (this.uploadedScans.length === 0) {
            this.processScansBtn.disabled = true;
            this.clearScansBtn.style.display = 'none';
        }
    }
    
    clearCropperData() {
        this.uploadedScans = [];
        this.croppedCards = [];
        this.cropperFileList.innerHTML = '';
        this.processScansBtn.disabled = true;
        this.clearScansBtn.style.display = 'none';
        this.cropperProgress.style.display = 'none';
        this.cropperPreview.style.display = 'none';
        this.cropperFileInput.value = '';
    }
    
    async processScans() {
        if (this.uploadedScans.length === 0) {
            alert('Please upload scan images first.');
            return;
        }
        
        // Show progress
        this.cropperProgress.style.display = 'block';
        this.cropperPreview.style.display = 'none';
        this.croppedCards = [];
        
        const cardType = this.cardTypeSelect.value;
        const startingNumber = parseInt(this.startingNumberInput.value) || 1;
        const cardsPerScan = cardType === 'graded' ? 4 : 8;
        const gridLayout = cardType === 'graded' ? { cols: 2, rows: 2 } : { cols: 4, rows: 2 };
        
        let cardCounter = startingNumber;
        
        try {
            // Process scans in pairs (front, back)
            for (let i = 0; i < this.uploadedScans.length; i += 2) {
                const frontScan = this.uploadedScans[i];
                const backScan = this.uploadedScans[i + 1];
                
                const progress = ((i + 1) / this.uploadedScans.length * 100);
                this.cropperProgressBar.style.width = `${progress}%`;
                this.cropperProgressText.textContent = `Processing batch ${Math.floor(i / 2) + 1} of ${Math.ceil(this.uploadedScans.length / 2)}...`;
                
                // Process front scan
                if (frontScan) {
                    const frontCards = await this.detectAndCropCards(frontScan, gridLayout, cardCounter, 'front');
                    this.croppedCards.push(...frontCards);
                }
                
                // Process back scan
                if (backScan) {
                    const backCards = await this.detectAndCropCards(backScan, gridLayout, cardCounter, 'back');
                    this.croppedCards.push(...backCards);
                }
                
                cardCounter += cardsPerScan;
                
                // Small delay to update UI
                await new Promise(resolve => setTimeout(resolve, 100));
            }
            
            // Complete
            this.cropperProgressBar.style.width = '100%';
            this.cropperProgressText.textContent = 'Processing complete!';
            
            // Show preview
            setTimeout(() => {
                this.cropperProgress.style.display = 'none';
                this.showCroppedCardsPreview();
            }, 500);
            
        } catch (error) {
            console.error('Error processing scans:', error);
            alert('An error occurred while processing the scans. Please try again.');
            this.cropperProgress.style.display = 'none';
        }
    }
    
    async detectAndCropCards(imageFile, gridLayout, startingCardNumber, side) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                const img = new Image();
                
                img.onload = () => {
                    try {
                        const cards = this.cropCardsFromImage(img, gridLayout, startingCardNumber, side);
                        resolve(cards);
                    } catch (error) {
                        reject(error);
                    }
                };
                
                img.onerror = () => reject(new Error('Failed to load image'));
                img.src = e.target.result;
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsDataURL(imageFile);
        });
    }
    
    cropCardsFromImage(img, gridLayout, startingCardNumber, side) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        const { cols, rows } = gridLayout;
        const cards = [];
        
        // Calculate grid dimensions
        const cardWidth = Math.floor(img.width / cols);
        const cardHeight = Math.floor(img.height / rows);
        
        // Get user-adjustable settings
        const marginPercent = (this.cropMarginInput?.value || 5) / 100;
        const borderPixels = parseInt(this.whiteBorderInput?.value || 10);
        
        // Calculate margins based on user setting
        const marginX = Math.floor(cardWidth * marginPercent);
        const marginY = Math.floor(cardHeight * marginPercent);
        
        let cardNumber = startingCardNumber;
        
        // Crop from top-left to right, then down (row by row)
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                // Calculate crop area with conservative margins
                const cropX = col * cardWidth + marginX;
                const cropY = row * cardHeight + marginY;
                const cropWidth = cardWidth - (marginX * 2);
                const cropHeight = cardHeight - (marginY * 2);
                
                // Final canvas size includes white border
                const finalWidth = cropWidth + (borderPixels * 2);
                const finalHeight = cropHeight + (borderPixels * 2);
                
                // Set canvas size
                canvas.width = finalWidth;
                canvas.height = finalHeight;
                
                // Fill with white background first (for the border)
                ctx.fillStyle = '#FFFFFF';
                ctx.fillRect(0, 0, finalWidth, finalHeight);
                
                // Draw the cropped slab with white border
                ctx.drawImage(img, cropX, cropY, cropWidth, cropHeight, borderPixels, borderPixels, cropWidth, cropHeight);
                
                // Convert to data URL
                const croppedDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                
                cards.push({
                    number: cardNumber,
                    side: side,
                    dataUrl: croppedDataUrl,
                    filename: `card_${String(cardNumber).padStart(3, '0')}_${side}.jpg`
                });
                
                cardNumber++;
            }
        }
        
        return cards;
    }
    
    
    showCroppedCardsPreview() {
        this.cropperPreview.style.display = 'block';
        this.cropperPreviewGrid.innerHTML = '';
        
        // Sort cards by number and side (fronts first, then backs)
        const sortedCards = [...this.croppedCards].sort((a, b) => {
            if (a.number !== b.number) {
                return a.number - b.number;
            }
            return a.side === 'front' ? -1 : 1;
        });
        
        sortedCards.forEach(card => {
            const previewCard = document.createElement('div');
            previewCard.className = 'preview-card';
            
            previewCard.innerHTML = `
                <img src="${card.dataUrl}" alt="${card.filename}" class="preview-card-image">
                <div class="preview-card-info">
                    <div class="preview-card-name">${card.filename}</div>
                    <div class="preview-card-side">${card.side === 'front' ? '🎴 Front' : '🔄 Back'}</div>
                </div>
            `;
            
            this.cropperPreviewGrid.appendChild(previewCard);
        });
    }
    
    async downloadAllCards() {
        if (this.croppedCards.length === 0) {
            alert('No cards to download.');
            return;
        }
        
        // Download each card individually
        for (const card of this.croppedCards) {
            await this.downloadCard(card);
            // Small delay between downloads to avoid browser blocking
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        
        alert(`Successfully downloaded ${this.croppedCards.length} card images!`);
    }
    
    downloadCard(card) {
        return new Promise((resolve) => {
            const link = document.createElement('a');
            link.href = card.dataUrl;
            link.download = card.filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Resolve after a short delay
            setTimeout(resolve, 50);
        });
    }

    // ============= IMAGE OPTIMIZER METHODS =============

    initializeImageOptimizer() {
        // Initialize state
        this.optimizerImages = [];
        this.optimizerWatermark = null;
        this.processedImages = [];

        // Get elements
        const uploadZone = document.getElementById('optimizerUploadZone');
        const fileInput = document.getElementById('optimizerFileInput');
        const proceedBtn = document.getElementById('proceedToOptionsBtn');
        
        // Upload zone click
        uploadZone?.addEventListener('click', () => fileInput?.click());
        
        // File input change
        fileInput?.addEventListener('change', (e) => this.handleOptimizerFiles(e.target.files));
        
        // Drag and drop
        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });
        
        uploadZone?.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });
        
        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            this.handleOptimizerFiles(e.dataTransfer.files);
        });

        // Proceed to options button
        proceedBtn?.addEventListener('click', () => this.showOptimizerOptions());

        // Back buttons
        document.getElementById('backToPlatformFromOptimizer')?.addEventListener('click', () => {
            document.getElementById('imageOptimizer').style.display = 'none';
            this.showPlatformSelector();
        });

        document.getElementById('backToUploadBtn')?.addEventListener('click', () => this.showOptimizerUploadStep());
        document.getElementById('backToUploadBtn2')?.addEventListener('click', () => this.showOptimizerUploadStep());
        document.getElementById('backToOptionsBtn')?.addEventListener('click', () => this.showOptimizerOptions());

        // Process button
        document.getElementById('processImagesBtn')?.addEventListener('click', () => this.processOptimizerImages());

        // Start over button
        document.getElementById('startOverBtn')?.addEventListener('click', () => {
            this.optimizerImages = [];
            this.processedImages = [];
            document.getElementById('optimizerFileList').innerHTML = '';
            document.getElementById('proceedToOptionsBtn').disabled = true;
            this.showOptimizerUploadStep();
        });

        // Option checkboxes - show/hide settings
        const optionCheckboxes = ['optionCollage', 'optionWatermark', 'optionCrop', 'optionResize', 'optionRename', 'optionEnhance'];
        optionCheckboxes.forEach(id => {
            const checkbox = document.getElementById(id);
            checkbox?.addEventListener('change', (e) => {
                const settingsId = id.replace('option', '').toLowerCase() + 'Settings';
                const settings = document.getElementById(settingsId);
                if (settings) {
                    settings.style.display = e.target.checked ? 'block' : 'none';
                }
            });
        });

        // Watermark file upload
        document.getElementById('watermarkFile')?.addEventListener('change', (e) => this.handleWatermarkUpload(e));

        // Watermark sliders
        document.getElementById('watermarkOpacity')?.addEventListener('input', (e) => {
            document.getElementById('watermarkOpacityValue').textContent = e.target.value + '%';
        });

        document.getElementById('watermarkSize')?.addEventListener('input', (e) => {
            document.getElementById('watermarkSizeValue').textContent = e.target.value + '%';
        });

        // Resize quality slider
        document.getElementById('resizeQuality')?.addEventListener('input', (e) => {
            document.getElementById('resizeQualityValue').textContent = e.target.value + '%';
        });

        // Sharpen slider
        document.getElementById('enhanceSharpenAmount')?.addEventListener('input', (e) => {
            document.getElementById('enhanceSharpenValue').textContent = e.target.value + '%';
        });

        // Resize target dropdown
        document.getElementById('resizeTarget')?.addEventListener('change', (e) => {
            const customRow = document.getElementById('customSizeRow');
            if (customRow) {
                customRow.style.display = e.target.value === 'custom' ? 'flex' : 'none';
            }
        });

        // Rename pattern preview
        const updateRenamePreview = () => {
            const pattern = document.getElementById('renamePattern')?.value || 'product';
            const start = parseInt(document.getElementById('renameStart')?.value) || 1;
            const padding = parseInt(document.getElementById('renamePadding')?.value) || 3;
            const preview = document.getElementById('renamePreview');
            if (preview) {
                const number = start.toString().padStart(padding, '0');
                preview.textContent = `${pattern}-${number}.jpg`;
            }
        };

        document.getElementById('renamePattern')?.addEventListener('input', updateRenamePreview);
        document.getElementById('renameStart')?.addEventListener('input', updateRenamePreview);
        document.getElementById('renamePadding')?.addEventListener('change', updateRenamePreview);

        // Download all button
        document.getElementById('downloadAllBtn')?.addEventListener('click', () => this.downloadAllProcessedImages());
    }

    async handleOptimizerFiles(files) {
        const fileArray = Array.from(files).filter(f => f.type.startsWith('image/'));
        
        if (fileArray.length === 0) {
            alert('Please select image files only.');
            return;
        }

        // Load images
        for (const file of fileArray) {
            try {
                const dataUrl = await this.readFileAsDataURL(file);
                this.optimizerImages.push({
                    file: file,
                    name: file.name,
                    size: file.size,
                    dataUrl: dataUrl,
                    image: await this.loadImage(dataUrl)
                });
            } catch (error) {
                console.error('Error loading image:', error);
            }
        }

        this.updateOptimizerFileList();
        document.getElementById('proceedToOptionsBtn').disabled = this.optimizerImages.length === 0;
    }

    readFileAsDataURL(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    loadImage(src) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
        });
    }

    updateOptimizerFileList() {
        const fileList = document.getElementById('optimizerFileList');
        if (!fileList) return;

        fileList.innerHTML = '';
        
        if (this.optimizerImages.length === 0) {
            fileList.style.display = 'none';
            return;
        }

        fileList.style.display = 'block';

        this.optimizerImages.forEach((img, index) => {
            const item = document.createElement('div');
            item.className = 'optimizer-file-item';
            item.innerHTML = `
                <img src="${img.dataUrl}" class="file-item-thumb" alt="${img.name}">
                <div class="file-item-info">
                    <div class="file-item-name">${img.name}</div>
                    <div class="file-item-size">${this.formatFileSize(img.size)}</div>
                </div>
                <button class="file-item-remove" onclick="appInstance.removeOptimizerImage(${index})">Remove</button>
            `;
            fileList.appendChild(item);
        });
    }

    formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    }

    removeOptimizerImage(index) {
        this.optimizerImages.splice(index, 1);
        this.updateOptimizerFileList();
        document.getElementById('proceedToOptionsBtn').disabled = this.optimizerImages.length === 0;
    }

    showOptimizerUploadStep() {
        document.getElementById('optimizerUploadStep').style.display = 'block';
        document.getElementById('optimizerOptionsStep').style.display = 'none';
        document.getElementById('optimizerProcessingStep').style.display = 'none';
        document.getElementById('optimizerPreviewStep').style.display = 'none';
    }

    showOptimizerOptions() {
        document.getElementById('optimizerUploadStep').style.display = 'none';
        document.getElementById('optimizerOptionsStep').style.display = 'block';
        document.getElementById('optimizerProcessingStep').style.display = 'none';
        document.getElementById('optimizerPreviewStep').style.display = 'none';

        // Update image count
        const imageCount = document.getElementById('imageCount');
        if (imageCount) {
            imageCount.textContent = this.optimizerImages.length;
        }
    }

    async handleWatermarkUpload(e) {
        const file = e.target.files[0];
        if (!file) return;

        try {
            const dataUrl = await this.readFileAsDataURL(file);
            this.optimizerWatermark = await this.loadImage(dataUrl);

            // Show preview
            const preview = document.getElementById('watermarkPreview');
            if (preview) {
                preview.innerHTML = `<img src="${dataUrl}" alt="Watermark">`;
                preview.classList.add('show');
            }
        } catch (error) {
            console.error('Error loading watermark:', error);
            alert('Error loading watermark file');
        }
    }

    async processOptimizerImages() {
        // Show processing step
        document.getElementById('optimizerOptionsStep').style.display = 'none';
        document.getElementById('optimizerProcessingStep').style.display = 'block';

        this.processedImages = [];

        const progressBar = document.getElementById('processingProgressBar');
        const progressText = document.getElementById('processingProgressText');

        try {
            // Check which options are selected
            const createCollage = document.getElementById('optionCollage')?.checked;
            const addWatermark = document.getElementById('optionWatermark')?.checked;
            const autoCrop = document.getElementById('optionCrop')?.checked;
            const resize = document.getElementById('optionResize')?.checked;
            const rename = document.getElementById('optionRename')?.checked;
            const enhance = document.getElementById('optionEnhance')?.checked;

            // If collage is selected, create one collage from all images
            if (createCollage) {
                progressText.textContent = 'Creating collage...';
                const collage = await this.createCollage(this.optimizerImages);
                this.processedImages.push(collage);
                progressBar.style.width = '100%';
            } else {
                // Process each image individually
                for (let i = 0; i < this.optimizerImages.length; i++) {
                    const img = this.optimizerImages[i];
                    progressText.textContent = `Processing image ${i + 1} of ${this.optimizerImages.length}...`;
                    
                    let canvas = document.createElement('canvas');
                    let ctx = canvas.getContext('2d');
                    canvas.width = img.image.width;
                    canvas.height = img.image.height;
                    ctx.drawImage(img.image, 0, 0);

                    // Apply enhancements
                    if (enhance) {
                        canvas = await this.enhanceImage(canvas);
                    }

                    // Apply auto-crop
                    if (autoCrop) {
                        canvas = await this.autoCropImage(canvas);
                    }

                    // Apply resize
                    if (resize) {
                        canvas = await this.resizeImage(canvas);
                    }

                    // Apply watermark
                    if (addWatermark && this.optimizerWatermark) {
                        canvas = await this.applyWatermark(canvas);
                    }

                    // Generate filename
                    let filename = img.name;
                    if (rename) {
                        const pattern = document.getElementById('renamePattern')?.value || 'product';
                        const start = parseInt(document.getElementById('renameStart')?.value) || 1;
                        const padding = parseInt(document.getElementById('renamePadding')?.value) || 3;
                        const number = (start + i).toString().padStart(padding, '0');
                        const ext = img.name.split('.').pop();
                        filename = `${pattern}-${number}.${ext}`;
                    }

                    this.processedImages.push({
                        canvas: canvas,
                        filename: filename,
                        originalName: img.name
                    });

                    progressBar.style.width = ((i + 1) / this.optimizerImages.length * 100) + '%';
                }
            }

            // Show preview step
            setTimeout(() => {
                this.showOptimizerPreview();
            }, 500);

        } catch (error) {
            console.error('Error processing images:', error);
            alert('Error processing images: ' + error.message);
            this.showOptimizerOptions();
        }
    }

    async createCollage(images) {
        const rows = parseInt(document.getElementById('collageRows')?.value) || 2;
        const cols = parseInt(document.getElementById('collageCols')?.value) || 2;
        const spacing = parseInt(document.getElementById('collageSpacing')?.value) || 10;
        const background = document.getElementById('collageBackground')?.value || 'white';

        // Calculate cell size based on largest image
        let maxWidth = 0;
        let maxHeight = 0;
        images.forEach(img => {
            if (img.image.width > maxWidth) maxWidth = img.image.width;
            if (img.image.height > maxHeight) maxHeight = img.image.height;
        });

        const cellWidth = maxWidth;
        const cellHeight = maxHeight;

        const totalWidth = (cellWidth * cols) + (spacing * (cols + 1));
        const totalHeight = (cellHeight * rows) + (spacing * (rows + 1));

        const canvas = document.createElement('canvas');
        canvas.width = totalWidth;
        canvas.height = totalHeight;
        const ctx = canvas.getContext('2d');

        // Fill background
        if (background !== 'transparent') {
            ctx.fillStyle = background;
            ctx.fillRect(0, 0, totalWidth, totalHeight);
        }

        // Place images
        let imageIndex = 0;
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                if (imageIndex >= images.length) break;

                const img = images[imageIndex].image;
                const x = spacing + (col * (cellWidth + spacing));
                const y = spacing + (row * (cellHeight + spacing));

                // Center image in cell
                const scale = Math.min(cellWidth / img.width, cellHeight / img.height);
                const scaledWidth = img.width * scale;
                const scaledHeight = img.height * scale;
                const offsetX = (cellWidth - scaledWidth) / 2;
                const offsetY = (cellHeight - scaledHeight) / 2;

                ctx.drawImage(img, x + offsetX, y + offsetY, scaledWidth, scaledHeight);
                imageIndex++;
            }
        }

        return {
            canvas: canvas,
            filename: 'collage.jpg',
            originalName: 'collage'
        };
    }

    async applyWatermark(canvas) {
        if (!this.optimizerWatermark) return canvas;

        const position = document.getElementById('watermarkPosition')?.value || 'bottom-right';
        const opacity = parseInt(document.getElementById('watermarkOpacity')?.value) / 100 || 0.8;
        const sizePercent = parseInt(document.getElementById('watermarkSize')?.value) / 100 || 0.2;

        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const ctx = newCanvas.getContext('2d');

        // Draw original image
        ctx.drawImage(canvas, 0, 0);

        // Calculate watermark size
        const watermarkWidth = canvas.width * sizePercent;
        const watermarkHeight = this.optimizerWatermark.height * (watermarkWidth / this.optimizerWatermark.width);

        // Calculate position
        let x, y;
        const padding = 20;

        switch (position) {
            case 'bottom-right':
                x = canvas.width - watermarkWidth - padding;
                y = canvas.height - watermarkHeight - padding;
                break;
            case 'bottom-center':
                x = (canvas.width - watermarkWidth) / 2;
                y = canvas.height - watermarkHeight - padding;
                break;
            case 'bottom-left':
                x = padding;
                y = canvas.height - watermarkHeight - padding;
                break;
            case 'top-right':
                x = canvas.width - watermarkWidth - padding;
                y = padding;
                break;
            case 'top-center':
                x = (canvas.width - watermarkWidth) / 2;
                y = padding;
                break;
            case 'top-left':
                x = padding;
                y = padding;
                break;
            case 'center':
                x = (canvas.width - watermarkWidth) / 2;
                y = (canvas.height - watermarkHeight) / 2;
                break;
            default:
                x = canvas.width - watermarkWidth - padding;
                y = canvas.height - watermarkHeight - padding;
        }

        // Draw watermark with opacity
        ctx.globalAlpha = opacity;
        ctx.drawImage(this.optimizerWatermark, x, y, watermarkWidth, watermarkHeight);
        ctx.globalAlpha = 1;

        return newCanvas;
    }

    async autoCropImage(canvas) {
        const removeBackground = document.getElementById('cropRemoveBackground')?.checked;
        const border = parseInt(document.getElementById('cropBorder')?.value) || 20;

        // For now, just add border and make background white
        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width + (border * 2);
        newCanvas.height = canvas.height + (border * 2);
        const ctx = newCanvas.getContext('2d');

        // White background
        if (removeBackground) {
            ctx.fillStyle = 'white';
            ctx.fillRect(0, 0, newCanvas.width, newCanvas.height);
        }

        // Draw image with border
        ctx.drawImage(canvas, border, border);

        return newCanvas;
    }

    async resizeImage(canvas) {
        const target = document.getElementById('resizeTarget')?.value || '1600';
        const quality = parseInt(document.getElementById('resizeQuality')?.value) / 100 || 0.9;
        const maintainRatio = document.getElementById('resizeMaintainRatio')?.checked;

        let targetWidth, targetHeight;

        if (target === 'custom') {
            targetWidth = parseInt(document.getElementById('resizeWidth')?.value) || 1600;
            targetHeight = parseInt(document.getElementById('resizeHeight')?.value) || 1600;
        } else {
            targetWidth = parseInt(target);
            targetHeight = parseInt(target);
        }

        const newCanvas = document.createElement('canvas');
        const ctx = newCanvas.getContext('2d');

        if (maintainRatio) {
            const scale = Math.min(targetWidth / canvas.width, targetHeight / canvas.height);
            newCanvas.width = canvas.width * scale;
            newCanvas.height = canvas.height * scale;
        } else {
            newCanvas.width = targetWidth;
            newCanvas.height = targetHeight;
        }

        ctx.drawImage(canvas, 0, 0, newCanvas.width, newCanvas.height);

        return newCanvas;
    }

    async enhanceImage(canvas) {
        const autoEnhance = document.getElementById('enhanceAuto')?.checked;
        const sharpen = document.getElementById('enhanceSharpen')?.checked;

        const newCanvas = document.createElement('canvas');
        newCanvas.width = canvas.width;
        newCanvas.height = canvas.height;
        const ctx = newCanvas.getContext('2d');

        ctx.drawImage(canvas, 0, 0);

        if (autoEnhance) {
            // Apply contrast/brightness
            const imageData = ctx.getImageData(0, 0, newCanvas.width, newCanvas.height);
            const data = imageData.data;

            for (let i = 0; i < data.length; i += 4) {
                // Increase contrast
                const factor = 1.2;
                data[i] = Math.min(255, (data[i] - 128) * factor + 128);
                data[i + 1] = Math.min(255, (data[i + 1] - 128) * factor + 128);
                data[i + 2] = Math.min(255, (data[i + 2] - 128) * factor + 128);
            }

            ctx.putImageData(imageData, 0, 0);
        }

        if (sharpen) {
            // Apply sharpening filter
            ctx.filter = 'contrast(1.1) saturate(1.1)';
            ctx.drawImage(newCanvas, 0, 0);
            ctx.filter = 'none';
        }

        return newCanvas;
    }

    showOptimizerPreview() {
        document.getElementById('optimizerProcessingStep').style.display = 'none';
        document.getElementById('optimizerPreviewStep').style.display = 'block';

        // Update count
        const countEl = document.getElementById('processedImageCount');
        if (countEl) {
            countEl.textContent = this.processedImages.length;
        }

        // Populate preview grid
        const grid = document.getElementById('optimizerPreviewGrid');
        if (!grid) return;

        grid.innerHTML = '';

        this.processedImages.forEach((img, index) => {
            const dataUrl = img.canvas.toDataURL('image/jpeg', 0.9);
            const size = Math.round(dataUrl.length * 0.75); // Approximate size

            const item = document.createElement('div');
            item.className = 'preview-item';
            item.innerHTML = `
                <img src="${dataUrl}" class="preview-item-image" alt="${img.filename}">
                <div class="preview-item-info">
                    <div class="preview-item-name">${img.filename}</div>
                    <div class="preview-item-size">${this.formatFileSize(size)}</div>
                    <button class="preview-item-download" onclick="appInstance.downloadProcessedImage(${index})">
                        Download
                    </button>
                </div>
            `;
            grid.appendChild(item);
        });
    }

    downloadProcessedImage(index) {
        const img = this.processedImages[index];
        const dataUrl = img.canvas.toDataURL('image/jpeg', 0.9);
        
        const link = document.createElement('a');
        link.href = dataUrl;
        link.download = img.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    async downloadAllProcessedImages() {
        // For simplicity, download individually
        // In a real app, you'd create a ZIP file
        for (let i = 0; i < this.processedImages.length; i++) {
            await new Promise(resolve => {
                this.downloadProcessedImage(i);
                setTimeout(resolve, 300);
            });
        }

        alert(`✅ Downloaded ${this.processedImages.length} images!`);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing app...');
    const analytics = new ResellerNumbersAnalytics();
    // Expose instance globally for onclick handlers
    window.appInstance = analytics;
});


