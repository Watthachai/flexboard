/**
 * Dashboard Configuration Validator
 * ตรวจสอบความถูกต้องของ Dashboard Manifest JSON
 * รองรับ Schema Version 1.3 และ Advanced Features
 */

interface ValidationError {
  path?: string;
  message: string;
  line?: number;
  column?: number;
}

interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings?: ValidationError[];
}

interface ThemeConfig {
  dark?: boolean;
  brandColor?: string;
  radius?: string;
  statusColors?: {
    ok?: string;
    warning?: string;
    danger?: string;
  };
}

interface FormatterConfig {
  kind: "date" | "number" | "string";
  timezone?: string;
  pattern?: string;
  precision?: number;
  thousandsSep?: string;
  prefix?: string;
  suffix?: string;
}

interface DataSourceConfig {
  id: string;
  type: string;
  accept?: string[];
  fieldTypes?: Record<string, string>;
  dateParsing?: Record<string, string>;
  endpoint?: string;
  refreshInterval?: number;
}

interface TransformConfig {
  as: string;
  expr: string;
}

interface FilterConfig {
  field: string;
  op: string;
  value: any;
  description?: string;
}

interface UserFilterConfig {
  id: string;
  field: string;
  label: string;
  type: string;
  defaultValue?: any;
  options?: Array<{
    label: string;
    value: any;
    filter?: any;
  }>;
  description?: string;
  monthsBack?: number;
  autoGenerate?: boolean;
}

interface WidgetConfig {
  id: string;
  type: string;
  title: string;
  dataSource: string;
  query?: {
    columns?: string[];
    groupBy?: string[];
    measures?: Array<{
      field: string;
      agg: string;
      as: string;
    }>;
    filters?: FilterConfig[];
    sort?: Array<{
      field: string;
      dir: "asc" | "desc";
    }>;
  };
  display?: {
    widgetKind?: string;
    valueFormatter?: string;
    severityRules?: Array<{
      op: string;
      value: any;
      color: string;
    }>;
    searchable?: boolean;
    enableExportExcel?: boolean;
    stickyHeader?: boolean;
    stickyFirstColumns?: number;
    horizontalScroll?: boolean;
    rowVirtualization?: boolean;
    pageSize?: number;
    pageSizeOptions?: number[];
    columnGroups?: Array<{
      title: string;
      columns: string[];
    }>;
    columnLabels?: Record<string, string>;
    columnFormatters?: Record<string, string>;
    columnAlignment?: Record<string, string>;
    showTotalsRow?: boolean;
    totalsAgg?: Record<string, string>;
    rowClassRules?: Array<{
      when: {
        field: string;
        op: string;
        value: any;
      };
      className: string;
    }>;
  };
}

interface LayoutConfig {
  type: string;
  columns: number;
  rowHeight: number;
  desktop?: Array<{
    widgetId: string;
    x: number;
    y: number;
    width: number;
    height: number;
  }>;
  mobile?: Array<{
    widgetId: string;
  }>;
}

interface DashboardConfig {
  schemaVersion: string;
  dashboardId: string;
  dashboardName: string;
  description?: string;
  version: number;
  theme?: ThemeConfig;
  settings?: Record<string, any>;
  formatters?: Record<string, FormatterConfig>;
  dataSources: DataSourceConfig[];
  transforms?: TransformConfig[];
  globalFilters?: FilterConfig[];
  userFilters?: UserFilterConfig[];
  widgets: WidgetConfig[];
  layout: LayoutConfig;
  targetTeams?: string[];
}

/**
 * ตรวจสอบความถูกต้องของ JSON string
 */
