import asyncWrapper from "../utils/asyncWrapper.js";
import CreateError from "../utils/createError.js";
import createCrudHandlers from "../utils/crudFactory.js";

const subscriptionTypeCRUD = createCrudHandlers("subscription_types");
const subscriptionsCRUD = createCrudHandlers("subscriptions");
const subscriptionPaymentsCRUD = createCrudHandlers("subscription_payments");
const paymentsCRUD = createCrudHandlers("payments");
const usersCRUD = createCrudHandlers("users");

const successHandler = asyncWrapper(async (req, res, next) => {
    const { event_type, data } = req.body;

    const { custom_data, id: paddlePaymentId } = data;

    const { subscriptionTypeName, subscriptionPeriod, amountPaid } =
        custom_data;

    const userId = req.user.id;

    // === [1] Validate required data ===
    if (
        !userId ||
        !subscriptionTypeName ||
        !subscriptionPeriod ||
        !amountPaid
    ) {
        return next(new CreateError("Missing required payment info", 400));
    }

    // === [2] Get the right subscription type from DB ===
    const type = await subscriptionTypeCRUD.getAll({
        filter: [
            { op: "eq", column: "name", value: subscriptionTypeName },
            { op: "eq", column: "period", value: subscriptionPeriod },
        ],
    });
    const subType = Array.isArray(type) ? type[0] : type;

    if (!subType) {
        return next(new CreateError("Invalid subscription type", 400));
    }

    // === [3] Create subscription record ===
    const subscriptionData = await subscriptionsCRUD.create({
        user_id: userId,
        subscription_type_id: subType.id,
    });

    const subscriptionId = subscriptionData.id;

    // === [4] Update user with current subscription ID + add tokens ===
    await usersCRUD.update(userId, {
        available_tokens: subType.total_tokens,
        subscription_id: subscriptionId,
    });

    // === [5] Create payment record ===
    const paymentData = await paymentsCRUD.create({
        subscription_id: subscriptionId,
        remote_payment_id: paddlePaymentId,
        payment_method: "paddle",
        payment_status: "paid",
        amount_paid: amountPaid,
        paid_at: new Date(),
    });

    const paymentId = paymentData.id;

    // === [6] Create subscription_payments record ===
    await subscriptionPaymentsCRUD.create({
        subscription_id: subscriptionId,
        payment_id: paymentId,
        is_for_subscription: true,
        is_for_extra_tokens: false,
    });

    res.status(200).json({
        status: "success",
        msg: "Subscription created, tokens added, and payment saved successfully.",
    });
});

const webhookHandler = asyncWrapper(async (req, res, next) => {
    const { event_type, data } = req.body;

    if (event_type !== "transaction.completed") {
        return res.status(200).send("Ignored non-transaction event");
    }

    const {
        custom_data,
        id: paddlePaymentId,
        status,
        amount,
        customer_id,
    } = data;

    const { subscriptionTypeName, subscriptionPeriod, amountPaid, userId } =
        custom_data;

    if (
        !userId ||
        !subscriptionTypeName ||
        !subscriptionPeriod ||
        !amountPaid
    ) {
        return res
            .status(400)
            .json({ success: false, message: "Missing required data" });
    }

    // Simulate req.user so you can reuse the successHandler logic
    req.user = { id: userId };
    req.body = {
        subscriptionTypeName,
        subscriptionPeriod,
        amountPaid,
        paddlePaymentId,
    };

    // Call your success handler
    return paddleController.paddleSuccessHandler(req, res, next);
});

export default {
    successHandler,
    webhookHandler,
};
