// import { createWorker } from "tesseract.js";
import pdf from "pdf-parse";

const extractPdfTextSmartly = async (pdfBuffer) => {
    let finalText = "";
    let negate = 0;

    const data = await pdf(pdfBuffer, {
        pagerender: (pageData) => pageData.text,
    });

    const pages = data.text.split("\f");
    const numPages = pages.length;

    for (let i = 0; i < numPages; i++) {
        const pageText = pages[i].replace(/\s+/g, " ").trim();
        if (pageText && pageText.length > 20) {
            finalText += pageText + "\n\n";
        } else {
            // Implement OCR
            negate++;
        }
    }

    return {
        parsedText: finalText.trim(),
        pageCount: numPages - negate,
    };
};

export { extractPdfTextSmartly };
