import asyncWrapper from "../utils/asyncWrapper.js";

const ping = asyncWrapper(async (req, res, next) => {
    console.log(req.body);
    res.status(200).json({ status: "success" });
});

const gumroadController = { ping };

export default gumroadController;
