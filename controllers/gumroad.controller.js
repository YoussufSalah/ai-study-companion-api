import asyncWrapper from "../utils/asyncWrapper.js";

const ping = asyncWrapper(async (req, res, next) => {
    res.status(200).json({ status: "success" });
});

const gumroadController = { ping };

export default gumroadController;
