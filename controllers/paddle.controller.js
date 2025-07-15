import asyncWrapper from "../utils/asyncWrapper.js";
import CreateError from "../utils/createError.js";
import supabase from "../config/supabaseClient.js";
import createCrudHandlers from "../utils/crudFactory.js";

const subscriptionTypeCRUD = createCrudHandlers("subscription_types");
const subscriptionsCRUD = createCrudHandlers("subscriptions");
const subscriptionPaymentsCRUD = createCrudHandlers("subscription_payments");
const paymentsCRUD = createCrudHandlers("payments");
const usersCRUD = createCrudHandlers("users");

// 1. Get all subscription types from the DB
const subscriptionTypes = await subscriptionTypeCRUD.getAll();

const paddleSuccessHandler = asyncWrapper(async (req, res, next) => {
    // 2. Validate request data
    // 3. Insert subscription record in subscriptions table
    // 4. Update user record to include the current subscription ID and add the deserved tokens
    // 5. Insert payment record in payments table
    // 6. Link the subscription record with the payment record in subscription_payments table
});

export default {
    paddleSuccessHandler,
};
