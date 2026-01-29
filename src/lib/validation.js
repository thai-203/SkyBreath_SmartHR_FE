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

export const unique = (list, currentId, message = "Giá trị này đã tồn tại") => (value) => {
    if (!value) return null;
    const exists = list.some(item =>
        item.label.toLowerCase() === value.trim().toLowerCase() &&
        item.value !== currentId
    );
    return exists ? message : null;
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
