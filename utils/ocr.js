import { createWorker } from "tesseract.js";
import { getDocument } from "pdfjs-dist/legacy/build/pdf.js";
import { createCanvas } from "canvas";

const loadPdfAsImageBuffers = async (pdfBuffer) => {
    const pdf = await getDocument({ data: pdfBuffer }).promise;
    const pages = [];

    for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale: 2.0 });
        const canvas = createCanvas(viewport.width, viewport.height);
        const context = canvas.getContext("2d");

        await page.render({ canvasContext: context, viewport }).promise;
        const imageBuffer = canvas.toBuffer("image/jpeg");
        pages.push(imageBuffer);
    }

    return pages;
};

const runOCRonImages = async (imageBuffers) => {
    const worker = await createWorker();
    await worker.load();
    await worker.reinitialize("eng");

    let allText = "";
    for (const img of imageBuffers) {
        const {
            data: { text },
        } = await worker.recognize(img);
        allText += text + "\n";
    }

    await worker.terminate();
    return allText;
};

export { loadPdfAsImageBuffers, runOCRonImages };
