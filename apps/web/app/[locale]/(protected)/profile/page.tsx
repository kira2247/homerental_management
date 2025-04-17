'use client';

import React from 'react';
import { useState, useEffect } from 'react';
import { useAuth } from '@/lib/auth/auth-context';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { profileSchema, ProfileFormData } from '@/lib/schemas';

import { Form } from '@/components/ui/form';
import { FormInput } from '@/components/ui/form-input';



export default function ProfilePage() {
  const { user, isLoading, error: authError, updateUser, clearError } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Khởi tạo form với react-hook-form và zod validation
  const form = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      email: '',
    },
  });

  // Xóa thông báo lỗi khi component unmount
  useEffect(() => {
    return () => {
      clearError();
    };
  }, [clearError]);

  // Cập nhật form values khi user được tải
  useEffect(() => {
    if (user) {
      form.reset({
        name: user.name,
        email: user.email,
      });
    }
  }, [user, form]);

  // Hiển thị lỗi từ auth context
  useEffect(() => {
    if (authError) {
      setError(authError);
    }
  }, [authError]);

  // Xử lý submit form
  const onSubmit = async (data: ProfileFormData) => {
    setError(null);
    setSuccessMessage(null);
    
    try {
      await updateUser(data);
      setSuccessMessage('Cập nhật thông tin thành công');
      setIsEditing(false);
    } catch (error) {
      console.error('Lỗi khi cập nhật thông tin:', error);
      setError(error instanceof Error ? error.message : 'Có lỗi xảy ra khi cập nhật thông tin');
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[70vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          Bạn cần đăng nhập để xem trang này.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-6 dark:text-white">Thông tin người dùng</h1>
        
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}
        
        {successMessage && (
          <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
            {successMessage}
          </div>
        )}
        
        {isEditing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormInput
                name="name"
                label="Họ và tên"
                placeholder="Nhập họ và tên"
                required
              />
              
              <FormInput
                name="email"
                label="Email"
                type="email"
                placeholder="Nhập địa chỉ email"
                required
              />
              
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                  disabled={form.formState.isSubmitting}
                >
                  {form.formState.isSubmitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white dark:border-gray-600 dark:hover:bg-gray-600 disabled:opacity-50"
                  disabled={form.formState.isSubmitting}
                >
                  Hủy
                </button>
              </div>
            </form>
          </Form>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1 font-medium text-gray-700 dark:text-gray-300">Họ và tên</div>
              <div className="md:col-span-2 text-gray-900 dark:text-white">{user.name}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1 font-medium text-gray-700 dark:text-gray-300">Email</div>
              <div className="md:col-span-2 text-gray-900 dark:text-white">{user.email}</div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="md:col-span-1 font-medium text-gray-700 dark:text-gray-300">Vai trò</div>
              <div className="md:col-span-2 text-gray-900 dark:text-white">
                {user.role === 'SUPER_ADMIN' ? 'Quản trị viên' : 'Chủ nhà'}
              </div>
            </div>
            
            <div className="mt-6">
              <button
                onClick={() => setIsEditing(true)}
                className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Chỉnh sửa
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 