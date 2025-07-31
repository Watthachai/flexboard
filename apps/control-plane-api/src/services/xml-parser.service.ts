/**
 * Universal XML Parser for Node.js Server
 * รองรับ XML structure หลายรูปแบบ สำหรับ Control Plane API
 */

import { parseString, parseStringPromise, Builder } from "xml2js";

export interface XmlParseResult {
  records: Record<string, any>[];
  totalRecords: number;
  detectedStructure: string;
  rootElement: string;
  recordElement: string;
  availableColumns: string[];
  parseOptions: any;
}

export interface XmlParserOptions {
  maxRecords?: number;
  skipEmptyFields?: boolean;
  normalizeFieldNames?: boolean;
  explicitArray?: boolean;
  ignoreAttrs?: boolean;
}

export class UniversalXmlParser {
  /**
   * Parse XML content with automatic structure detection
   */
  static async parse(
    xmlContent: string,
    options: XmlParserOptions = {}
  ): Promise<XmlParseResult> {
    const {
      maxRecords = 1000,
      skipEmptyFields = true,
      normalizeFieldNames = true,
      explicitArray = false,
      ignoreAttrs = false,
    } = options;

    try {
      // Parse XML using xml2js
      const parseOptions = {
        explicitArray,
        ignoreAttrs,
        trim: true,
        explicitRoot: true,
        mergeAttrs: !ignoreAttrs,
      };

      const parsedXml = await parseStringPromise(xmlContent, parseOptions);

      // Detect structure and extract records
      const structureInfo = this.detectStructure(parsedXml);
      const records = this.extractRecords(parsedXml, structureInfo, {
        maxRecords,
        skipEmptyFields,
        normalizeFieldNames,
      });

      return {
        records,
        totalRecords: records.length,
        detectedStructure: structureInfo.type,
        rootElement: structureInfo.rootElement,
        recordElement: structureInfo.recordElement,
        availableColumns: this.extractColumns(records),
        parseOptions,
      };
    } catch (error) {
      throw new Error(
        `Failed to parse XML: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Detect XML structure patterns
   */
  private static detectStructure(parsedXml: any): any {
    const rootKeys = Object.keys(parsedXml);
    const rootKey = rootKeys[0];
    const rootData = parsedXml[rootKey];

    console.log("Root element:", rootKey);
    console.log("Root data keys:", Object.keys(rootData));

    // Pattern 1: GraphData/Dataset1 structure
    if (rootKey === "GraphData" && rootData.Dataset1) {
      return {
        type: "GraphData/Dataset1",
        rootElement: "GraphData",
        recordElement: "Dataset1",
        path: ["GraphData", "Dataset1"],
      };
    }

    // Pattern 2: Table/Row or similar structures
    const commonContainers = ["Table", "Records", "Items", "Data", "List"];
    const commonRecords = ["Row", "Record", "Item", "Entry", "Element"];

    for (const container of commonContainers) {
      for (const record of commonRecords) {
        if (rootData[record] && Array.isArray(rootData[record])) {
          return {
            type: `${rootKey}/${record}`,
            rootElement: rootKey,
            recordElement: record,
            path: [rootKey, record],
          };
        }
      }
    }

    // Pattern 3: Direct array of records under root
    const dataKeys = Object.keys(rootData);
    for (const key of dataKeys) {
      if (Array.isArray(rootData[key]) && rootData[key].length > 0) {
        // Check if array items are objects (records)
        const firstItem = rootData[key][0];
        if (typeof firstItem === "object" && firstItem !== null) {
          return {
            type: `${rootKey}/${key}`,
            rootElement: rootKey,
            recordElement: key,
            path: [rootKey, key],
          };
        }
      }
    }

    // Pattern 4: Repeated elements at root level
    const repeatedElements = dataKeys.filter((key) =>
      Array.isArray(rootData[key])
    );
    if (repeatedElements.length === 1) {
      const elementKey = repeatedElements[0];
      return {
        type: `${rootKey}/${elementKey}`,
        rootElement: rootKey,
        recordElement: elementKey,
        path: [rootKey, elementKey],
      };
    }

    // Pattern 5: Single record (root contains data directly)
    if (
      dataKeys.length > 0 &&
      !dataKeys.some((key) => Array.isArray(rootData[key]))
    ) {
      return {
        type: "Single Record",
        rootElement: rootKey,
        recordElement: rootKey,
        path: [rootKey],
      };
    }

    // Default: try first array found
    for (const key of dataKeys) {
      if (Array.isArray(rootData[key])) {
        return {
          type: `Generic/${key}`,
          rootElement: rootKey,
          recordElement: key,
          path: [rootKey, key],
        };
      }
    }

    throw new Error("Unable to detect XML structure");
  }

  /**
   * Extract records from parsed XML
   */
  private static extractRecords(
    parsedXml: any,
    structureInfo: any,
    options: Required<Omit<XmlParserOptions, "explicitArray" | "ignoreAttrs">>
  ): Record<string, any>[] {
    const records: Record<string, any>[] = [];

    try {
      // Navigate to the record array using the path
      let current = parsedXml;
      for (const pathElement of structureInfo.path) {
        current = current[pathElement];
        if (!current) {
          console.warn(`Path element '${pathElement}' not found`);
          return [];
        }
      }

      // Handle single record case
      if (!Array.isArray(current)) {
        const record = this.processRecord(current, options);
        if (Object.keys(record).length > 0) {
          records.push(record);
        }
        return records;
      }

      // Process array of records
      const limitedRecords = current.slice(0, options.maxRecords);

      limitedRecords.forEach((item: any, index: number) => {
        try {
          const record = this.processRecord(item, options);
          if (Object.keys(record).length > 0) {
            records.push(record);
          }
        } catch (error) {
          console.warn(`Error processing record ${index}:`, error);
        }
      });
    } catch (error) {
      console.error("Error extracting records:", error);
    }

    return records;
  }

  /**
   * Process individual record
   */
  private static processRecord(
    item: any,
    options: Required<Omit<XmlParserOptions, "explicitArray" | "ignoreAttrs">>
  ): Record<string, any> {
    const record: Record<string, any> = {};

    if (typeof item !== "object" || item === null) {
      return record;
    }

    Object.keys(item).forEach((key) => {
      const value = item[key];
      const processedKey = options.normalizeFieldNames
        ? this.normalizeFieldName(key)
        : key;

      let processedValue = value;

      // Handle different value types
      if (Array.isArray(value)) {
        // If array has one element, extract it
        if (value.length === 1) {
          processedValue = value[0];
        } else if (value.length > 1) {
          // Multiple values - join them or keep as array
          processedValue = value;
        } else {
          processedValue = "";
        }
      }

      // Handle nested objects
      if (typeof processedValue === "object" && processedValue !== null) {
        // For simple objects, try to extract text content
        if (processedValue._ !== undefined) {
          processedValue = processedValue._;
        } else {
          // Flatten simple nested structures
          const nestedKeys = Object.keys(processedValue);
          if (nestedKeys.length === 1) {
            processedValue = processedValue[nestedKeys[0]];
          }
        }
      }

      // Convert strings that look like numbers
      if (typeof processedValue === "string") {
        const trimmedValue = processedValue.trim();

        // Try to parse as number
        if (/^\d+\.?\d*$/.test(trimmedValue)) {
          const numValue = parseFloat(trimmedValue);
          if (!isNaN(numValue)) {
            processedValue = numValue;
          }
        }

        // Keep as string if it's not a number
        if (typeof processedValue === "string") {
          processedValue = trimmedValue;
        }
      }

      // Skip empty fields if option is set
      if (
        options.skipEmptyFields &&
        (!processedValue || processedValue === "")
      ) {
        return;
      }

      record[processedKey] = processedValue;
    });

    return record;
  }

  /**
   * Normalize field names
   */
  private static normalizeFieldName(name: string): string {
    return name
      .replace(/[@\-\s]/g, "_")
      .replace(/([A-Z])/g, (match, letter, index) =>
        index > 0 ? `_${letter.toLowerCase()}` : letter.toLowerCase()
      )
      .replace(/^_+|_+$/g, "")
      .replace(/_+/g, "_");
  }

  /**
   * Extract unique column names
   */
  private static extractColumns(records: Record<string, any>[]): string[] {
    const columnSet = new Set<string>();

    records.forEach((record) => {
      Object.keys(record).forEach((key) => {
        columnSet.add(key);
      });
    });

    return Array.from(columnSet).sort();
  }

  /**
   * Get sample data for preview
   */
  static getSampleData(
    parseResult: XmlParseResult,
    sampleSize: number = 5
  ): Record<string, any>[] {
    return parseResult.records.slice(0, sampleSize);
  }

  /**
   * Analyze XML structure without full parsing
   */
  static async analyzeStructure(xmlContent: string): Promise<any> {
    try {
      // Quick parse to get structure info
      const parsedXml = await parseStringPromise(xmlContent, {
        explicitArray: false,
        ignoreAttrs: false,
        trim: true,
        explicitRoot: true,
      });

      const rootKeys = Object.keys(parsedXml);
      const rootKey = rootKeys[0];
      const rootData = parsedXml[rootKey];

      const analysis = {
        rootElement: rootKey,
        rootKeys: Object.keys(rootData),
        possibleRecordElements: [] as string[],
        structure: "unknown",
      };

      // Find potential record containers
      Object.keys(rootData).forEach((key) => {
        if (Array.isArray(rootData[key])) {
          analysis.possibleRecordElements.push(key);
        }
      });

      if (analysis.possibleRecordElements.length > 0) {
        analysis.structure = "array-based";
      } else {
        analysis.structure = "single-record";
      }

      return analysis;
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : String(error),
        structure: "invalid",
      };
    }
  }
}
