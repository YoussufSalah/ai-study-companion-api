import axios from "axios";
import asyncWrapper from "../utils/asyncWrapper.js";
import CreateError from "../utils/createError.js";
import deductTokens from "../utils/deductTokens.js";
import safeJsonArrayExtract from "../utils/safeJsonArrayExtract.js";
import createCrudHandlers from "../utils/crudFactory.js";

const usersCrud = createCrudHandlers("users");
const TEMP_MODEL = "mistralai/mistral-7b-instruct-v0.3";
const FLASHCARDS_MODEL = "google/gemini-2.5-flash-lite-preview-06-17";

// Generate flashcards from chunks
const generateFlashcardsWithOpenRouter = async (rawText) => {
    const allFlashcards = [];
    const prompt = `You are an API that generates educational flashcards in pure JSON format only, without any text or description. Each flashcard must be a {"front": "...", "back": "...", "category": "concept/definition/application"} object. Do not explain your response.

        Input Text:
        ${rawText}
        
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
    return { allFlashcards };
};

// 📄 PDF
const generateFlashcardsPDF = asyncWrapper(async (req, res, next) => {
    const { id: userId, flashcards } = req.user;
    const { rawText, tokensNeeded } = req;
    const { allFlashcards } = await generateFlashcardsWithOpenRouter(rawText);
    if (allFlashcards.length === 0) {
        console.error("❌ No valid flashcards generated. Failed LLM outputs");
        return next(
            new CreateError(
                "Failed to generate valid flashcards from the provided content. Please try again or contact support.",
                500
            )
        );
    }
    await usersCrud.update(userId, { flashcards: flashcards + 1 });
    await deductTokens(userId, tokensNeeded);
    console.log(allFlashcards);
    res.status(200).json({
        status: "success",
        data: { flashcards: allFlashcards },
    });
});

export default {
    generateFlashcardsPDF,
};
