/**
 * Mock Profile Utilities
 * Helper functions for managing mock data and profiles
 */

import { mockUserProfile, mockProfileVariants } from "@/app/(protected)/settings/general/mockData";

/**
 * Get a mock profile by name
 * @param {string} variant - Profile variant: 'default', 'noAvatar', 'minimal', 'complete'
 * @returns {Object} Profile data
 */
export function getMockProfile(variant = 'default') {
    const profiles = {
        default: mockUserProfile,
        noAvatar: mockProfileVariants.noAvatar,
        minimal: mockProfileVariants.minimal,
        complete: mockProfileVariants.complete,
    };
    
    return profiles[variant] || profiles.default;
}

/**
 * List all available mock profiles
 * @returns {Array} Array of profile names and variants
 */
export function listMockProfiles() {
    return [
        {
            name: 'default',
            label: 'Default Profile',
            description: 'Complete profile with avatar',
            variant: getMockProfile('default')
        },
        {
            name: 'noAvatar',
            label: 'No Avatar',
            description: 'Profile without avatar image',
            variant: getMockProfile('noAvatar')
        },
        {
            name: 'minimal',
            label: 'Minimal Data',
            description: 'Only required fields',
            variant: getMockProfile('minimal')
        },
        {
            name: 'complete',
            label: 'Complete Data',
            description: 'Full profile with all details',
            variant: getMockProfile('complete')
        },
    ];
}

/**
 * Get profile name from data
 * @param {Object} profile - Profile data object
 * @returns {string} Profile name
 */
export function getProfileName(profile) {
    return profile?.data?.name || profile?.name || 'Unknown';
}

/**
 * Check if profile has avatar
 * @param {Object} profile - Profile data object
 * @returns {boolean}
 */
export function hasAvatar(profile) {
    const avatar = profile?.data?.avatar || profile?.avatar;
    return !!avatar;
}

/**
 * Get profile summary (useful for debug/testing)
 * @param {Object} profile - Profile data object
 * @returns {Object} Summary of profile
 */
export function getProfileSummary(profile) {
    const data = profile?.data || profile || {};
    return {
        name: data.name,
        email: data.email,
        phone: data.phone,
        hasAvatar: !!data.avatar,
        role: data.role,
        department: data.department,
        position: data.position,
    };
}

/**
 * Log profile info for debugging
 * @param {Object} profile - Profile data object
 * @param {string} label - Optional label for console
 */
export function debugProfile(profile, label = 'Profile') {
    console.group(`🔍 ${label}`);
    const summary = getProfileSummary(profile);
    Object.entries(summary).forEach(([key, value]) => {
        console.log(`${key}:`, value);
    });
    console.groupEnd();
}

/**
 * Create custom mock profile
 * @param {Object} overrides - Fields to override in default profile
 * @returns {Object} New mock profile
 */
export function createCustomProfile(overrides = {}) {
    const defaultProfile = getMockProfile('default');
    return {
        data: {
            ...defaultProfile.data,
            ...overrides
        }
    };
}

/**
 * Validate mock profile structure
 * @param {Object} profile - Profile data object
 * @returns {boolean} True if valid, false otherwise
 */
export function isValidProfile(profile) {
    const data = profile?.data || profile;
    
    const requiredFields = ['id', 'name', 'email', 'username', 'role'];
    return requiredFields.every(field => data && data[field]);
}

/**
 * Format profile data for display
 * @param {Object} profile - Profile data object
 * @returns {Object} Formatted profile
 */
export function formatProfileForDisplay(profile) {
    const data = profile?.data || profile || {};
    
    return {
        name: data.name?.trim() || '-',
        email: data.email?.toLowerCase() || '-',
        phone: data.phone?.trim() || '-',
        address: data.address?.trim() || '-',
        avatar: data.avatar || null,
        username: data.username?.toLowerCase() || '-',
        role: data.role?.toUpperCase() || '-',
        department: data.department || '-',
        position: data.position || '-',
        created_at: data.created_at || '-',
        updated_at: data.updated_at || '-',
    };
}
