import React from 'react';
import { ChevronDown, LogOut, Settings, User as UserIcon } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';

interface UserProfileProps {
  user: any; // Sử dụng any để tránh lỗi type mismatch, sau này có thể thay bằng kiểu User chính xác
  onSignOut?: () => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ user, onSignOut }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  // Xử lý click bên ngoài để đóng dropdown
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const displayName = user?.name || 'Người Dùng';
  const firstLetter = displayName.charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        className="flex items-center gap-2 p-1 pl-2 pr-3 rounded-full transition-colors hover:bg-gray-100 dark:hover:bg-gray-800"
        onClick={() => setIsOpen(!isOpen)}
      >
        {user?.image ? (
          <Image
            src={user.image}
            alt={displayName}
            width={36}
            height={36}
            className="rounded-full object-cover border border-gray-200 dark:border-gray-700"
          />
        ) : (
          <div className="w-9 h-9 rounded-full bg-indigo-600 flex items-center justify-center text-white font-medium text-sm">
            {firstLetter}
          </div>
        )}
        <span className="text-sm font-medium max-w-[140px] truncate hidden sm:block">
          {displayName}
        </span>
        <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-900 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
          <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
            <p className="text-sm font-medium">{displayName}</p>
            {user?.email && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 truncate">{user.email}</p>
            )}
          </div>

          <div className="py-1">
            <Link
              href="/profile"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              <UserIcon size={16} />
              <span>Hồ sơ của tôi</span>
            </Link>
            <Link
              href="/settings"
              className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => setIsOpen(false)}
            >
              <Settings size={16} />
              <span>Cài đặt</span>
            </Link>
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 py-1">
            <button
              className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              onClick={() => {
                onSignOut?.();
                setIsOpen(false);
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserProfile;
