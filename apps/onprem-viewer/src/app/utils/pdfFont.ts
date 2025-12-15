import { jsPDF } from "jspdf";

let fontLoaded = false;

export async function addGoogleSansFont(doc: jsPDF): Promise<void> {
  if (fontLoaded) return;

  try {
    // Fetch the font file
    const response = await fetch("/GoogleSans-VariableFont.ttf");
    const fontBlob = await response.blob();

    // Convert to base64
    const reader = new FileReader();
    const fontBase64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const base64 = (reader.result as string).split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(fontBlob);
    });

    // Add font to jsPDF
    doc.addFileToVFS("GoogleSans.ttf", fontBase64);
    doc.addFont("GoogleSans.ttf", "GoogleSans", "normal");
    doc.addFont("GoogleSans.ttf", "GoogleSans", "bold");

    fontLoaded = true;
  } catch (error) {
    console.error("Failed to load Google Sans font:", error);
    // Fallback to default font
  }
}

export function setGoogleSansFont(
  doc: jsPDF,
  style: "normal" | "bold" = "normal"
): void {
  if (fontLoaded) {
    doc.setFont("GoogleSans", style);
  } else {
    // Fallback to helvetica
    doc.setFont("helvetica", style);
  }
}
