import axios from "axios";
import asyncWrapper from "../utils/asyncWrapper.js";
import CreateError from "../utils/createError.js";
import deductTokens from "../utils/deductTokens.js";
import createCrudHandlers from "../utils/crudFactory.js";

const usersCrud = createCrudHandlers("users");
const QUIZ_MODEL = "mistralai/mistral-7b-instruct-v0.3";

// Generate MCQ quiz from chunks
const generateQuizWithOpenRouter = async (fullText) => {
    const prompt = `You are an API that generates a mini MCQ quiz in JSON format only, with 10-20 questions. Each question must be an object: {\n  "question": "...",\n  "options": ["A", "B", "C", "D"],\n  "correct": 0,\n  "explanation": "..."\n} and the quiz must be wrapped as follows:\n{\n  "topics": ["Topic 1", "Topic 2", ...],\n  "questionsData": [ ... ]\n}\nDo not explain your response.\n\nInput Text:\n${fullText}\n\nReturn this format only.`;
    const { data } = await axios.post(
        "https://openrouter.ai/api/v1/chat/completions",
        {
            model: QUIZ_MODEL,
            messages: [{ role: "user", content: prompt }],
        },
        {
            headers: {
                Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                "Content-Type": "application/json",
            },
        }
    );
    let llmOutput = data.choices[0].message.content;
    // Try to parse the output
    let parsed;
    try {
        parsed = JSON.parse(llmOutput);
    } catch (e) {
        // Try to extract JSON if extra text is present
        const match = llmOutput.match(/\{[\s\S]*\}/);
        if (match) {
            try {
                parsed = JSON.parse(match[0]);
            } catch (e2) {
                parsed = null;
            }
        }
    }
    return parsed;
};

// 📄 PDF
const generateQuizPDF = asyncWrapper(async (req, res, next) => {
    const { id: userId, quizzes } = req.user;
    const { rawText, tokensNeeded } = req;
    const quiz = await generateQuizWithOpenRouter(rawText);
    if (!quiz) {
        return next(
            new CreateError(
                "Failed to generate a valid quiz from the provided content. Please try again or contact support.",
                500
            )
        );
    }
    const _ = await usersCrud.update(userId, { quizzes: quizzes + 1 });
    await deductTokens(userId, tokensNeeded);
    res.status(200).json({
        status: "success",
        data: { quiz },
    });
});

export default {
    generateQuizPDF,
};
