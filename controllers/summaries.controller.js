import axios from "axios";
import zlib from "zlib";
import asyncWrapper from "../utils/asyncWrapper.js";
import CreateError from "../utils/createError.js";
import createCrudHandlers from "../utils/crudFactory.js";
import supabase from "../config/supabaseClient.js";
import deductTokens from "../utils/deductTokens.js";

const summariesCrud = createCrudHandlers("summaries");
const MODEL = "mistralai/mistral-7b-instruct-v0.3";

// Upload compressed summary
const uploadSummaryFile = async (recordId, summary) => {
    const compressed = zlib.gzipSync(summary);
    const path = `${recordId}.txt.gz`;

    const { error } = await supabase.storage
        .from("summaries")
        .upload(path, compressed, {
            contentType: "application/gzip",
            upsert: true,
        });

    if (error) {
        console.error("❌ Supabase upload error:", error.message, error);
        throw new Error("Failed to upload summary file.");
    }

    const { data } = supabase.storage.from("summaries").getPublicUrl(path);
    console.log("PDF Upload Data:", data);
    return data.publicUrl;
};

const summarizeWithOpenRouter = async (model, prompt) => {
    const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model,
            messages: [{ role: "user", content: prompt }],
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );
    return data.choices[0].message.content;
};

const summarizeTextChunks = async (chunks) => {
    const summaries = [];

    for (const chunk of chunks) {
        const prompt = `
        Please analyze the following document and create a comprehensive, well-structured summary.
        Requirements:
        - Create 1-2 main sections with clear headings
        - Include key concepts, definitions, and important details
        - Use bullet points for clarity where appropriate
        - Keep it concise but comprehensive (50-150 words)
        - Focus on the most important information for studying
        Document content:
        ${chunk}
        `;
        const summary = await summarizeWithOpenRouter(MODEL, prompt);
        summaries.push(summary);
    }

    return summaries.join("\n\n");
};

// 📄 PDF
const summarizePDF = asyncWrapper(async (req, res, next) => {
    const { id: fileId } = req.params;
    const { id: userId } = req.user;
    const { chunks, tokensNeeded } = req;

    const summary = await summarizeTextChunks(chunks);

    const record = await summariesCrud.create({
        user_id: userId,
        upload_id: fileId,
        content_type: "pdf",
        tokens_used: tokensNeeded,
        created_at: new Date(),
    });

    const url = await uploadSummaryFile(record.id, summary);
    const updatedRecord = await summariesCrud.update(record.id, {
        summary_url: url,
    });

    await deductTokens(userId, tokensNeeded);

    res.status(200).json({
        status: "success",
        data: { record: updatedRecord, summary },
    });
});

// 📥 Get all summaries
const getAllSummaries = asyncWrapper(async (req, res, next) => {
    const options = req.body?.options || {};
    const data = await summariesCrud.getAll(options);

    const PDFSummaries = data.filter((s) => s.content_type === "pdf");
    const youtubeSummaries = data.filter((s) => s.content_type === "youtube");

    res.status(200).json({
        status: "success",
        data: {
            msg: "Summaries retrieved successfully.",
            PDFSummaries,
            youtubeSummaries,
        },
    });
});

export default {
    summarizePDF,
    getAllSummaries,
};