export function validateConfigString(jsonString: string): ValidationResult {
  const errors: ValidationError[] = [];
  const warnings: ValidationError[] = [];

  // ขั้นตอนที่ 1: ตรวจสอบ JSON syntax
  let config: any;
  try {
    config = JSON.parse(jsonString);
  } catch (error) {
    if (error instanceof SyntaxError) {
      // พยายามหา line number จาก error message
      const match = error.message.match(/at position (\d+)/);
      const position = match ? parseInt(match[1]) : undefined;
      let line: number | undefined;
      let column: number | undefined;

      if (position !== undefined) {
        const lines = jsonString.substring(0, position).split("\n");
        line = lines.length;
        column = lines[lines.length - 1].length + 1;
      }

      errors.push({
        message: `JSON Syntax Error: ${error.message}`,
        line,
        column,
      });
    } else {
      errors.push({
        message: `Parse Error: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      });
    }

    return { valid: false, errors, warnings };
  }

  // ขั้นตอนที่ 2: ตรวจสอบ schema structure
  validateSchema(config, errors, warnings);

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * ตรวจสอบ schema structure
 */
function validateSchema(
  config: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  // Required fields
  const requiredFields = [
    "schemaVersion",
    "dashboardId",
    "dashboardName",
    "version",
    "dataSources",
    "widgets",
    "layout",
  ];

  for (const field of requiredFields) {
    if (!(field in config)) {
      errors.push({
        path: field,
        message: `Required field '${field}' is missing`,
      });
    }
  }

  // ตรวจสอบ schema version
  if (config.schemaVersion) {
    const supportedVersions = ["1.0", "1.1", "1.2", "1.3"];
    if (!supportedVersions.includes(config.schemaVersion)) {
      warnings.push({
        path: "schemaVersion",
        message: `Schema version '${
          config.schemaVersion
        }' may not be fully supported. Supported versions: ${supportedVersions.join(
          ", "
        )}`,
      });
    }
  }

  // ตรวจสอบ types
  if (config.schemaVersion && typeof config.schemaVersion !== "string") {
    errors.push({
      path: "schemaVersion",
      message: "schemaVersion must be a string",
    });
  }

  if (config.dashboardId && typeof config.dashboardId !== "string") {
    errors.push({
      path: "dashboardId",
      message: "dashboardId must be a string",
    });
  }

  if (config.version && typeof config.version !== "number") {
    errors.push({
      path: "version",
      message: "version must be a number",
    });
  }

  // ตรวจสอบ theme (optional)
  if (config.theme) {
    validateTheme(config.theme, errors, warnings);
  }

  // ตรวจสอบ formatters (optional)
  if (config.formatters) {
    validateFormatters(config.formatters, errors, warnings);
  }

  // ตรวจสอบ transforms (optional)
  if (config.transforms) {
    validateTransforms(config.transforms, errors, warnings);
  }

  // ตรวจสอบ globalFilters (optional)
  if (config.globalFilters) {
    validateFilters(config.globalFilters, "globalFilters", errors, warnings);
  }

  // ตรวจสอบ userFilters (optional)
  if (config.userFilters) {
    validateUserFilters(config.userFilters, errors, warnings);
  }

  // ตรวจสอบ layout
  if (config.layout) {
    validateLayout(config.layout, errors, warnings);
  }

  // ตรวจสอบ widgets
  if (config.widgets) {
    if (!Array.isArray(config.widgets)) {
      errors.push({
        path: "widgets",
        message: "widgets must be an array",
      });
    } else {
      config.widgets.forEach((widget: any, index: number) => {
        validateWidget(widget, `widgets[${index}]`, errors, warnings);
      });
    }
  }

  // ตรวจสอบ dataSources
  if (config.dataSources) {
    if (!Array.isArray(config.dataSources)) {
      errors.push({
        path: "dataSources",
        message: "dataSources must be an array",
      });
    } else {
      config.dataSources.forEach((dataSource: any, index: number) => {
        validateDataSource(
          dataSource,
          `dataSources[${index}]`,
          errors,
          warnings
        );
      });
    }
  }

  // Business logic validations
  validateBusinessLogic(config, errors, warnings);
}

/**
 * ตรวจสอบ theme configuration
 */
function validateTheme(
  theme: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (theme.brandColor && typeof theme.brandColor === "string") {
    if (!theme.brandColor.match(/^#[0-9a-fA-F]{6}$/)) {
      warnings.push({
        path: "theme.brandColor",
        message: "brandColor should be a valid hex color (e.g., #7c3aed)",
      });
    }
  }

  if (theme.statusColors) {
    ["ok", "warning", "danger"].forEach((status) => {
      if (
        theme.statusColors[status] &&
        !theme.statusColors[status].match(/^#[0-9a-fA-F]{6}$/)
      ) {
        warnings.push({
          path: `theme.statusColors.${status}`,
          message: `${status} color should be a valid hex color`,
        });
      }
    });
  }
}

/**
 * ตรวจสอบ formatters configuration
 */
function validateFormatters(
  formatters: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  Object.keys(formatters).forEach((key) => {
    const formatter = formatters[key];
    if (!formatter.kind) {
      errors.push({
        path: `formatters.${key}.kind`,
        message: "Formatter must have a kind field",
      });
    } else {
      const validKinds = ["date", "number", "string"];
      if (!validKinds.includes(formatter.kind)) {
        errors.push({
          path: `formatters.${key}.kind`,
          message: `Invalid formatter kind. Must be one of: ${validKinds.join(
            ", "
          )}`,
        });
      }
    }
  });
}

/**
 * ตรวจสอบ transforms configuration
 */
function validateTransforms(
  transforms: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!Array.isArray(transforms)) {
    errors.push({
      path: "transforms",
      message: "transforms must be an array",
    });
    return;
  }

  transforms.forEach((transform: any, index: number) => {
    if (!transform.as) {
      errors.push({
        path: `transforms[${index}].as`,
        message: 'Transform must have an "as" field',
      });
    }
    if (!transform.expr) {
      errors.push({
        path: `transforms[${index}].expr`,
        message: 'Transform must have an "expr" field',
      });
    }
  });
}

/**
 * ตรวจสอบ filters configuration
 */
function validateFilters(
  filters: any,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!Array.isArray(filters)) {
    errors.push({
      path: path,
      message: `${path} must be an array`,
    });
    return;
  }

  filters.forEach((filter: any, index: number) => {
    const filterPath = `${path}[${index}]`;

    // Field is always required
    if (!filter.field) {
      errors.push({
        path: `${filterPath}.field`,
        message: "Filter must have a field",
      });
    }

    // For globalFilters, op and value are optional (UI filters don't need them)
    // For other filters, op and value are required
    if (path === "globalFilters") {
      // UI filter: type is required, op and value are optional
      if (!filter.type && !filter.op) {
        errors.push({
          path: `${filterPath}.type`,
          message:
            "Global filter must have either type (for UI filters) or op (for automatic filters)",
        });
      }

      // If it has op, it must have value (automatic filter)
      if (filter.op && filter.value === undefined) {
        errors.push({
          path: `${filterPath}.value`,
          message: "Filter with operator must have a value",
        });
      }
    } else {
      // Standard filters: op and value are required
      if (!filter.op) {
        errors.push({
          path: `${filterPath}.op`,
          message: "Filter must have an operator (op)",
        });
      }
      if (filter.value === undefined) {
        errors.push({
          path: `${filterPath}.value`,
          message: "Filter must have a value",
        });
      }
    }
  });
}

/**
 * ตรวจสอบ user filters configuration
 */
function validateUserFilters(
  userFilters: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  if (!Array.isArray(userFilters)) {
    errors.push({
      path: "userFilters",
      message: "userFilters must be an array",
    });
    return;
  }

  userFilters.forEach((filter: any, index: number) => {
    const filterPath = `userFilters[${index}]`;
    const requiredFields = ["id", "field", "label", "type"];

    requiredFields.forEach((field) => {
      if (!filter[field]) {
        errors.push({
          path: `${filterPath}.${field}`,
          message: `User filter must have a ${field}`,
        });
      }
    });

    // ตรวจสอบ type ที่รองรับ
    if (filter.type) {
      const supportedTypes = [
        "select",
        "month-end-dropdown",
        "date-range",
        "text",
        "number",
      ];
      if (!supportedTypes.includes(filter.type)) {
        warnings.push({
          path: `${filterPath}.type`,
          message: `User filter type '${
            filter.type
          }' may not be supported. Supported types: ${supportedTypes.join(
            ", "
          )}`,
        });
      }
    }
  });
}

/**
 * ตรวจสอบ layout configuration
 */
function validateLayout(
  layout: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const requiredFields = ["type", "columns", "rowHeight"];

  for (const field of requiredFields) {
    if (!(field in layout)) {
      errors.push({
        path: `layout.${field}`,
        message: `Required field 'layout.${field}' is missing`,
      });
    }
  }

  if (
    layout.columns &&
    (typeof layout.columns !== "number" ||
      layout.columns < 1 ||
      layout.columns > 24)
  ) {
    errors.push({
      path: "layout.columns",
      message: "layout.columns must be a number between 1 and 24",
    });
  }

  if (
    layout.rowHeight &&
    (typeof layout.rowHeight !== "number" || layout.rowHeight < 10)
  ) {
    errors.push({
      path: "layout.rowHeight",
      message: "layout.rowHeight must be a number >= 10",
    });
  }

  // ตรวจสอบ desktop layout
  if (layout.desktop) {
    if (!Array.isArray(layout.desktop)) {
      errors.push({
        path: "layout.desktop",
        message: "layout.desktop must be an array",
      });
    } else {
      layout.desktop.forEach((item: any, index: number) => {
        const itemPath = `layout.desktop[${index}]`;
        const requiredFields = ["widgetId", "x", "y", "width", "height"];

        requiredFields.forEach((field) => {
          if (!(field in item)) {
            errors.push({
              path: `${itemPath}.${field}`,
              message: `Desktop layout item must have ${field}`,
            });
          }
        });
      });
    }
  }
}

/**
 * ตรวจสอบ widget configuration
 */
function validateWidget(
  widget: any,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const requiredFields = ["id", "type", "title", "dataSource"];

  for (const field of requiredFields) {
    if (!(field in widget)) {
      errors.push({
        path: `${path}.${field}`,
        message: `Required field '${field}' is missing`,
      });
    }
  }

  // ตรวจสอบ widget types
  const validWidgetTypes = [
    "kpi",
    "line-chart",
    "bar-chart",
    "pie-chart",
    "table",
    "text",
  ];
  if (widget.type && !validWidgetTypes.includes(widget.type)) {
    warnings.push({
      path: `${path}.type`,
      message: `Widget type '${
        widget.type
      }' is not in standard types: ${validWidgetTypes.join(", ")}`,
    });
  }

  // ตรวจสอบ query configuration
  if (widget.query) {
    if (widget.query.measures && !Array.isArray(widget.query.measures)) {
      errors.push({
        path: `${path}.query.measures`,
        message: "query.measures must be an array",
      });
    }

    if (widget.query.groupBy && !Array.isArray(widget.query.groupBy)) {
      errors.push({
        path: `${path}.query.groupBy`,
        message: "query.groupBy must be an array",
      });
    }

    if (widget.query.filters) {
      validateFilters(
        widget.query.filters,
        `${path}.query.filters`,
        errors,
        warnings
      );
    }
  }

  // ตรวจสอบ display configuration
  if (widget.display) {
    // ตรวจสอบ advanced table features
    if (widget.display.widgetKind === "AdvancedTableWidget") {
      if (
        widget.display.columnGroups &&
        !Array.isArray(widget.display.columnGroups)
      ) {
        errors.push({
          path: `${path}.display.columnGroups`,
          message: "columnGroups must be an array",
        });
      }

      if (
        widget.display.rowClassRules &&
        !Array.isArray(widget.display.rowClassRules)
      ) {
        errors.push({
          path: `${path}.display.rowClassRules`,
          message: "rowClassRules must be an array",
        });
      }
    }
  }
}

