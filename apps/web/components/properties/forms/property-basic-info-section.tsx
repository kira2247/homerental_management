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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormData } from "@/lib/schemas/property.schema";
import { PropertyType, PropertyStatus } from "@/lib/api/types";
import { useLocale } from '@/lib/i18n/client';

interface PropertyBasicInfoSectionProps {
  form: UseFormReturn<PropertyFormData>;
  getFieldDescription: (fieldName: keyof PropertyFormData) => string;
}

export function PropertyBasicInfoSection({ form, getFieldDescription }: PropertyBasicInfoSectionProps) {
  const { t } = useLocale();
  
  // Helper to render required indicator
  const requiredIndicator = <span className="text-red-500">*</span>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('properties.form.sections.basic.title')}</CardTitle>
        <CardDescription>{t('properties.form.sections.basic.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('properties.form.fields.name.label')} {requiredIndicator}</FormLabel>
              <FormControl>
                <Input placeholder={t('properties.form.fields.name.placeholder')} {...field} />
              </FormControl>
              <FormDescription>{getFieldDescription('name')}</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <FormField
            control={form.control}
            name="type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.type.label')} {requiredIndicator}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('properties.form.fields.type.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PropertyType).map((type) => (
                      <SelectItem key={type} value={type}>{t(`properties.types.${type.toLowerCase()}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{getFieldDescription('type')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="status"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.status.label')} {requiredIndicator}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('properties.form.fields.status.placeholder')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(PropertyStatus).map((status) => (
                      <SelectItem key={status} value={status}>
                        {t(`properties.statuses.${status.toLowerCase()}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormDescription>{getFieldDescription('status')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </CardContent>
    </Card>
  );
} 