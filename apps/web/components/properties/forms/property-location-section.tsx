"use client";

import * as React from "react";
import { UseFormReturn } from "react-hook-form";
import { 
  FormControl, 
  FormDescription, 
  FormField, 
  FormItem, 
  FormLabel, 
  FormMessage 
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormData } from "@/lib/schemas/property.schema";
import { useLocale } from '@/lib/i18n/client';

interface PropertyLocationSectionProps {
  form: UseFormReturn<PropertyFormData>;
  getFieldDescription: (fieldName: keyof PropertyFormData) => string;
}

export function PropertyLocationSection({ form, getFieldDescription }: PropertyLocationSectionProps) {
  const { t } = useLocale();
  
  // Helper to render required indicator
  const requiredIndicator = <span className="text-red-500">*</span>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('properties.form.sections.location.title')}</CardTitle>
        <CardDescription>{t('properties.form.sections.location.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="address"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('properties.form.fields.address.label')} {requiredIndicator}</FormLabel>
              <FormControl>
                <Input placeholder={t('properties.form.fields.address.placeholder')} {...field} />
              </FormControl>
              <FormDescription>{getFieldDescription('address')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="city"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.city.label')} {requiredIndicator}</FormLabel>
                <FormControl>
                  <Input placeholder={t('properties.form.fields.city.placeholder')} {...field} />
                </FormControl>
                <FormDescription>{getFieldDescription('city')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="district"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.district.label')} {requiredIndicator}</FormLabel>
                <FormControl>
                  <Input placeholder={t('properties.form.fields.district.placeholder')} {...field} />
                </FormControl>
                <FormDescription>{getFieldDescription('district')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="ward"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.ward.label')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('properties.form.fields.ward.placeholder')} {...field} />
                </FormControl>
                <FormDescription>
                  {t('properties.form.fields.ward.description')} {getFieldDescription('ward')}
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
} 