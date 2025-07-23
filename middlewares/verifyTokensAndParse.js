import supabase from "../config/supabaseClient.js";
import CreateError from "../utils/createError.js";

// type: 'summary' | 'flashcards' | 'quiz'
const verifyTokensAndParse = (type = "summary") => {
    return async (req, res, next) => {
        const userId = req.user.id;
        const { parsedText, tokensNeeded } = req.body;

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
