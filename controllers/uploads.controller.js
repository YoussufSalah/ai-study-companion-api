// controllers/uploads.controller.js
import multer from "multer";
import supabase from "../config/supabaseClient.js";
import CreateError from "../utils/createError.js";
import createCrudHandlers from "../utils/crudFactory.js";
import asyncWrapper from "../utils/asyncWrapper.js";

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
    console.log("➡️ File received:", req.file);
    console.log("➡️ User:", req.user);
    console.log("➡️ Headers:", req.headers);

    const userId = req.user.id;

    if (!req.file) return next(new CreateError("No file uploaded", 400));
    const filename = `${userId}-${Date.now()}`;

    const { data, error } = await supabase.storage
        .from("pdfs")
        .upload(filename, req.file.buffer, {
            contentType: "application/pdf",
            cacheControl: "3600",
            upsert: true,
        });

    if (error) {
        console.error("🔥 Supabase Upload Error:", error);
        return next(new CreateError("Failed to upload file", 500));
    }

    const { data: urlData } = supabase.storage
        .from("pdfs")
        .getPublicUrl(filename);

    const uploadLog = await uploadsCrud.create({
        user_id: userId,
        content_type: "pdf",
        content_url: urlData.publicUrl,
        uploaded_at: new Date(),
    });

    res.status(201).json({
        status: "success",
        data: {
            msg: "File uploaded successfully",
            filename,
            path: data.path,
            uploadLog,
        },
    });
});

const uploadsController = { uploadUtil, uploadPDF };
export default uploadsController;
