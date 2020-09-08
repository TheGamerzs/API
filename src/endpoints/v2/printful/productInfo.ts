import { RouteGenericInterface, RouteHandlerMethod } from "fastify/types/route";
import { IncomingMessage, Server, ServerResponse } from "http";
import { pmdDB } from "../../../db/client";

//* Define credits collection
const merch = pmdDB.collection("merch");

//* Request Handler
const handler: RouteHandlerMethod<
	Server,
	IncomingMessage,
	ServerResponse,
	RouteGenericInterface,
	unknown
> = async (req, res) => {
	if (!req.params["id"]) return res.send(404);

	let items = [];
	for (let id of req.params["id"].split(",")) {
		items.push(
			await merch.findOne({
				item_id: id.split("-")[0]
			})
		);
	}

	res.send({ items });
};

//* Export handler
export { handler };
