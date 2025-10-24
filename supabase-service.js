// ============================================
// SUPABASE SERVICE LAYER
// Handles all database operations
// ============================================

class SupabaseService {
    constructor() {
        this.client = null;
        this.currentUser = null;
    }

    // Initialize the service
    async initialize() {
        this.client = initSupabase();
        if (!this.client) {
            console.error('Failed to initialize Supabase client');
            return false;
        }

        // Check for existing session
        const { data: { session } } = await this.client.auth.getSession();
        if (session) {
            this.currentUser = session.user;
        }

        // Listen for auth changes
        this.client.auth.onAuthStateChange((event, session) => {
            if (session) {
                this.currentUser = session.user;
            } else {
                this.currentUser = null;
            }
        });

        return true;
    }

    // ============================================
    // AUTHENTICATION METHODS
    // ============================================

    async signUp(email, password, fullName) {
        try {
            const { data, error } = await this.client.auth.signUp({
                email: email,
                password: password,
                options: {
                    data: {
                        full_name: fullName
                    }
                }
            });

            if (error) throw error;

            // Create profile with trial period
            if (data.user) {
                const trialEndsAt = new Date();
                trialEndsAt.setDate(trialEndsAt.getDate() + 14);

                await this.client
                    .from('profiles')
                    .insert({
                        id: data.user.id,
                        email: email,
                        full_name: fullName,
                        subscription_status: 'trial',
                        subscription_plan: 'free',
                        trial_ends_at: trialEndsAt.toISOString()
                    });
            }

            return { success: true, data };
        } catch (error) {
            console.error('Signup error:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email: email,
                password: password
            });

            if (error) throw error;

            this.currentUser = data.user;
            return { success: true, data };
        } catch (error) {
            console.error('Sign in error:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            return { success: true };
        } catch (error) {
            console.error('Sign out error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        try {
            const { data: { user } } = await this.client.auth.getUser();
            return user;
        } catch (error) {
            console.error('Get user error:', error);
            return null;
        }
    }

    async getUserProfile() {
        try {
            if (!this.currentUser) return null;

            const { data, error } = await this.client
                .from('profiles')
                .select('*')
                .eq('id', this.currentUser.id)
                .single();

            if (error) throw error;
            return data;
        } catch (error) {
            console.error('Get profile error:', error);
            return null;
        }
    }

    // ============================================
    // BUSINESS METRICS METHODS
    // ============================================

    async saveBusinessMetrics(metrics) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { data, error } = await this.client
                .from('business_metrics')
                .upsert({
                    user_id: this.currentUser.id,
                    minutes_per_item: metrics.minutesPerItem || 0,
                    ideal_hourly_rate: metrics.idealHourlyRate || 0,
                    avg_fee_percent: metrics.avgFeePercent || 0,
                    tax_bracket: metrics.taxBracket || 0
                });

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Save business metrics error:', error);
            return { success: false, error: error.message };
        }
    }

    async getBusinessMetrics() {
        try {
            if (!this.currentUser) return null;

            const { data, error } = await this.client
                .from('business_metrics')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error; // PGRST116 = no rows
            return data;
        } catch (error) {
            console.error('Get business metrics error:', error);
            return null;
        }
    }

    // ============================================
    // COLLECTIONS METHODS
    // ============================================

    async saveCollection(collection) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { data, error } = await this.client
                .from('collections')
                .insert({
                    user_id: this.currentUser.id,
                    name: collection.name,
                    sku: collection.sku,
                    purchase_date: collection.purchaseDate,
                    cost: collection.cost,
                    notes: collection.notes || null
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Save collection error:', error);
            return { success: false, error: error.message };
        }
    }

    async getCollections() {
        try {
            if (!this.currentUser) return [];

            const { data, error } = await this.client
                .from('collections')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('purchase_date', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get collections error:', error);
            return [];
        }
    }

    async updateCollection(id, collection) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { data, error } = await this.client
                .from('collections')
                .update({
                    name: collection.name,
                    sku: collection.sku,
                    purchase_date: collection.purchaseDate,
                    cost: collection.cost,
                    notes: collection.notes || null
                })
                .eq('id', id)
                .eq('user_id', this.currentUser.id)
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Update collection error:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteCollection(id) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { error } = await this.client
                .from('collections')
                .delete()
                .eq('id', id)
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete collection error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // INVENTORY DATA METHODS
    // ============================================

    async saveInventoryData(inventoryArray) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { data, error } = await this.client
                .from('inventory_data')
                .insert({
                    user_id: this.currentUser.id,
                    data: inventoryArray,
                    row_count: inventoryArray.length
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Save inventory data error:', error);
            return { success: false, error: error.message };
        }
    }

    async getLatestInventoryData() {
        try {
            if (!this.currentUser) return null;

            const { data, error } = await this.client
                .from('inventory_data')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('upload_date', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Get inventory data error:', error);
            return null;
        }
    }

    async deleteAllInventoryData() {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { error } = await this.client
                .from('inventory_data')
                .delete()
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete inventory data error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // SOLD DATA METHODS
    // ============================================

    async saveSoldData(soldArray) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { data, error } = await this.client
                .from('sold_data')
                .insert({
                    user_id: this.currentUser.id,
                    data: soldArray,
                    row_count: soldArray.length
                })
                .select()
                .single();

            if (error) throw error;
            return { success: true, data };
        } catch (error) {
            console.error('Save sold data error:', error);
            return { success: false, error: error.message };
        }
    }

    async getLatestSoldData() {
        try {
            if (!this.currentUser) return null;

            const { data, error } = await this.client
                .from('sold_data')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('upload_date', { ascending: false })
                .limit(1)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Get sold data error:', error);
            return null;
        }
    }

    async deleteAllSoldData() {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            const { error } = await this.client
                .from('sold_data')
                .delete()
                .eq('user_id', this.currentUser.id);

            if (error) throw error;
            return { success: true };
        } catch (error) {
            console.error('Delete sold data error:', error);
            return { success: false, error: error.message };
        }
    }

    // ============================================
    // DATA PERSISTENCE METHODS (v2.0)
    // Incremental storage with deduplication
    // ============================================

    // -------- INVENTORY HISTORY --------

    async syncInventoryHistory(inventoryArray) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            
            const stats = {
                newItems: 0,
                updatedItems: 0,
                unchangedItems: 0,
                errors: []
            };

            for (const item of inventoryArray) {
                try {
                    // Normalize item title for comparison
                    const normalizedTitle = (item['Item Title'] || item.title || '').trim();
                    if (!normalizedTitle) continue;

                    // Check if item exists (active inventory)
                    const { data: existing, error: fetchError } = await this.client
                        .from('inventory_history')
                        .select('*')
                        .eq('user_id', this.currentUser.id)
                        .eq('item_title', normalizedTitle)
                        .eq('status', 'active')
                        .maybeSingle();

                    if (fetchError) throw fetchError;

                    const currentPrice = parseFloat((item['Current Price'] || item.price || '0').toString().replace(/[$,]/g, '')) || 0;
                    const views = parseInt(item['Views'] || item.views || '0') || 0;
                    const watchers = parseInt(item['Watchers'] || item.watchers || '0') || 0;
                    const daysListed = parseInt(item['Days Listed'] || item.daysListed || '0') || 0;
                    const quantity = parseInt(item['Quantity'] || item.quantity || '1') || 1;

                    if (existing) {
                        // Item exists - check if anything changed
                        const hasChanged = (
                            existing.current_price !== currentPrice ||
                            existing.views !== views ||
                            existing.watchers !== watchers ||
                            existing.days_listed !== daysListed ||
                            existing.quantity !== quantity
                        );

                        if (hasChanged) {
                            // Update existing item
                            const { error: updateError } = await this.client
                                .from('inventory_history')
                                .update({
                                    current_price: currentPrice,
                                    views: views,
                                    watchers: watchers,
                                    days_listed: daysListed,
                                    quantity: quantity,
                                    snapshot_date: new Date().toISOString().split('T')[0]
                                })
                                .eq('id', existing.id);

                            if (updateError) throw updateError;
                            stats.updatedItems++;
                        } else {
                            stats.unchangedItems++;
                        }
                    } else {
                        // New item - insert
                        const { error: insertError } = await this.client
                            .from('inventory_history')
                            .insert({
                                user_id: this.currentUser.id,
                                item_title: normalizedTitle,
                                listing_id: item['Listing ID'] || item.listingId || null,
                                current_price: currentPrice,
                                category: item['Category'] || item.category || null,
                                condition: item['Condition'] || item.condition || null,
                                quantity: quantity,
                                days_listed: daysListed,
                                views: views,
                                watchers: watchers,
                                status: 'active',
                                snapshot_date: new Date().toISOString().split('T')[0]
                            });

                        if (insertError) {
                            // Ignore duplicate key errors
                            if (insertError.code !== '23505') {
                                throw insertError;
                            }
                            stats.unchangedItems++;
                        } else {
                            stats.newItems++;
                        }
                    }
                } catch (itemError) {
                    console.error('Error processing item:', itemError);
                    stats.errors.push({ item: item['Item Title'] || 'Unknown', error: itemError.message });
                }
            }

            // Update sync status
            await this.updateSyncStatus('inventory', stats.newItems + stats.updatedItems + stats.unchangedItems);

            return { success: true, stats };
        } catch (error) {
            console.error('Sync inventory history error:', error);
            return { success: false, error: error.message };
        }
    }

    async getInventoryHistory(status = 'active', limit = 1000) {
        try {
            if (!this.currentUser) return [];

            let query = this.client
                .from('inventory_history')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('snapshot_date', { ascending: false })
                .limit(limit);

            if (status) {
                query = query.eq('status', status);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get inventory history error:', error);
            return [];
        }
    }

    // -------- SALES HISTORY --------

    async syncSalesHistory(salesArray) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            
            console.log(`🔄 Syncing ${salesArray.length} sales to Supabase...`);
            
            const stats = {
                newSales: 0,
                duplicates: 0,
                errors: []
            };

            // Process in batches of 100 to avoid timeout
            const batchSize = 100;
            const batches = [];
            for (let i = 0; i < salesArray.length; i += batchSize) {
                batches.push(salesArray.slice(i, i + batchSize));
            }

            for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
                const batch = batches[batchIndex];
                console.log(`Processing batch ${batchIndex + 1}/${batches.length} (${batch.length} items)`);
                
                for (const sale of batch) {
                    try {
                    const normalizedTitle = (sale['Item Title'] || sale['Title'] || sale.title || '').trim();
                    if (!normalizedTitle) continue;

                    const soldPrice = parseFloat((sale['Sold Price'] || sale['Sold For'] || sale.price || '0').toString().replace(/[$,]/g, '')) || 0;
                    const soldDateStr = sale['Sold Date'] || sale['Sale Date'] || sale.date || new Date().toISOString();
                    const soldDate = new Date(soldDateStr).toISOString().split('T')[0];
                    const buyer = sale['Buyer Username'] || sale['Buyer'] || sale.buyer || null;
                    const quantity = parseInt(sale['Quantity'] || sale.quantity || '1') || 1;

                    // Insert sale (will be ignored if duplicate due to UNIQUE constraint)
                    const { error: insertError } = await this.client
                        .from('sales_history')
                        .insert({
                            user_id: this.currentUser.id,
                            item_title: normalizedTitle,
                            listing_id: sale['Listing ID'] || sale.listingId || null,
                            sold_price: soldPrice,
                            sold_date: soldDate,
                            quantity: quantity,
                            buyer_username: buyer,
                            buyer_location: sale['Buyer Location'] || sale.location || null,
                            buyer_state: sale['Buyer State'] || sale.state || null,
                            fees: parseFloat((sale['Fees'] || sale.fees || '0').toString().replace(/[$,]/g, '')) || null,
                            shipping_cost: parseFloat((sale['Shipping'] || sale.shipping || '0').toString().replace(/[$,]/g, '')) || null
                        });

                    if (insertError) {
                        if (insertError.code === '23505') {
                            // Duplicate - this is expected
                            stats.duplicates++;
                        } else {
                            throw insertError;
                        }
                    } else {
                        stats.newSales++;

                        // Mark corresponding inventory item as sold
                        await this.client
                            .from('inventory_history')
                            .update({ status: 'sold' })
                            .eq('user_id', this.currentUser.id)
                            .eq('item_title', normalizedTitle)
                            .eq('status', 'active');
                    }
                } catch (itemError) {
                    console.error('Error processing sale:', itemError);
                    stats.errors.push({ item: sale['Item Title'] || 'Unknown', error: itemError.message });
                }
                }
                
                // Small delay between batches to prevent overwhelming the database
                if (batchIndex < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 100));
                }
            }

            // Update sync status
            await this.updateSyncStatus('sales', stats.newSales + stats.duplicates);

            return { success: true, stats };
        } catch (error) {
            console.error('Sync sales history error:', error);
            return { success: false, error: error.message };
        }
    }

    async getSalesHistory(limit = 1000, startDate = null, endDate = null) {
        try {
            if (!this.currentUser) return [];

            let query = this.client
                .from('sales_history')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('sold_date', { ascending: false })
                .limit(limit);

            if (startDate) {
                query = query.gte('sold_date', startDate);
            }
            if (endDate) {
                query = query.lte('sold_date', endDate);
            }

            const { data, error } = await query;

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get sales history error:', error);
            return [];
        }
    }

    // -------- UNSOLD HISTORY --------

    async syncUnsoldHistory(unsoldArray) {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');
            
            const stats = {
                newUnsold: 0,
                duplicates: 0,
                errors: []
            };

            for (const unsold of unsoldArray) {
                try {
                    const normalizedTitle = (unsold['Item Title'] || unsold['Title'] || unsold.title || '').trim();
                    if (!normalizedTitle) continue;

                    const originalPrice = parseFloat((unsold['Original Price'] || unsold.price || '0').toString().replace(/[$,]/g, '')) || 0;
                    const endedDateStr = unsold['Ended Date'] || unsold['End Date'] || unsold.date || new Date().toISOString();
                    const endedDate = new Date(endedDateStr).toISOString().split('T')[0];

                    // Insert unsold item
                    const { error: insertError } = await this.client
                        .from('unsold_history')
                        .insert({
                            user_id: this.currentUser.id,
                            item_title: normalizedTitle,
                            listing_id: unsold['Listing ID'] || unsold.listingId || null,
                            original_price: originalPrice,
                            reason: unsold['Reason'] || unsold.reason || 'ended',
                            ended_date: endedDate,
                            final_views: parseInt(unsold['Views'] || unsold.views || '0') || 0,
                            final_watchers: parseInt(unsold['Watchers'] || unsold.watchers || '0') || 0,
                            days_active: parseInt(unsold['Days Listed'] || unsold.daysListed || '0') || 0
                        });

                    if (insertError) {
                        if (insertError.code === '23505') {
                            stats.duplicates++;
                        } else {
                            throw insertError;
                        }
                    } else {
                        stats.newUnsold++;

                        // Mark corresponding inventory item as ended
                        await this.client
                            .from('inventory_history')
                            .update({ status: 'ended' })
                            .eq('user_id', this.currentUser.id)
                            .eq('item_title', normalizedTitle)
                            .eq('status', 'active');
                    }
                } catch (itemError) {
                    console.error('Error processing unsold item:', itemError);
                    stats.errors.push({ item: unsold['Item Title'] || 'Unknown', error: itemError.message });
                }
            }

            // Update sync status
            await this.updateSyncStatus('unsold', stats.newUnsold + stats.duplicates);

            return { success: true, stats };
        } catch (error) {
            console.error('Sync unsold history error:', error);
            return { success: false, error: error.message };
        }
    }

    async getUnsoldHistory(limit = 1000) {
        try {
            if (!this.currentUser) return [];

            const { data, error } = await this.client
                .from('unsold_history')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .order('ended_date', { ascending: false })
                .limit(limit);

            if (error) throw error;
            return data || [];
        } catch (error) {
            console.error('Get unsold history error:', error);
            return [];
        }
    }

    // -------- SYNC STATUS --------

    async updateSyncStatus(dataType, itemCount) {
        try {
            if (!this.currentUser) return;

            const updates = {
                updated_at: new Date().toISOString()
            };

            if (dataType === 'inventory') {
                updates.last_inventory_sync = new Date().toISOString();
                updates.total_inventory_items = itemCount;
            } else if (dataType === 'sales') {
                updates.last_sales_sync = new Date().toISOString();
                updates.total_sales = itemCount;
            } else if (dataType === 'unsold') {
                updates.last_unsold_sync = new Date().toISOString();
                updates.total_unsold = itemCount;
            }

            // Upsert sync status
            await this.client
                .from('data_sync_status')
                .upsert({
                    user_id: this.currentUser.id,
                    ...updates
                });

        } catch (error) {
            console.error('Update sync status error:', error);
        }
    }

    async getSyncStatus() {
        try {
            if (!this.currentUser) return null;

            const { data, error } = await this.client
                .from('data_sync_status')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .maybeSingle();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (error) {
            console.error('Get sync status error:', error);
            return null;
        }
    }

    // -------- DATA CLEANUP --------

    async clearAllHistoricalData() {
        try {
            if (!this.currentUser) throw new Error('User not authenticated');

            await this.client.from('inventory_history').delete().eq('user_id', this.currentUser.id);
            await this.client.from('sales_history').delete().eq('user_id', this.currentUser.id);
            await this.client.from('unsold_history').delete().eq('user_id', this.currentUser.id);
            await this.client.from('data_sync_status').delete().eq('user_id', this.currentUser.id);

            return { success: true };
        } catch (error) {
            console.error('Clear historical data error:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create global instance
const supabaseService = new SupabaseService();


