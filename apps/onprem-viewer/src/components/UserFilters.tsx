import React from "react";

interface UserFilterOption {
  label: string;
  value: string;
  filter: any;
}

interface UserFilter {
  id: string;
  field: string;
  label: string;
  type: "select";
  defaultValue: string;
  options: UserFilterOption[];
}

interface UserFiltersProps {
  filters: UserFilter[];
  values: Record<string, string>;
  onChange: (filterId: string, value: string) => void;
}

const UserFilters: React.FC<UserFiltersProps> = ({
  filters,
  values,
  onChange,
}) => {
  if (!filters || filters.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
      {filters.map((filter) => (
        <div key={filter.id} className="flex items-center gap-2">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {filter.label}:
          </label>
          <select
            value={values[filter.id] || filter.defaultValue}
            onChange={(e) => onChange(filter.id, e.target.value)}
            className="text-sm border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500 min-w-[200px]"
          >
            {filter.options?.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            )) || []}
          </select>
        </div>
      ))}
    </div>
  );
};

export default UserFilters;
