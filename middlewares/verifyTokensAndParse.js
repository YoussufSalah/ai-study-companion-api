import supabase from "../config/supabaseClient.js";
import CreateError from "../utils/createError.js";
import { extractTextChunks } from "../utils/chunkText.js";
import uploadsCrudFactory from "../utils/crudFactory.js";

const uploadsCrud = uploadsCrudFactory("uploads");

// type: 'summary' | 'flashcards' | 'quiz'
const verifyTokensAndParse = (type = "summary") => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const { parsedText, pagesCount } = req.body;

        const tokensNeeded = pagesCount * 2000;

        const { data: user, error } = await supabase
            .from("users")
            .select("available_tokens")
            .eq("id", userId)
            .single();

        if (error || !user) {
            return next(new CreateError("User not found", 404));
        }

        if (user.available_tokens < tokensNeeded) {
            return next(
                new CreateError(
                    `You need at least ${tokensNeeded} tokens for this action.`,
                    403
                )
            );
        }

        req.rawText = parsedText;
        req.tokensNeeded = tokensNeeded;

        next();
    };
};

export default verifyTokensAndParse;
