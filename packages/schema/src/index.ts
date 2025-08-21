import Ajv, { ErrorObject } from "ajv";
import addFormats from "ajv-formats";
import schema from "../dashboard_config.schema.json";

// ใช้ draft 2019-09 แทน draft-07 เพื่อให้ compatible กับ Ajv v8
const ajv = new Ajv({
  allErrors: true,
  strict: false,
  validateSchema: false, // ปิดการ validate schema เพื่อหลีกเลี่ยง draft-07 issue
});
addFormats(ajv);

// ลงทะเบียน schema
ajv.addSchema(schema, "dashboard-config");

export type ValidateResult =
  | { valid: true }
  | { valid: false; errors: { path: string; message: string }[] };

/**
 * ตรวจสอบความถูกต้องของ dashboard config
 * @param config - Object ที่ต้องการตรวจสอบ
 * @returns ผลการตรวจสอบ พร้อม error details ถ้ามี
 */
export function validateConfig(config: unknown): ValidateResult {
  const validate = ajv.getSchema("dashboard-config")!;
  const isValid = validate(config) as boolean;

  if (isValid) {
    return { valid: true };
  }

  const errors = (validate.errors || []).map((error: ErrorObject) => ({
    path: error.instancePath || error.schemaPath || "root",
    message: error.message || "Invalid value",
  }));

  return { valid: false, errors };
}

/**
 * ตรวจสอบ JSON string และ parse พร้อม validate
 * @param jsonString - JSON string ที่ต้องการตรวจสอบ
 * @returns ผลการตรวจสอบพร้อม parsed object ถ้า valid
 */
export function validateConfigString(
  jsonString: string
):
  | { valid: true; config: any }
  | { valid: false; errors: { path: string; message: string }[] } {
  try {
    const config = JSON.parse(jsonString);
    const result = validateConfig(config);

    if (result.valid) {
      return { valid: true, config };
    }

    return result;
  } catch (error) {
    return {
      valid: false,
      errors: [{ path: "root", message: "Invalid JSON syntax" }],
    };
  }
}

// Export schema สำหรับใช้งานอื่น ๆ
export { schema as dashboardConfigSchema };
