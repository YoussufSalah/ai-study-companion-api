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

const parsePDF = asyncWrapper(async (req, res, next) => {
    if (!req.file) return next(new CreateError("No file uploaded", 400));

    const { parsedText: text, pageCount } = await extractPdfTextSmartly(
        req.file.buffer
    );

    res.status(201).json({
        status: "success",
        data: {
            msg: "File processed successfully",
            parsedText,
            pageCount,
        },
    });
});

const uploadsController = { uploadUtil, parsePDF };
export default uploadsController;