/**
 * ตรวจสอบ data source configuration
 */
function validateDataSource(
  dataSource: any,
  path: string,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  const requiredFields = ["id", "type"];

  for (const field of requiredFields) {
    if (!(field in dataSource)) {
      errors.push({
        path: `${path}.${field}`,
        message: `Required field '${field}' is missing`,
      });
    }
  }

  // ตรวจสอบ data source types
  const validTypes = ["local", "api", "xml", "csv", "json", "database"];
  if (dataSource.type && !validTypes.includes(dataSource.type)) {
    warnings.push({
      path: `${path}.type`,
      message: `Data source type '${
        dataSource.type
      }' may not be supported. Common types: ${validTypes.join(", ")}`,
    });
  }

  // ตรวจสอบ endpoint format สำหรับ api type
  if (
    dataSource.type === "api" &&
    dataSource.endpoint &&
    typeof dataSource.endpoint === "string"
  ) {
    if (!dataSource.endpoint.startsWith("/api/")) {
      warnings.push({
        path: `${path}.endpoint`,
        message: "API endpoint should typically start with /api/",
      });
    }
  }

  // ตรวจสอบ refreshInterval
  if (
    dataSource.refreshInterval &&
    (typeof dataSource.refreshInterval !== "number" ||
      dataSource.refreshInterval < 1000)
  ) {
    warnings.push({
      path: `${path}.refreshInterval`,
      message: "refreshInterval should be at least 1000ms (1 second)",
    });
  }
}

