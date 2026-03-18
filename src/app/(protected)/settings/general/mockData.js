/**
 * Mock data for UI demonstration
 * Use this when backend API is not available
 */

export const mockUserProfile = {
  data: {
    id: "550e8400-e29b-41d4-a716-446655440000",
    fullName: "Nguyễn Văn A",
    email: "nguyen.van.a@skybreath.com",
    personalEmail: "nva.personal@gmail.com",
    employeeId: 123,
    phone: "0912345678",
    address: "123 Đường Nguyễn Huệ, Quận 1, TP. Hồ Chí Minh",
    avatar:
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop",
    username: "nguyenvana",
    role: "EMPLOYEE",
    department: "Kỹ Thuật (Engineering)",
    position: "Senior Developer",
    created_at: "2024-01-15T10:30:00Z",
    updated_at: "2024-02-10T14:45:00Z",
  },
};

export const mockProfileVariants = {
  // Variant with no avatar
  noAvatar: {
    data: {
      ...mockUserProfile.data,
      avatar: null,
    },
  },

  // Variant with minimal data
  minimal: {
    data: {
      id: "550e8400-e29b-41d4-a716-446655440001",
      name: "Trần Thị B",
      email: "tran.thi.b@skybreath.com",
      personalEmail: "ttb.personal@example.com",
      phone: null,
      address: null,
      avatar: null,
      username: "tranthib",
      role: "MANAGER",
      department: "Kinh Doanh (Sales)",
      position: "Team Lead",
    },
  },

  // Variant with full details
  complete: {
    data: {
      id: "550e8400-e29b-41d4-a716-446655440002",
      name: "Phạm Hữu C",
      email: "pham.huu.c@skybreath.com",
      personalEmail: "phc.personal@outlook.com",
      phone: "0987654321",
      address: "456 Đường Pasteur, Quận 3, TP. Hồ Chí Minh",
      avatar:
        "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop",
      username: "phamhuuc",
      role: "ADMIN",
      department: "Nhân Sự (HR)",
      position: "HR Manager",
      created_at: "2023-06-01T08:15:00Z",
      updated_at: "2024-02-08T16:20:00Z",
    },
  },
};
