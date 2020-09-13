import { RouteGenericInterface, RouteHandlerMethod } from "fastify/types/route";
import { IncomingMessage, Server, ServerResponse } from "http";
var braintree = require("braintree");

var gateway = braintree.connect({
	environment: braintree.Environment.Sandbox,
	merchantId: process.env.BrainTree_Merchant_Id,
	publicKey: process.env.BrainTree_Public_Key,
	privateKey: process.env.BrainTree_Private_Key
});

const handler: RouteHandlerMethod<
	Server,
	IncomingMessage,
	ServerResponse,
	RouteGenericInterface,
	unknown
> = async (req, res) => {
	gateway.transaction.sale(
		{
			amount: "5.00",
			paymentMethodNonce: "nonce-from-the-client",
			options: { submitForSettlement: false },
			billing: {
				firstName: "Paul",
				lastName: "Smith",
				company: "Braintree",
				streetAddress: "1 E Main St",
				extendedAddress: "Suite 403",
				locality: "Chicago",
				region: "IL",
				postalCode: "60622",
				countryCodeAlpha2: "US"
			}
		},
		function (err, result) {
			if (err) {
				console.error(err);
				return;
			}
			if (result.success) {
				res.send("Transaction ID: " + result.transaction.id);
			} else {
				res.send(result.message);
			}
		}
	);
};

//* Export handler
export { handler };
