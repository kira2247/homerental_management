import { TranslationDictionary } from '../types';

export const dashboard: TranslationDictionary = {
  title: {
    en: 'Dashboard',
    vi: 'Bảng Điều Khiển'
  },
  welcome: {
    en: 'Welcome Back',
    vi: 'Chào Mừng Trở Lại'
  },
  comparedToLastMonth: {
    en: 'Compared To Last Month',
    vi: 'So Với Tháng Trước'
  },
  noDataToShow: {
    en: 'No Data To Show',
    vi: 'Không Có Dữ Liệu Hiển Thị'
  },
  errorTitle: {
    en: 'An error occurred!',
    vi: 'Đã Xảy Ra Lỗi!'
  },
  authError: {
    en: 'Authentication Error',
    vi: 'Lỗi Xác Thực'
  },
  sessionExpired: {
    en: 'Your session has expired. Please log in again to continue.',
    vi: 'Phiên Làm Việc Của Bạn Đã Hết Hạn. Vui Lòng Đăng Nhập Lại Để Tiếp Tục.'
  },
  unknownError: {
    en: 'An unknown error occurred. Please try again later.',
    vi: 'Đã Xảy Ra Lỗi Không Xác Định. Vui Lòng Thử Lại Sau.'
  },
  properties: {
    en: 'Properties',
    vi: 'Tài Sản'
  },
  totalProperties: {
    en: 'Total Properties',
    vi: 'Tổng Số Tài Sản'
  },
  tenants: {
    en: 'Tenants',
    vi: 'Người Thuê'
  },
  pendingPayments: {
    en: 'Pending Payments',
    vi: 'Thanh Toán Chưa Hoàn Tất'
  },
  navigation: {
    dashboard: {
      en: 'Dashboard',
      vi: 'Bảng Điều Khiển'
    },
    properties: {
      en: 'Properties',
      vi: 'Tài Sản'
    },
    tenants: {
      en: 'Tenants',
      vi: 'Người Thuê'
    },
    bills: {
      en: 'Bills',
      vi: 'Hóa Đơn'
    },
    maintenance: {
      en: 'Maintenance',
      vi: 'Bảo Trì'
    },
    reports: {
      en: 'Reports',
      vi: 'Báo Cáo'
    },
    settings: {
      en: 'Settings',
      vi: 'Cài Đặt'
    }
  },
  financial: {
    overview: {
      title: {
        en: 'Financial Overview',
        vi: 'Tổng Quan Tài Chính'
      },
      subtitle: {
        en: 'Financial performance for {{period}}',
        vi: 'Hiệu suất tài chính trong {{period}}'
      }
    },
    period: {
      month: {
        en: 'this month',
        vi: 'tháng này'
      },
      quarter: {
        en: 'this quarter',
        vi: 'quý này'
      },
      year: {
        en: 'this year',
        vi: 'năm nay'
      },
      week: {
        en: 'Week {week}',
        vi: 'Tuần {week}'
      }
    },
    revenue: {
      total: {
        en: 'Total Revenue',
        vi: 'Tổng Doanh Thu'
      },
      label: {
        en: 'Revenue',
        vi: 'Thu nhập'
      }
    },
    expenses: {
      total: {
        en: 'Total Expenses',
        vi: 'Tổng Chi Phí'
      },
      label: {
        en: 'Expenses',
        vi: 'Chi phí'
      }
    },
    profit: {
      net: {
        en: 'Net Profit',
        vi: 'Lợi Nhuận Ròng'
      },
      label: {
        en: 'Profit',
        vi: 'Lợi nhuận'
      }
    },
    comparison: {
      previousPeriod: {
        en: 'Compared To Previous Period',
        vi: 'So Với Kỳ Trước'
      }
    }
  },
  tasks: {
    maintenanceRequests: {
      en: 'Maintenance Requests',
      vi: 'Yêu Cầu Bảo Trì'
    },
    viewAll: {
      en: 'View All Tasks',
      vi: 'Xem Tất Cả Công Việc'
    },
    complete: {
      en: 'Complete',
      vi: 'Hoàn thành'
    },
    dueIn: {
      en: 'Due in',
      vi: 'Còn'
    },
    days: {
      en: 'days',
      vi: 'ngày'
    },
    daysOverdue: {
      en: 'days overdue',
      vi: 'ngày quá hạn'
    },
    dueToday: {
      en: 'Due today',
      vi: 'Đến hạn hôm nay'
    },
    noMaintenanceRequests: {
      en: 'No maintenance requests',
      vi: 'Không có yêu cầu bảo trì'
    }
  },
  propertyDistribution: {
    en: 'Property Distribution',
    vi: 'Phân Bố Tài Sản'
  },
  propertyDistributionDesc: {
    en: 'Distribution Of Properties By Type',
    vi: 'Phân Bố Tài Sản Theo Loại'
  },
  propertyTypes: {
    APARTMENT: {
      en: 'Apartment',
      vi: 'Căn Hộ'
    },
    HOUSE: {
      en: 'House',
      vi: 'Nhà Riêng'
    },
    VILLA: {
      en: 'Villa',
      vi: 'Biệt Thự'
    },
    LAND: {
      en: 'Land',
      vi: 'Đất'
    },
    OFFICE: {
      en: 'Office',
      vi: 'Văn Phòng'
    },
    SHOP: {
      en: 'Shop',
      vi: 'Cửa Hàng'
    },
    OTHER: {
      en: 'Other',
      vi: 'Khác'
    },
    apartment: {
      en: "Apartment",
      vi: "Căn hộ"
    },
    house: {
      en: "House",
      vi: "Nhà riêng"
    },
    land: {
      en: "Land",
      vi: "Đất"
    },
    office: {
      en: "Office",
      vi: "Văn phòng"
    },
    shop: {
      en: "Shop",
      vi: "Cửa hàng"
    },
    villa: {
      en: "Villa",
      vi: "Biệt thự"
    }
  },
  units: {
    en: 'units',
    vi: 'đơn vị'
  },
  alerts: {
    title: {
      en: "Alerts",
      vi: "Cảnh báo"
    },
    noAlerts: {
      en: "No alerts",
      vi: "Không có cảnh báo nào"
    }
  },
  months: {
    1: {
      en: "January",
      vi: "Tháng 1"
    },
    2: {
      en: "February",
      vi: "Tháng 2"
    },
    3: {
      en: "March",
      vi: "Tháng 3"
    },
    4: {
      en: "April",
      vi: "Tháng 4"
    },
    5: {
      en: "May",
      vi: "Tháng 5"
    },
    6: {
      en: "June",
      vi: "Tháng 6"
    },
    7: {
      en: "July",
      vi: "Tháng 7"
    },
    8: {
      en: "August",
      vi: "Tháng 8"
    },
    9: {
      en: "September",
      vi: "Tháng 9"
    },
    10: {
      en: "October",
      vi: "Tháng 10"
    },
    11: {
      en: "November",
      vi: "Tháng 11"
    },
    12: {
      en: "December",
      vi: "Tháng 12"
    }
  }
}; 