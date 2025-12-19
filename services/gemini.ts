import { GoogleGenAI } from "@google/genai";
import { InvoiceMetadata } from "../types.ts";

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const analyzeInvoicePage = async (
  base64Image: string, 
  retries = 3, 
  onRetry?: (attempt: number) => void
): Promise<InvoiceMetadata> => {
  // Siempre crear nueva instancia para usar la clave más reciente inyectada
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || "" });
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview', // Modelo Pro para Paid Tier
        contents: {
          parts: [
            {
              inlineData: {
                mimeType: 'image/jpeg',
                data: base64Image.split(',')[1] || base64Image,
              },
            },
            {
              text: "Extract data from this Logistics/Warehouse Invoice. I need the main Invoice/Packing List Number and the exact Company Name mentioned in 'SHIP TO' section. \n\nResponse format MUST be strictly JSON: {\"invoiceNo\": \"ID_OR_NULL\", \"shipTo\": \"COMPANY_NAME_OR_NULL\"}",
            }
          ],
        },
        config: {
          responseMimeType: "application/json",
          // El Thinking Budget permite al modelo razonar la estructura del documento
          thinkingConfig: { thinkingBudget: 4000 },
        },
      });

      const resultText = response.text || "{}";
      return JSON.parse(resultText) as InvoiceMetadata;
    } catch (e: any) {
      const isRateLimit = e.message?.includes('429') || e.status === 429 || JSON.stringify(e).includes('429');
      const isNotFound = e.message?.includes('Requested entity was not found');
      
      // Si la clave es inválida o no se encuentra (posible error de permisos), notificamos
      if (isNotFound) {
        console.error("API Key error. Re-triggering selection might be needed.");
      }

      if (isRateLimit && attempt < retries - 1) {
        const waitTime = Math.pow(2, attempt) * 2000;
        if (onRetry) onRetry(attempt + 1);
        await sleep(waitTime);
        continue;
      }
      
      console.error("Gemini Pro Analysis Error:", e);
      return { invoiceNo: null, shipTo: null };
    }
  }
  return { invoiceNo: null, shipTo: null };
};