/**
 * Units translations
 * Các bản dịch cho tính năng quản lý đơn vị cho thuê
 */

export const unitsTranslations = {
  // Common
  title: {
    en: 'Units',
    vi: 'Đơn Vị Cho Thuê'
  },
  
  // Property Detail
  propertyDetail: {
    tabs: {
      unitsDescription: {
        en: 'Manage All Rental Units Or Rooms For This Property',
        vi: 'Quản Lý Tất Cả Các Đơn Vị Cho Thuê Của Bất Động Sản Này'
      },
      unitsWithCount: {
        en: 'Units ({{count}})',
        vi: 'Đơn Vị ({{count}})'
      }
    }
  },
  
  // List
  list: {
    title: {
      en: 'Units List',
      vi: 'Danh Sách Đơn Vị'
    },
    loading: {
      en: 'Loading Units...',
      vi: 'Đang Tải Danh Sách Đơn Vị...'
    },
    error: {
      en: 'Error Loading Units: {{message}}',
      vi: 'Lỗi Khi Tải Danh Sách Đơn Vị: {{message}}'
    },
    tryAgain: {
      en: 'Please Try Again or Refresh the Page.',
      vi: 'Vui lòng Thử Lại Hoặc Làm Mới Trang.'
    },
    noData: {
      en: 'No Rental Units Available.',
      vi: 'Chưa Có Đơn Vị Cho Thuê nào.'
    },
    search: {
      placeholder: {
        en: 'Search By Name...',
        vi: 'Tìm Kiếm Theo Tên...'
      }
    },
    filter: {
      allStatuses: {
        en: 'All Statuses',
        vi: 'Tất Cả Trạng Thái'
      }
    },
    table: {
      columns: {
        name: {
          en: 'Unit Name',
          vi: 'Tên Đơn Vị'
        },
        area: {
          en: 'Area',
          vi: 'Diện Tích'
        },
        rooms: {
          en: 'Rooms',
          vi: 'Phòng'
        },
        status: {
          en: 'Status',
          vi: 'Trạng Thái'
        },
        price: {
          en: 'Rental Price',
          vi: 'Giá Thuê'
        },
        actions: {
          en: 'Actions',
          vi: 'Thao Tác'
        }
      },
      roomsFormat: {
        en: '{{bedrooms}} BR, {{bathrooms}} BA',
        vi: '{{bedrooms}} PN, {{bathrooms}} WC'
      }
    },
    pagination: {
      goToPage: {
        en: 'Go To Page',
        vi: 'Đi Đến Trang'
      },
      showing: {
        en: 'Showing {{shown}} / {{total}} units',
        vi: 'Hiển thị {{shown}} / {{total}} đơn vị'
      },
      previous: {
        en: 'Previous',
        vi: 'Trước'
      },
      next: {
        en: 'Next',
        vi: 'Sau'
      },
      page: {
        en: '{{current}} / {{total}}',
        vi: '{{current}} / {{total}}'
      }
    }
  },
  
  // Status
  status: {
    vacant: {
      en: 'Vacant',
      vi: 'Còn Trống'
    },
    occupied: {
      en: 'Occupied',
      vi: 'Đã Thuê'
    },
    maintenance: {
      en: 'Maintenance',
      vi: 'Bảo Trì'
    },
    reserved: {
      en: 'Reserved',
      vi: 'Đã Đặt Cọc'
    },
    inactive: {
      en: 'Inactive',
      vi: 'Không Hoạt Động'
    }
  },
  
  // Actions
  actions: {
    sendBill: {
      en: 'Send Bill',
      vi: 'Gửi Hóa Đơn'
    },
    add: {
      en: 'Add',
      vi: 'Thêm'
    },
    view: {
      en: 'View',
      vi: 'Xem'
    },
    edit: {
      en: 'Edit',
      vi: 'Sửa'
    },
    delete: {
      en: 'Delete',
      vi: 'Xóa'
    },
    confirmDelete: {
      en: 'Are You Sure You Want To Delete This Unit?',
      vi: 'Bạn Có Chắc Chắn Muốn Xóa Đơn Vị Này Không?'
    }
  }
};
