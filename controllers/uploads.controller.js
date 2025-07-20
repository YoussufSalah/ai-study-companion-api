import multer from "multer";
import zlib from "zlib";
import supabase from "../config/supabaseClient.js";
import CreateError from "../utils/createError.js";
import createCrudHandlers from "../utils/crudFactory.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import { extractPdfTextSmartly } from "../utils/ocr.js";

const uploadsCrud = createCrudHandlers("uploads");

const storage = multer.memoryStorage();
const fileFilter = (_, file, cb) => {
    if (file.mimetype === "application/pdf") cb(null, true);
    else cb(new CreateError("Only PDF files are allowed", 400), false);
};

const uploadUtil = multer({
    storage,
    fileFilter,
    limits: { fileSize: 50 * 1024 * 1024 },
});

const uploadPDF = asyncWrapper(async (req, res, next) => {
    const userId = req.user.id;

    if (!req.file) return next(new CreateError("No file uploaded", 400));
    const originalName = req.file.originalname;

    // === [1] Prevent duplicate processing ===
    const existing = await uploadsCrud.getAll({
        filter: [
            { column: "user_id", op: "eq", value: userId },
            { column: "original_name", op: "eq", value: originalName },
        ],
    });

    if (existing.length > 0) {
        return res.status(200).json({
            status: "success",
            msg: "File already processed, returning existing result.",
            data: existing[0],
        });
    }

    // === [2] Process OCR ===
    const { parsedText: text, pageCount } = await extractPdfTextSmartly(
        req.file.buffer
    );
    const compressed = zlib.gzipSync(text);

    const parsedFileName = `${userId}-${Date.now()}.txt.gz`;
    const { data, error } = await supabase.storage
        .from("ppdfs")
        .upload(parsedFileName, compressed, {
            contentType: "application/gzip",
            cacheControl: "3600",
            upsert: false,
        });
    console.log(data);

    if (error) {
        console.error("🔥 Supabase Upload Error:", error);
        return next(new CreateError("Failed to upload parsed file", 500));
    }

    const { data: urlData } = supabase.storage
        .from("ppdfs")
        .getPublicUrl(parsedFileName);

    // === [3] Save record ===
    const uploadLog = await uploadsCrud.create({
        user_id: userId,
        original_name: originalName,
        content_type: "pdf",
        content_url: urlData.publicUrl,
        uploaded_at: new Date(),
        language: "eng",
        page_count: pageCount,
    });

    res.status(201).json({
        status: "success",
        msg: "File uploaded and processed successfully",
        data: uploadLog,
    });
});

const uploadsController = { uploadUtil, uploadPDF };
export default uploadsController;
