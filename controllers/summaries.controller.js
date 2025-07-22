import axios from "axios";
import asyncWrapper from "../utils/asyncWrapper.js";
import deductTokens from "../utils/deductTokens.js";

const MODEL = "mistralai/mistral-7b-instruct-v0.3";

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

const summarizeTextChunks = async (rawText, pagesCount) => {
    const prompt = `
        Please analyze the following document and create a comprehensive, well-structured summary.
        Requirements:
        - Create 1-2 main sections with clear headings
        - Include key concepts, definitions, and important details
        - Use bullet points for clarity where appropriate
        - Keep it concise but comprehensive (${15 * pagesCount}-${
        30 * pagesCount
    } words)
        - Focus on the most important information for studying
        Document content:
        ${rawText}
        `;
    const summary = await summarizeWithOpenRouter(MODEL, prompt);

    return summary;
};

// 📄 PDF
const summarizePDF = asyncWrapper(async (req, res, next) => {
    const { id: userId } = req.user;
    const { rawText, tokensNeeded } = req;

    const summary = await summarizeTextChunks(rawText, tokensNeeded / 2000);

    await deductTokens(userId, tokensNeeded);

    res.status(200).json({
        status: "success",
        data: { summary },
    });
});

export default {
    summarizePDF,
};
