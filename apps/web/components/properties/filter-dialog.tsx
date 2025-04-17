import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PropertyStatus, PropertyType } from "@/lib/types"
import { SlidersHorizontal, Filter } from "lucide-react"
import { cn } from "@/lib/utils"
import { useLocale } from "@/lib/i18n/client"

export interface FilterOptions {
  type?: PropertyType | "ALL"
  status?: PropertyStatus | "ALL"
  sortBy?: "price" | "area" | "createdAt" | "ALL"
  sortOrder?: "asc" | "desc"
}

export interface FilterDialogProps {
  onFilterChange: (filters: FilterOptions) => void
  currentFilters: FilterOptions
  isLoading?: boolean
}

export function FilterDialog({
  onFilterChange,
  currentFilters,
  isLoading = false
}: FilterDialogProps) {
  const { t } = useLocale();
  const [open, setOpen] = useState(false)
  const [filters, setFilters] = useState<FilterOptions>(currentFilters)

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    const newFilters = { 
      ...filters, 
      [key]: value === "ALL" ? undefined : value 
    }
    setFilters(newFilters)
  }

  const handleClearAll = () => {
    const clearedFilters: FilterOptions = {}
    setFilters(clearedFilters)
    onFilterChange(clearedFilters)
    setOpen(false)
  }

  const handleApplyFilters = () => {
    onFilterChange(filters)
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="h-8" disabled={isLoading}>
          <Filter className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")} />
          <span>{t('properties.filter.button')}</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="fixed left-[50%] top-[50%] translate-x-[-50%] translate-y-[-50%] max-w-[425px] rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-2xl p-0 overflow-hidden animate-in zoom-in-95 duration-200">
        <DialogHeader className="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-900">
          <DialogTitle className="text-xl font-semibold text-gray-800 dark:text-gray-100">
            {t('properties.filter.title')}
          </DialogTitle>
          <DialogDescription>
            {t('properties.filter.description')}
          </DialogDescription>
        </DialogHeader>

        <div className="p-4 flex flex-col gap-6 bg-white dark:bg-gray-900">
          {/* Property Type Filter */}
          <div className="space-y-2">
            <Label htmlFor="type" className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {t('properties.filter.propertyType')}
            </Label>
            <Select
              value={filters.type || "ALL"}
              onValueChange={(value: string) => handleFilterChange("type", value)}
            >
              <SelectTrigger className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <SelectValue placeholder={t('properties.filter.allTypes')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl z-[51]">
                <SelectGroup className="bg-white dark:bg-gray-900">
                  <SelectItem value="ALL" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.allTypes')}</SelectItem>
                  {Object.values(PropertyType).map((type) => (
                    <SelectItem key={type} value={type} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      {t(`properties.types.${type.toLowerCase()}`)}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Status Filter */}
          <div className="space-y-2">
            <Label htmlFor="status" className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {t('properties.filter.status')}
            </Label>
            <Select
              value={filters.status || "ALL"}
              onValueChange={(value: string) => handleFilterChange("status", value)}
            >
              <SelectTrigger className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <SelectValue placeholder={t('properties.filter.allStatuses')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl z-[51]">
                <SelectGroup className="bg-white dark:bg-gray-900">
                  <SelectItem value="ALL" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.allStatuses')}</SelectItem>
                  {Object.values(PropertyStatus).map((status) => (
                    <SelectItem key={status} value={status} className="hover:bg-gray-100 dark:hover:bg-gray-800">
                      <div className="flex items-center">
                        <div className={`h-2 w-2 rounded-full mr-2 ${getStatusColor(status)}`} />
                        {t(`properties.statuses.${status.toLowerCase()}`)}
                      </div>
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Options */}
          <div className="space-y-2">
            <Label htmlFor="sortBy" className="text-sm font-medium text-gray-800 dark:text-gray-100">
              {t('properties.filter.sortBy')}
            </Label>
            <Select
              value={filters.sortBy || "ALL"}
              onValueChange={(value: string) => handleFilterChange("sortBy", value)}
            >
              <SelectTrigger className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                <SelectValue placeholder={t('properties.filter.default')} />
              </SelectTrigger>
              <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl z-[51]">
                <SelectGroup className="bg-white dark:bg-gray-900">
                  <SelectItem value="ALL" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.default')}</SelectItem>
                  <SelectItem value="price" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.price')}</SelectItem>
                  <SelectItem value="area" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.area')}</SelectItem>
                  <SelectItem value="createdAt" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.listingDate')}</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          {/* Sort Direction */}
          {filters.sortBy && filters.sortBy !== "ALL" && (
            <div className="space-y-2 transition-all duration-200 animate-in fade-in-0 slide-in-from-top-5">
              <Label htmlFor="sortOrder" className="text-sm font-medium text-gray-800 dark:text-gray-100">
                {t('properties.filter.sortOrder')}
              </Label>
              <Select
                value={filters.sortOrder || "asc"}
                onValueChange={(value: string) => handleFilterChange("sortOrder", value)}
              >
                <SelectTrigger className="w-full border border-gray-200 dark:border-gray-700 rounded-lg p-2 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors duration-200">
                  <SelectValue placeholder={t('properties.filter.ascending')} />
                </SelectTrigger>
                <SelectContent className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl z-[51]">
                  <SelectGroup className="bg-white dark:bg-gray-900">
                    <SelectItem value="asc" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.ascending')}</SelectItem>
                    <SelectItem value="desc" className="hover:bg-gray-100 dark:hover:bg-gray-800">{t('properties.filter.descending')}</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              onClick={handleClearAll}
              className="flex-1 border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-200"
            >
              {t('properties.filter.clearAll')}
            </Button>
            <Button
              onClick={handleApplyFilters}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground transition-colors duration-200"
            >
              {t('properties.filter.applyFilters')}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function getStatusColor(status: PropertyStatus) {
  // Sử dụng switch-case thay vì object indexing để tránh lỗi TypeScript
  switch (status) {
    case PropertyStatus.AVAILABLE:
      return "bg-green-500";
    case PropertyStatus.OCCUPIED:
      return "bg-blue-500";
    case PropertyStatus.UNDER_MAINTENANCE:
      return "bg-amber-500";
    case PropertyStatus.INACTIVE:
    default:
      return "bg-gray-500";
  }
} 
