export const APPROVER_TYPES = {
    DIRECT_MANAGER: 'DIRECT_MANAGER',
    ROLE: 'ROLE',
};

export const TRACKING_CYCLES = {
    DAY: 'DAY',
    WEEK: 'WEEK',
    MONTH: 'MONTH',
    YEAR: 'YEAR',
};

export const POLICY_UNITS = {
    DAY: 'DAY',
    HOUR: 'HOUR',
    MINUTE: 'MINUTE',
    TIME: 'TIME',
};

export const APPROVER_TYPE_LABELS = {
    [APPROVER_TYPES.DIRECT_MANAGER]: 'Quản lý trực tiếp',
    [APPROVER_TYPES.ROLE]: 'Theo vai trò',
};

export const TRACKING_CYCLE_LABELS = {
    [TRACKING_CYCLES.DAY]: 'Theo Ngày',
    [TRACKING_CYCLES.WEEK]: 'Theo Tuần',
    [TRACKING_CYCLES.MONTH]: 'Theo Tháng',
    [TRACKING_CYCLES.YEAR]: 'Theo Năm',
};

export const POLICY_UNIT_LABELS = {
    [POLICY_UNITS.DAY]: 'Cả Ngày',
    [POLICY_UNITS.HOUR]: 'Giờ',
    [POLICY_UNITS.MINUTE]: 'Phút',
    [POLICY_UNITS.TIME]: 'Số lần',
};

export const REQUEST_GROUP_CODES = {
    LEAVE: 'LEAVE',
    OVERTIME: 'OVERTIME',
    BUSINESS_TRIP: 'BUSINESS_TRIP',
    WORK_FROM_HOME: 'WORK_FROM_HOME',
    LATE_EARLY: 'LATE_EARLY',
    ATTENDANCE_CORRECTION: 'ATTENDANCE_CORRECTION',
    OTHER: 'OTHER'
};

export const REQUEST_GROUP_CODE_LABELS = {
    [REQUEST_GROUP_CODES.LEAVE]: 'Nghỉ phép',
    [REQUEST_GROUP_CODES.OVERTIME]: 'Làm thêm giờ',
    [REQUEST_GROUP_CODES.BUSINESS_TRIP]: 'Công tác',
    [REQUEST_GROUP_CODES.WORK_FROM_HOME]: 'Làm việc từ xa',
    [REQUEST_GROUP_CODES.LATE_EARLY]: 'Đi trễ/Về sớm',
    [REQUEST_GROUP_CODES.ATTENDANCE_CORRECTION]: 'Giải trình chấm công',
    [REQUEST_GROUP_CODES.OTHER]: 'Khác'
};
