/**
 * Common validation rules for the frontend
 */

export const required = (message = "Trường này là bắt buộc") => (value) => {
    if (value === undefined || value === null || value === "") return message;
    if (Array.isArray(value) && value.length === 0) return message;
    return null;
};

export const email = (message = "Email không hợp lệ") => (value) => {
    if (!value) return null;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(value) ? null : message;
};

export const minLength = (min, message) => (value) => {
    if (!value) return null;
    const msg = message || `Tối thiểu ${min} ký tự`;
    return value.length >= min ? null : msg;
};

export const maxLength = (max, message) => (value) => {
    if (!value) return null;
    const msg = message || `Tối đa ${max} ký tự`;
    return value.length <= max ? null : msg;
};

export const regex = (pattern, message = "Định dạng không hợp lệ") => (value) => {
    if (!value) return null;
    return pattern.test(value) ? null : message;
};

export const unique = (list, currentId, message = "Giá trị này đã tồn tại") => (value) => {
    if (!value) return null;
    const exists = list.some(item =>
        item.label?.toLowerCase() === value.trim().toLowerCase() &&
        item.value !== currentId
    );
    return exists ? message : null;
};

export const uniqueField = (list, field, currentId, message = "Giá trị này đã tồn tại") => (value) => {
    if (!value) return null;
    const val = value.trim().toLowerCase();
    const exists = list.some(item => {
        const itemVal = item[field]?.toString().toLowerCase();
        return itemVal === val && item.id !== currentId;
    });
    return exists ? message : null;
};

export const phone = (message = "Invalid Vietnamese phone format (e.g., 0912345678)") => (value) => {
    if (!value) return null;
    // Vietnamese phone format: 0xxxxxxxxx or +84xxxxxxxxx (10-11 digits total)
    // Valid carriers: 3, 5, 7, 8, 9 as second digit
    const phoneRegex = /^(\+84|0)(3|5|7|8|9)\d{8}$/;
    return phoneRegex.test(value.replace(/\s|-/g, "")) ? null : message;
};

export const fileSize = (maxSizeMB, message) => (file) => {
    if (!file) return null;
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    const msg = message || `Kích thước file không được vượt quá ${maxSizeMB}MB`;
    return file.size <= maxSizeBytes ? null : msg;
};

export const fileType = (allowedTypes, message) => (file) => {
    if (!file) return null;
    const typesArray = Array.isArray(allowedTypes) ? allowedTypes : [allowedTypes];
    const msg = message || `Định dạng file không được hỗ trợ. Các loại được hỗ trợ: ${typesArray.join(", ")}`;
    return typesArray.includes(file.type) ? null : msg;
};

/**
 * Validate an object against a set of rules
 * @param {Object} values - The values to validate
 * @param {Object} rules - The rules to apply (key: array of rule functions)
 * @returns {Object} - Errors object (key: error message or null)
 */
export const validate = (values, rules) => {
    const errors = {};
    let hasErrors = false;

    Object.keys(rules).forEach((key) => {
        const fieldRules = Array.isArray(rules[key]) ? rules[key] : [rules[key]];
        for (const rule of fieldRules) {
            const error = rule(values[key]);
            if (error) {
                errors[key] = error;
                hasErrors = true;
                break;
            }
        }
    });

    return hasErrors ? errors : null;
};
