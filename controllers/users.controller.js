import createCrudHandlers from "../utils/crudFactory.js";
import asyncWrapper from "../utils/asyncWrapper.js";

const usersCrud = createCrudHandlers("users");
const subscriptionsCrud = createCrudHandlers("subscriptions");
const subscriptionTypesCrud = createCrudHandlers("subscription_types");
const BASE_URL = process.env.BASE_URL || "http://localhost:3000/api";

const createUser = asyncWrapper(async (req, res, _) => {
    const response = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
            email: req.body.email,
            password: req.body.password,
            username: req.body.username,
        }),
    });
    const result = await response.json();
    const userId = result.data.registeredUser.id;
    const { password, ...updates } = req.body;
    const user = await usersCrud.update(userId, updates);
    res.status(201).json({
        status: "success",
        data: { msg: "User created successfully.", user },
    });
});

const getUser = asyncWrapper(async (req, res, _) => {
    res.status(200).json({
        status: "success",
        data: {
            msg: "Authorized user retrieved successfully.",
            user: req.user,
        },
    });
});

const updateUser = asyncWrapper(async (req, res, _) => {
    const updatedUser = await usersCrud.update(req.user.id, req.body);
    res.status(200).json({
        status: "success",
        data: {
            msg: "Authorized user updated successfully.",
            user: updatedUser,
        },
    });
});

const deleteUser = asyncWrapper(async (req, res, _) => {
    await usersCrud.remove(req.user.id);
    res.status(200).json({
        status: "success",
        data: { msg: "User deleted successfully.", id: req.user.id },
    });
});

const getUserById = asyncWrapper(async (req, res, _) => {
    const user = await usersCrud.getOne(req.params.id);
    res.status(200).json({
        status: "success",
        data: { msg: "User retrieved successfully.", id: req.params.id, user },
    });
});

const getAllUsers = asyncWrapper(async (req, res, _) => {
    const options = {};
    const allUsers = await usersCrud.getAll(options);
    res.status(200).json({
        status: "success",
        data: { msg: "All users retrieved successfully.", users: allUsers },
    });
});

const updateUserById = asyncWrapper(async (req, res, _) => {
    const updatedUser = await usersCrud.update(req.params.id, req.body);
    res.status(200).json({
        status: "success",
        data: { msg: "User updated successfully.", updatedUser },
    });
});

const deleteUserById = asyncWrapper(async (req, res, _) => {
    await usersCrud.remove(req.params.id);
    res.status(200).json({
        status: "success",
        data: { msg: "User deleted successfully.", id: req.user.id },
    });
});

const incrementStudyTime = asyncWrapper(async (req, res, _) => {
    const userId = req.user.id;
    const { minutes } = req.body;

    if (!minutes || minutes <= 0) {
        return res.status(400).json({ message: "Invalid study time" });
    }

    const user = await usersCrud.getOne(userId);
    const updated = await usersCrud.update(userId, {
        study_time: user.study_time + minutes,
    });

    res.status(200).json({
        status: "success",
        data: { message: "Study time updated", studyTime: updated.study_time },
    });
});

const getStats = asyncWrapper(async (req, res, _) => {
    const userId = req.user.id;

    const user = await usersCrud.getOne(userId);
    const {
        username,
        email,
        subscription_id: subscriptionId,
        study_time: totalStudyTime,
        available_tokens: availableTokens,
        current_streak: current,
        best_streak: longest,
        created_at: joinedAt,
        summaries,
        flashcards,
        quizzes,
    } = user;
    const formattedStudyTime = `${Math.floor(totalStudyTime / 60)}h ${parseInt(
        totalStudyTime % 60
    )}m`;
    const availableCredits = Math.floor(availableTokens / 2000);

    let outputSubscription = "User doesn't have any active subscription.";
    if (subscriptionId) {
        const subscription = await subscriptionsCrud.getOne(subscriptionId);
        const { period: subscriptionPeriod, name: subscriptionName } =
            await subscriptionTypesCrud.getOne(
                subscription.subscription_type_id
            );
        const startedAt = new Date(subscription.created_at);
        let expiresAt = new Date(subscription.created_at);

        if (subscriptionPeriod === "monthly") {
            expiresAt.setDate(expiresAt.getDate() + 30);
        } else {
            expiresAt.setDate(expiresAt.getDate() + 365);
        }
        const now = new Date();
        const isActive = expiresAt > now;

        outputSubscription = {
            name: subscriptionName,
            startedAt,
            expiresAt,
            period: subscriptionPeriod,
            isActive,
        };
    }

    const options = {
        filter: [{ column: "user_id", op: "eq", value: userId }],
    };
    const usage = {
        summariesGenerated: summaries,
        flashcardsCreated: flashcards,
        quizzesTaken: quizzes,
    };

    const result = {
        username,
        email,
        totalStudyTime,
        formattedStudyTime,
        availableTokens,
        availableCredits,
        subscription: outputSubscription,
        usage,
        streak: { current, longest },
        joinedAt,
    };

    res.status(200).json({
        status: "success",
        data: { msg: "User stats retrieved successfully.", stats: result },
    });
});

const usersController = {
    createUser,
    getUser,
    updateUser,
    deleteUser,
    getUserById,
    getAllUsers,
    updateUserById,
    deleteUserById,
    incrementStudyTime,
    getStats,
};
export default usersController;
