import { RouteGenericInterface, RouteHandlerMethod } from "fastify/types/route";
import { IncomingMessage, Server, ServerResponse } from "http";
import { getDiscordUser } from "../../../util/functions/getDiscordUser";
import { pmdDB } from "../../../db/client";

//* Define credits collection
const promotions = pmdDB.collection("merchPromotions");

//* Request Handler
const handler: RouteHandlerMethod<
	Server,
	IncomingMessage,
	ServerResponse,
	RouteGenericInterface,
	unknown
> = async (req, res) => {
	if (!req.params["code"]) return res.send(404);

	let userPromo;
	let promo;

	if (req.params["token"]) {
		getDiscordUser(req.params["token"]).then(async dUser => {
			userPromo = await promotions.findOne({
				code: req.params["code"],
				userId: dUser.id
			});
		});
	}

	promo = await promotions.findOne({
		code: req.params["code"],
		userId: null
	});

	if (userPromo) {
		if (
			(userPromo.useLimit > 0 || userPromo.useLimit == null) &&
			userPromo.expires > Date.now()
		) {
			return res.send(userPromo);
		} else if (userPromo.useLimit === 0) {
			return res.send({ string: "checkout.maximumUses" });
		} else if (userPromo.expires <= Date.now()) {
			return res.send({ string: "checkout.expiredCode" });
		}
	} else if (promo) {
		if (
			(promo.useLimit > 0 || promo.useLimit == null) &&
			promo.expires > Date.now()
		) {
			return res.send(promo);
		} else if (promo.expires <= Date.now()) {
			return res.send({ string: "checkout.expiredCode" });
		} else if (promo.useLimit === 0) {
			return res.send({ string: "checkout.maximumUses" });
		} else {
			return res.send({ string: "checkout.invalidCode" });
		}
	} else {
		return res.send({ string: "checkout.invalidCode" });
	}
};

//* Export handler
export { handler };
