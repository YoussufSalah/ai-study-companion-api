// import { createWorker } from "tesseract.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

const extractPdfTextSmartly = async (pdfBuffer) => {
    const pdf = await getDocument({ data: new Uint8Array(pdfBuffer) }).promise;
    let finalText = "";

    // const worker = await createWorker();
    // await worker.reinitialize("eng");

    let negate = 0;
    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const textContent = await page.getTextContent();

        const pageText = textContent.items
            .map((item) => item.str)
            .join(" ")
            .trim();

        if (pageText && pageText.length > 20) {
            finalText += pageText + "\n\n";
        } else {
            // Implement OCR
            negate++;
        }
    }

    // await worker.terminate();

    return {
        parsedText: finalText.trim(),
        pageCount: pdf.numPages - negate,
    };
};

export { extractPdfTextSmartly };
