import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { licenseKey } = body;

    if (!licenseKey) {
      return NextResponse.json(
        { success: false, error: "License key is required" },
        { status: 400 }
      );
    }

    // Check if user is authenticated (basic security)
    const sessionToken = request.cookies.get("session-token")?.value;
    if (!sessionToken) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    // Path to .env file
    const envPath = path.join(process.cwd(), ".env");

    try {
      // Read existing .env file
      let envContent = "";
      try {
        envContent = await fs.readFile(envPath, "utf8");
      } catch (error) {
        // File doesn't exist, will create new one
        console.log(".env file doesn't exist, creating new one");
      }

      // Update or add FLEXBOARD_LICENSE_KEY
      const lines = envContent.split("\n");
      let updated = false;

      for (let i = 0; i < lines.length; i++) {
        if (lines[i].startsWith("FLEXBOARD_LICENSE_KEY=")) {
          lines[i] = `FLEXBOARD_LICENSE_KEY=${licenseKey}`;
          updated = true;
          break;
        }
      }

      if (!updated) {
        // Add new line
        lines.push(`FLEXBOARD_LICENSE_KEY=${licenseKey}`);
      }

      // Write back to .env file
      await fs.writeFile(envPath, lines.join("\n"), "utf8");

      return NextResponse.json({
        success: true,
        message: "License key saved to .env file successfully",
      });
    } catch (error) {
      console.error("Error writing to .env file:", error);
      return NextResponse.json(
        {
          success: false,
          error: "Failed to write to .env file. Check file permissions.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error saving license key to .env:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
