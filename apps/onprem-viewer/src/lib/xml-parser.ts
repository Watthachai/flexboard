/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Universal XML Parser Service for OnPrem Viewer
 * รองรับ XML structure หลายรูปแบบ
 */

export interface XmlParseResult {
  records: Record<string, any>[];
  totalRecords: number;
  detectedStructure: string;
  rootElement: string;
  recordElement: string;
  availableColumns: string[];
}

export interface XmlParserOptions {
  maxRecords?: number;
  skipEmptyFields?: boolean;
  normalizeFieldNames?: boolean;
}

export class UniversalXmlParser {
  /**
   * Parse XML content with automatic structure detection
   */
  static parse(
    xmlContent: string,
    options: XmlParserOptions = {}
  ): XmlParseResult {
    const {
      maxRecords = 1000,
      skipEmptyFields = true,
      normalizeFieldNames = true,
    } = options;

    try {
      // Parse XML to DOM
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");

      // Check for parse errors
      const parseError = xmlDoc.querySelector("parsererror");
      if (parseError) {
        throw new Error(`XML Parse Error: ${parseError.textContent}`);
      }

      // Detect XML structure
      const structureInfo = this.detectStructure(xmlDoc);

      // Extract records based on detected structure
      const records = this.extractRecords(xmlDoc, structureInfo, {
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
      };
    } catch (error) {
      throw new Error(
        `Failed to parse XML: ${
          error instanceof Error ? error.message : String(error)
        }`
      );
    }
  }

  /**
   * Detect XML structure patterns
   */
  private static detectStructure(xmlDoc: Document) {
    const root = xmlDoc.documentElement;
    const rootName = root.tagName;

    // Pattern 1: GraphData/Dataset1 (your current format)
    if (rootName === "GraphData") {
      const datasets = root.querySelectorAll("Dataset1");
      if (datasets.length > 0) {
        return {
          type: "GraphData/Dataset",
          rootElement: "GraphData",
          recordElement: "Dataset1",
          xpath: "//Dataset1",
        };
      }
    }

    // Pattern 2: Table/Row structure
    const tableRows = root.querySelectorAll("Table Row, table row");
    if (tableRows.length > 0) {
      return {
        type: "Table/Row",
        rootElement: root.tagName,
        recordElement: "Row",
        xpath: "//Row, //row",
      };
    }

    // Pattern 3: Records/Record structure
    const records = root.querySelectorAll("Records Record, records record");
    if (records.length > 0) {
      return {
        type: "Records/Record",
        rootElement: root.tagName,
        recordElement: "Record",
        xpath: "//Record, //record",
      };
    }

    // Pattern 4: Items/Item structure
    const items = root.querySelectorAll("Items Item, items item");
    if (items.length > 0) {
      return {
        type: "Items/Item",
        rootElement: root.tagName,
        recordElement: "Item",
        xpath: "//Item, //item",
      };
    }

    // Pattern 5: Data/Entry structure
    const entries = root.querySelectorAll("Data Entry, data entry");
    if (entries.length > 0) {
      return {
        type: "Data/Entry",
        rootElement: root.tagName,
        recordElement: "Entry",
        xpath: "//Entry, //entry",
      };
    }

    // Pattern 6: Generic repeated elements (find most common child element)
    const childElements = Array.from(root.children);
    const elementCounts = new Map<string, number>();

    childElements.forEach((child) => {
      const tagName = child.tagName.toLowerCase();
      elementCounts.set(tagName, (elementCounts.get(tagName) || 0) + 1);
    });

    // Find the most frequent child element (likely the record container)
    let mostCommonElement = "";
    let maxCount = 0;
    elementCounts.forEach((count, tagName) => {
      if (count > maxCount && count > 1) {
        maxCount = count;
        mostCommonElement = tagName;
      }
    });

    if (mostCommonElement && maxCount > 1) {
      return {
        type: `Generic/${mostCommonElement}`,
        rootElement: rootName,
        recordElement: mostCommonElement,
        xpath: `//${mostCommonElement}`,
      };
    }

    // Pattern 7: Single level structure (root contains data directly)
    const directChildren = Array.from(root.children);
    if (
      directChildren.length > 0 &&
      !directChildren.some((child) => child.children.length > 0)
    ) {
      return {
        type: "Flat/Single",
        rootElement: rootName,
        recordElement: rootName,
        xpath: `/${rootName}`,
      };
    }

    // Default: assume each direct child of root is a record
    return {
      type: "Generic/DirectChild",
      rootElement: rootName,
      recordElement: "*",
      xpath: `/${rootName}/*`,
    };
  }

  /**
   * Extract records based on detected structure
   */
  private static extractRecords(
    xmlDoc: Document,
    structureInfo: any,
    options: Required<XmlParserOptions>
  ): Record<string, any>[] {
    const records: Record<string, any>[] = [];
    let recordElements: Element[] = [];

    // Get record elements based on structure
    if (structureInfo.recordElement === "*") {
      // Get all direct children of root
      recordElements = Array.from(xmlDoc.documentElement.children);
    } else if (structureInfo.type === "Flat/Single") {
      // Single record (root element itself)
      recordElements = [xmlDoc.documentElement];
    } else {
      // Use querySelector to find record elements
      const selector = structureInfo.recordElement;
      recordElements = Array.from(xmlDoc.querySelectorAll(selector));
    }

    // Process each record element
    recordElements.slice(0, options.maxRecords).forEach((element) => {
      const record = this.elementToRecord(element, options);
      if (Object.keys(record).length > 0) {
        records.push(record);
      }
    });

    return records;
  }

  /**
   * Convert XML element to record object
   */
  private static elementToRecord(
    element: Element,
    options: Required<XmlParserOptions>
  ): Record<string, any> {
    const record: Record<string, any> = {};

    // Process child elements
    Array.from(element.children).forEach((child) => {
      const fieldName = options.normalizeFieldNames
        ? this.normalizeFieldName(child.tagName)
        : child.tagName;

      let value: any;

      if (child.children.length === 0) {
        // Text content
        value = child.textContent?.trim() || "";
      } else {
        // Nested structure - for now, just get text content
        value = child.textContent?.trim() || "";
      }

      // Skip empty fields if requested
      if (options.skipEmptyFields && (!value || value === "")) {
        return;
      }

      // Try to convert to number if it looks like a number
      if (typeof value === "string" && value !== "") {
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          value = numValue;
        }
      }

      record[fieldName] = value;
    });

    // Also check for attributes
    Array.from(element.attributes).forEach((attr) => {
      const fieldName = options.normalizeFieldNames
        ? this.normalizeFieldName(`@${attr.name}`)
        : `@${attr.name}`;

      let value: any = attr.value;

      // Try to convert to number
      if (typeof value === "string" && value !== "") {
        const numValue = Number(value);
        if (!isNaN(numValue) && isFinite(numValue)) {
          value = numValue;
        }
      }

      record[fieldName] = value;
    });

    return record;
  }

  /**
   * Normalize field names for consistency
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
   * Extract unique column names from records
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
   * Get structure information for debugging
   */
  static getStructureInfo(xmlContent: string): any {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(xmlContent, "text/xml");
      const structureInfo = this.detectStructure(xmlDoc);

      return {
        ...structureInfo,
        rootElementCount: 1,
        recordElementCount: xmlDoc.querySelectorAll(structureInfo.recordElement)
          .length,
        sampleRecord:
          xmlDoc
            .querySelector(structureInfo.recordElement)
            ?.outerHTML?.substring(0, 200) + "...",
      };
    } catch (error) {
      return { error: error instanceof Error ? error.message : String(error) };
    }
  }
}
