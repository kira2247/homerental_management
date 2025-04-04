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
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { PropertyFormData } from "@/lib/schemas/property.schema";
import { useLocale } from '@/lib/i18n/client';

interface PropertyUtilitiesSectionProps {
  form: UseFormReturn<PropertyFormData>;
  getFieldDescription: (fieldName: keyof PropertyFormData) => string;
}

export function PropertyUtilitiesSection({ form, getFieldDescription }: PropertyUtilitiesSectionProps) {
  const { t } = useLocale();
  
  // Helper to render required indicator
  const requiredIndicator = <span className="text-red-500">*</span>;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('properties.form.sections.utilities.title')}</CardTitle>
        <CardDescription>{t('properties.form.sections.utilities.description')}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <FormField
            control={form.control}
            name="defaultElectricityRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.defaultElectricityRate.label')} {requiredIndicator}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder={t('properties.form.fields.defaultElectricityRate.placeholder')} 
                    {...field}
                    onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormDescription>{getFieldDescription('defaultElectricityRate')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultWaterRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.defaultWaterRate.label')} {requiredIndicator}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder={t('properties.form.fields.defaultWaterRate.placeholder')} 
                    {...field} 
                    onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormDescription>{getFieldDescription('defaultWaterRate')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultInternetRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.defaultInternetRate.label')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder={t('properties.form.fields.defaultInternetRate.placeholder')} 
                    {...field} 
                    onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormDescription>{getFieldDescription('defaultInternetRate')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="defaultGarbageRate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.defaultGarbageRate.label')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder={t('properties.form.fields.defaultGarbageRate.placeholder')} 
                    {...field} 
                    onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormDescription>{getFieldDescription('defaultGarbageRate')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <FormField
            control={form.control}
            name="hasSecurity"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t('properties.form.fields.hasSecurity.label')}
                  </FormLabel>
                  <FormDescription>
                    {getFieldDescription('hasSecurity')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hasElevator"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t('properties.form.fields.hasElevator.label')}
                  </FormLabel>
                  <FormDescription>
                    {getFieldDescription('hasElevator')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="hasParking"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    {t('properties.form.fields.hasParking.label')}
                  </FormLabel>
                  <FormDescription>
                    {getFieldDescription('hasParking')}
                  </FormDescription>
                </div>
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
              </FormItem>
            )}
          />
        </div>

        {/* Show parking fee only if hasParking is true */}
        {form.watch("hasParking") && (
          <FormField
            control={form.control}
            name="parkingFee"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('properties.form.fields.parkingFee.label')}</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    min="0" 
                    placeholder={t('properties.form.fields.parkingFee.placeholder')} 
                    {...field} 
                    onChange={e => field.onChange(e.target.valueAsNumber || 0)}
                  />
                </FormControl>
                <FormDescription>{getFieldDescription('parkingFee')}</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
        )}
      </CardContent>
    </Card>
  );
} 