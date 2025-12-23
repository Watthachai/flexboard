import { jsPDF } from "jspdf";

// Cache the font base64 string to avoid re-fetching
let cachedFontBase64: string | null = null;

export async function addGoogleSansFont(doc: jsPDF): Promise<void> {
  try {
    // If we haven't cached the font yet, fetch it
    if (!cachedFontBase64) {
      // Fetch the font file
      const response = await fetch("/GoogleSans-VariableFont.ttf");
      const fontBlob = await response.blob();

      // Convert to base64
      const reader = new FileReader();
      cachedFontBase64 = await new Promise<string>((resolve, reject) => {
        reader.onloadend = () => {
          const base64 = (reader.result as string).split(",")[1];
          resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(fontBlob);
      });
    }

    // Always add font to the new doc instance
    doc.addFileToVFS("GoogleSans.ttf", cachedFontBase64);
    doc.addFont("GoogleSans.ttf", "GoogleSans", "normal");
    doc.addFont("GoogleSans.ttf", "GoogleSans", "bold");
  } catch (error) {
    console.error("Failed to load Google Sans font:", error);
    // Fallback to default font
  }
}

export function setGoogleSansFont(
  doc: jsPDF,
  style: "normal" | "bold" = "normal"
): void {
  try {
    doc.setFont("GoogleSans", style);
  } catch {
    // Fallback to helvetica if GoogleSans not available
    doc.setFont("helvetica", style);
  }
}
