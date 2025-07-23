import multer from "multer";
import CreateError from "../utils/createError.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import pdf from "pdf-parse-debugging-disabled";
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

    const data = await pdf(req.file.buffer);
    res.status(201).json({
        status: "success",
        data: {
            parsedText: data.text,
            tokensNeeded: parseInt(data.text.length / 1.25, 10),
        },
    });
});

const uploadsController = { uploadUtil, parsePDF };
export default uploadsController;
