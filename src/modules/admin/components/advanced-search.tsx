"use client";

import { Filter, Search, X } from "lucide-react";
import { useCallback, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

export interface SearchField {
    key: string;
    label: string;
    type: "text" | "select" | "date" | "number";
    placeholder?: string;
    options?: { value: string; label: string }[];
    operator?: "contains" | "eq" | "gt" | "lt" | "gte" | "lte";
}

export type SearchFieldValue = string | number | null | undefined;

export interface AdvancedSearchProps {
    fields: SearchField[];
    values: Record<string, SearchFieldValue>;
    onChange: (values: Record<string, SearchFieldValue>) => void;
    onSearch: () => void;
    onReset: () => void;
    className?: string;
}

export function AdvancedSearch({
    fields,
    values,
    onChange,
    onSearch,
    onReset,
    className,
}: AdvancedSearchProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    const handleFieldChange = useCallback(
        (key: string, value: SearchFieldValue) => {
            onChange({
                ...values,
                [key]: value,
            });

            // Count active filters
            const count = Object.entries({ ...values, [key]: value }).filter(
                ([_k, v]) => v !== undefined && v !== null && v !== "",
            ).length;
            setActiveFiltersCount(count);
        },
        [values, onChange],
    );

    const handleClearFilter = useCallback(
        (key: string) => {
            const newValues = { ...values };
            delete newValues[key];
            onChange(newValues);
            setActiveFiltersCount((prev) => Math.max(0, prev - 1));
        },
        [values, onChange],
    );

    const handleReset = useCallback(() => {
        onChange({});
        setActiveFiltersCount(0);
        onReset();
    }, [onChange, onReset]);

    const renderField = (field: SearchField, fieldId: string) => {
        const value = values[field.key];

        switch (field.type) {
            case "select":
                return (
                    <Select
                        value={value || ""}
                        onValueChange={(val) =>
                            handleFieldChange(field.key, val)
                        }
                    >
                        <SelectTrigger id={fieldId}>
                            <SelectValue
                                placeholder={
                                    field.placeholder || `选择${field.label}`
                                }
                            />
                        </SelectTrigger>
                        <SelectContent>
                            {field.options?.map((option) => (
                                <SelectItem
                                    key={option.value}
                                    value={option.value}
                                >
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                );

            case "date":
                return (
                    <Input
                        id={fieldId}
                        type="date"
                        value={value || ""}
                        onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                    />
                );

            case "number":
                return (
                    <Input
                        id={fieldId}
                        type="number"
                        value={value || ""}
                        onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder}
                    />
                );

            default:
                return (
                    <Input
                        id={fieldId}
                        value={value || ""}
                        onChange={(e) =>
                            handleFieldChange(field.key, e.target.value)
                        }
                        placeholder={field.placeholder || `搜索${field.label}`}
                    />
                );
        }
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Main search bar */}
            <div className="flex items-center gap-2">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                        placeholder="搜索..."
                        value={values.search || ""}
                        onChange={(e) =>
                            handleFieldChange("search", e.target.value)
                        }
                        className="pl-9"
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                onSearch();
                            }
                        }}
                    />
                </div>
                <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="gap-2"
                >
                    <Filter className="h-4 w-4" />
                    高级筛选
                    {activeFiltersCount > 0 && (
                        <Badge variant="secondary" className="h-5 px-1 text-xs">
                            {activeFiltersCount}
                        </Badge>
                    )}
                </Button>
                <Button type="button" onClick={onSearch}>
                    搜索
                </Button>
            </div>

            {/* Advanced filters */}
            {isExpanded && (
                <div className="rounded-lg border bg-muted/30 p-4">
                    <div className="mb-4 flex items-center justify-between">
                        <h4 className="text-sm font-medium">高级筛选</h4>
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleReset}
                        >
                            重置所有
                        </Button>
                    </div>

                    {/* Active filters */}
                    {activeFiltersCount > 0 && (
                        <div className="mb-4 flex flex-wrap gap-2">
                            {Object.entries(values).map(([key, value]) => {
                                if (!value) return null;
                                const field = fields.find((f) => f.key === key);
                                return (
                                    <Badge
                                        key={key}
                                        variant="secondary"
                                        className="gap-1"
                                    >
                                        {field?.label || key}: {String(value)}
                                        <X
                                            className="h-3 w-3 cursor-pointer"
                                            onClick={() =>
                                                handleClearFilter(key)
                                            }
                                        />
                                    </Badge>
                                );
                            })}
                        </div>
                    )}

                    {/* Filter fields */}
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {fields
                            .filter((field) => field.key !== "search")
                            .map((field) => (
                                <div key={field.key} className="space-y-2">
                                    <label
                                        className="text-sm font-medium"
                                        htmlFor={`advanced-search-${field.key}`}
                                    >
                                        {field.label}
                                    </label>
                                    {renderField(
                                        field,
                                        `advanced-search-${field.key}`,
                                    )}
                                </div>
                            ))}
                    </div>
                </div>
            )}
        </div>
    );
}