/**
 * ตรวจสอบ business logic
 */
function validateBusinessLogic(
  config: any,
  errors: ValidationError[],
  warnings: ValidationError[]
): void {
  // ตรวจสอบ widget references ใน layout
  if (config.layout && config.layout.desktop && config.widgets) {
    const widgetIds = config.widgets.map((w: any) => w.id);

    config.layout.desktop.forEach((layoutItem: any, index: number) => {
      if (layoutItem.widgetId && !widgetIds.includes(layoutItem.widgetId)) {
        errors.push({
          path: `layout.desktop[${index}].widgetId`,
          message: `Widget '${layoutItem.widgetId}' referenced in layout but not found in widgets`,
        });
      }
    });
  }

  // ตรวจสอบ data source references ใน widgets
  if (config.widgets && config.dataSources) {
    const dataSourceIds = config.dataSources.map((ds: any) => ds.id);

    config.widgets.forEach((widget: any, index: number) => {
      if (widget.dataSource && !dataSourceIds.includes(widget.dataSource)) {
        errors.push({
          path: `widgets[${index}].dataSource`,
          message: `Data source '${widget.dataSource}' referenced in widget '${widget.id}' but not found in dataSources`,
        });
      }
    });
  }

  // ตรวจสอบ duplicate IDs
  if (config.widgets && Array.isArray(config.widgets)) {
    const widgetIds = config.widgets.map((w: any) => w.id).filter(Boolean);
    const duplicateIds = widgetIds.filter(
      (id: string, index: number) => widgetIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      errors.push({
        path: "widgets",
        message: `Duplicate widget IDs found: ${[...new Set(duplicateIds)].join(
          ", "
        )}`,
      });
    }
  }

  if (config.dataSources && Array.isArray(config.dataSources)) {
    const dataSourceIds = config.dataSources
      .map((ds: any) => ds.id)
      .filter(Boolean);
    const duplicateIds = dataSourceIds.filter(
      (id: string, index: number) => dataSourceIds.indexOf(id) !== index
    );

    if (duplicateIds.length > 0) {
      errors.push({
        path: "dataSources",
        message: `Duplicate data source IDs found: ${[
          ...new Set(duplicateIds),
        ].join(", ")}`,
      });
    }
  }

  // ตรวจสอบ formatter references
  if (config.widgets && config.formatters) {
    const formatterIds = Object.keys(config.formatters);

    config.widgets.forEach((widget: any, widgetIndex: number) => {
      if (widget.display && widget.display.valueFormatter) {
        if (!formatterIds.includes(widget.display.valueFormatter)) {
          warnings.push({
            path: `widgets[${widgetIndex}].display.valueFormatter`,
            message: `Formatter '${widget.display.valueFormatter}' not found in formatters`,
          });
        }
      }

      if (widget.display && widget.display.columnFormatters) {
        Object.values(widget.display.columnFormatters).forEach(
          (formatter: any) => {
            if (
              typeof formatter === "string" &&
              !formatterIds.includes(formatter)
            ) {
              warnings.push({
                path: `widgets[${widgetIndex}].display.columnFormatters`,
                message: `Formatter '${formatter}' not found in formatters`,
              });
            }
          }
        );
      }
    });
  }
}

