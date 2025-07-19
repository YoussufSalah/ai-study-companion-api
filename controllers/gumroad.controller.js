import asyncWrapper from "../utils/asyncWrapper.js";
import CreateError from "../utils/createError.js";
import createCrudHandlers from "../utils/crudFactory.js";

const subscriptionTypeCRUD = createCrudHandlers("subscription_types");
const subscriptionsCRUD = createCrudHandlers("subscriptions");
const subscriptionPaymentsCRUD = createCrudHandlers("subscription_payments");
const paymentsCRUD = createCrudHandlers("payments");
const usersCRUD = createCrudHandlers("users");

// 1. Define your product-to-subscription map
const productIdToSubscriptionType = {
    "RzZIxJaxifFre8dfqzKkWw==": { name: "starter", period: "monthly" },
    "xilmFjXvSd0cFs5CEmlcEQ==": { name: "starter", period: "yearly" },
    "_3Oc6uoU8Tcw3FU-TmmK9Q==": { name: "pro", period: "monthly" },
    "SvRjf0LW-t2FqmWg-bcTWg==": { name: "pro", period: "yearly" },
};

const ping = asyncWrapper(async (req, res, next) => {
    const { email, product_id, sale_id, price, sale_timestamp } = req.body;

    // [1] Validate necessary fields
    if (!email || !product_id || !sale_id || !price) {
        return next(new CreateError("Missing required Gumroad data", 400));
    }

    // [2] Find user by email
    const users = await usersCRUD.getAll({
        filter: [{ op: "eq", column: "email", value: email }],
    });

    const user = Array.isArray(users) ? users[0] : users;
    if (!user) {
        return next(new CreateError("User not found for this email", 404));
    }

    // [3] Get matching subscription type
    const subInfo = productIdToSubscriptionType[product_id];
    if (!subInfo) {
        return next(new CreateError("Unrecognized product ID", 400));
    }

    const subTypes = await subscriptionTypeCRUD.getAll({
        filter: [
            { op: "eq", column: "name", value: subInfo.name },
            { op: "eq", column: "period", value: subInfo.period },
        ],
    });

    const subType = Array.isArray(subTypes) ? subTypes[0] : subTypes;
    if (!subType) {
        return next(new CreateError("Subscription type not found", 400));
    }

    // [4] Create subscription
    const subscription = await subscriptionsCRUD.create({
        user_id: user.id,
        subscription_type_id: subType.id,
    });

    // [5] Update user: tokens + current subscription
    await usersCRUD.update(user.id, {
        available_tokens: subType.total_tokens,
        subscription_id: subscription.id,
    });

    // [6] Save payment
    const payment = await paymentsCRUD.create({
        subscription_id: subscription.id,
        remote_payment_id: sale_id,
        payment_method: "gumroad",
        payment_status: "paid",
        amount_paid: parseFloat(price) / 100, // convert cents to dollars
        paid_at: new Date(sale_timestamp),
    });

    // [7] Link payment to subscription
    await subscriptionPaymentsCRUD.create({
        subscription_id: subscription.id,
        payment_id: payment.id,
        is_for_subscription: true,
        is_for_extra_tokens: false,
    });

    res.status(200).json({ status: "success", msg: "Subscription applied" });
});

const testPing = asyncWrapper(async (req, res, next) => {
    console.log(req.body);
    res.status(200).json({ status: "success" });
});

const gumroadController = { ping, testPing };

export default gumroadController;
