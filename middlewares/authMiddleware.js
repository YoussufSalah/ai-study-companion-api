import CreateError from "../utils/createError.js";
import createCrudHandlers from "../utils/crudFactory.js";
import asyncWrapper from "../utils/asyncWrapper.js";
import { jwtDecode } from "jwt-decode";

const usersCrud = createCrudHandlers("users");

const protect = asyncWrapper(async (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer "))
        return next(new CreateError("No token provided", 401));

    const token = authHeader.split(" ")[1];

    const decoded = jwtDecode(token);

    const fullUser = await usersCrud.getOne(decoded.sub);
    if (!fullUser)
        return next(new CreateError("User not found in local DB", 404));

    req.user = fullUser;
    console.log(fullUser);
    next();
});

export default protect;
