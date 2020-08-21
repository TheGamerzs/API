import axios from "axios";
import { RouteGenericInterface, RouteHandlerMethod } from "fastify/types/route";
import { IncomingMessage, Server, ServerResponse } from "http";

const handler: RouteHandlerMethod<
	Server,
	IncomingMessage,
	ServerResponse,
	RouteGenericInterface,
	unknown
> = async (req, res) => {
	await axios.get("https://api.printful.com/countries").then(data => {
		console.log(data.data.result);
		res.send(data.data.result);
	});
};
export { handler };
