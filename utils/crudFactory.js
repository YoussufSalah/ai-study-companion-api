import supabase from "../config/supabaseClient.js";
import CreateError from "./createError.js";

const createCrudHandlers = (table, user = {}) => ({
    async getAll(options = {}) {
        let query = supabase.from(table).select("*");
        if (user && user.id) query = query.eq("user_id", user.id);

        const {
            page,
            pageSize,
            limit,
            offset,
            orderBy,
            filter = {},
        } = options || {};

        if (typeof page === "number" && typeof pageSize === "number") {
            const calculatedOffset = (page - 1) * pageSize;
            query = query.range(
                calculatedOffset,
                calculatedOffset + pageSize - 1
            );
        } else if (typeof limit === "number") {
            query = query.limit(limit);
            if (typeof offset === "number") {
                query = query.range(offset, offset + limit - 1);
            }
        } else if (typeof offset === "number") {
            query = query.range(offset, offset + 9999);
        }

        if (orderBy) {
            if (Array.isArray(orderBy)) {
                orderBy.forEach((order) => {
                    query = query.order(order.column, {
                        ascending: order.ascending !== false,
                    });
                });
            } else {
                query = query.order(orderBy.column, {
                    ascending: orderBy.ascending !== false,
                });
            }
        }

        if (filter) {
            function filterQuery(filter) {
                if (filter.op && filter.column && filter.value !== undefined) {
                    switch (filter.op) {
                        case "eq":
                            query = query.eq(filter.column, filter.value);
                            break;
                        case "neq":
                            query = query.neq(filter.column, filter.value);
                            break;
                        case "gt":
                            query = query.gt(filter.column, filter.value);
                            break;
                        case "gte":
                            query = query.gte(filter.column, filter.value);
                            break;
                        case "lt":
                            query = query.lt(filter.column, filter.value);
                            break;
                        case "lte":
                            query = query.lte(filter.column, filter.value);
                            break;
                        case "is":
                            query = query.is(filter.column, filter.value);
                            break;
                        case "in":
                            query = query.in(filter.column, filter.value);
                            break;
                        default:
                            throw new CreateError(
                                "Invalid supabase operator.",
                                403
                            );
                    }
                }
            }
            if (Array.isArray(filter)) {
                filter.forEach((f) => {
                    filterQuery(f);
                });
            } else if (
                filter.op &&
                filter.column &&
                filter.value !== undefined
            ) {
                filterQuery(filter);
            }
        }

        const { data, error } = await query;
        if (error) throw error;
        return data;
    },

    async getOne(id) {
        const { data, error } = await supabase
            .from(table)
            .select("*")
            .eq("id", id)
            .single();
        if (error) throw error;
        return data;
    },

    async create(payload) {
        const { data, error } = await supabase
            .from(table)
            .insert([payload])
            .select();
        if (error) throw error;
        return data[0];
    },

    async update(id, payload) {
        const { data, error } = await supabase
            .from(table)
            .update(payload)
            .eq("id", id)
            .select();
        if (error) throw error;
        return data[0];
    },

    async remove(id) {
        const { error } = await supabase.from(table).delete().eq("id", id);
        if (error) throw error;
        return { success: true };
    },
});

export default createCrudHandlers;
