import { RouteGenericInterface, RouteHandlerMethod } from "fastify/types/route";
import { IncomingMessage, Server, ServerResponse } from "http";
import { cache } from "../../../index";

let products = cache.get("merch");

cache.on("update", (_, data) => (products = data), {
	only: "merch"
});

//* Request Handler
const handler: RouteHandlerMethod<
	Server,
	IncomingMessage,
	ServerResponse,
	RouteGenericInterface,
	unknown
> = async (req, res) => {
	let countries = products.filter(document => document.title === "shipping")[0].countries;
	return res.send({ countries });
};

//* Export handler
export { handler };