import axios from "axios";
import zlib from "zlib";
import supabase from "../config/supabaseClient.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import CreateError from "../utils/createError.js";
import createCrudHandlers from "../utils/crudFactory.js";
import deductTokens from "../utils/deductTokens.js";
import safeJsonArrayExtract from "../utils/safeJsonArrayExtract.js";

const flashcardsCrud = createCrudHandlers("flashcards");
const TEMP_MODEL = "mistralai/mistral-7b-instruct-v0.3";
const FLASHCARDS_MODEL = "google/gemini-2.5-flash-lite-preview-06-17";

// Upload flashcards JSON
const uploadFlashcardsFile = async (recordId, flashcards) => {
    const json = JSON.stringify(flashcards);
    const compressed = zlib.gzipSync(json);
    const path = `${recordId}.json.gz`;

    const { error } = await supabase.storage
        .from("flashcards")
        .upload(path, compressed, {
            contentType: "application/gzip",
            upsert: true,
        });

    if (error) {
        console.error("❌ Flashcards upload error:", error.message, error);
        return next(new CreateError(error.message, 500));
    }

    const { data } = supabase.storage.from("flashcards").getPublicUrl(path);
    return data.publicUrl;
};

// Generate flashcards from chunks
const generateFlashcardsWithOpenRouter = async (textChunks) => {
    const allFlashcards = [];
    const failedChunks = [];
    for (const chunk of textChunks) {
        const prompt = `You are an API that generates exactly 5 educational flashcards in pure JSON format only, without any text or description. Each flashcard must be a {"front": "...", "back": "...", "category": "concept/definition/application"} object. Do not explain your response.

        Input Text:
        ${chunk}
        
        Return this format only:
        [
          {"front": "...", "back": "...", "category": "concept/definition/application"},
          ...
        ]`;
        const { data } = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: TEMP_MODEL,
                messages: [{ role: "user", content: prompt }],
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                },
            }
        );
        const llmOutput = data.choices[0].message.content;
        const parsed = safeJsonArrayExtract(llmOutput);
        allFlashcards.push(...parsed);
    }
    return { allFlashcards, failedChunks };
};

// 📄 PDF
const generateFlashcardsPDF = asyncWrapper(async (req, res, next) => {
    console.log("🔍 req.user:", req.user);

    const { id: fileId } = req.params;
    const { id: userId } = req.user;
    const { chunks, tokensNeeded } = req;
    const { allFlashcards, failedChunks } =
        await generateFlashcardsWithOpenRouter(chunks);
    if (allFlashcards.length === 0) {
        console.error(
            "❌ No valid flashcards generated. Failed LLM outputs:",
            failedChunks
        );
        return next(
            new CreateError(
                "Failed to generate valid flashcards from the provided content. Please try again or contact support.",
                500
            )
        );
    }
    const url = await uploadFlashcardsFile(fileId, allFlashcards);
    const record = await flashcardsCrud.create({
        user_id: userId,
        upload_id: fileId,
        content_type: "pdf",
        tokens_used: tokensNeeded,
        flashcards_url: url,
        created_at: new Date(),
    });
    await deductTokens(userId, tokensNeeded);
    res.status(200).json({
        status: "success",
        data: { record, flashcards: allFlashcards },
    });
});

// 📥 Get all flashcards
const getAllFlashcards = asyncWrapper(async (req, res, next) => {
    const options = req.body?.options || {};
    const data = await flashcardsCrud.getAll(options);

    const PDFFlashcards = data.filter((s) => s.content_type === "pdf");
    const youtubeFlashcards = data.filter((s) => s.content_type === "youtube");

    res.status(200).json({
        status: "success",
        data: {
            msg: "Flashcards retrieved successfully.",
            PDFFlashcards,
            youtubeFlashcards,
        },
    });
});

export default {
    generateFlashcardsPDF,
    getAllFlashcards,
};