/**
 * สร้าง default dashboard config
 */
export function createDefaultConfig(
  dashboardId: string,
  tenantId: string
): DashboardConfig {
  return {
    schemaVersion: "1.3",
    dashboardId: dashboardId,
    dashboardName: dashboardId,
    description: "",
    version: 1,
    theme: {
      dark: false,
      brandColor: "#7c3aed",
      radius: "8px",
      statusColors: {
        ok: "#10b981",
        warning: "#f59e0b",
        danger: "#ef4444",
      },
    },
    formatters: {
      currency: {
        kind: "number",
        precision: 2,
        thousandsSep: ",",
        prefix: "฿",
      },
      number: {
        kind: "number",
        precision: 0,
        thousandsSep: ",",
      },
      date: {
        kind: "date",
        timezone: "Asia/Bangkok",
        pattern: "dd MMM yyyy",
      },
    },
    dataSources: [
      {
        id: "uploaded-xml-data",
        type: "local",
        accept: [".xml", ".csv", ".json"],
        fieldTypes: {},
        endpoint: `/api/tenants/${tenantId}/data`,
        refreshInterval: 300000,
      },
    ],
    widgets: [],
    layout: {
      type: "grid",
      columns: 12,
      rowHeight: 50,
      desktop: [],
      mobile: [],
    },
  };
}
