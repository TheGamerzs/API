import { cache } from "../../index";
import { RequestHandler } from "express";

let products = cache.get("merch");

cache.on("update", (_, data) => (products = data), {
	only: "merch",
});

let categories = [];
let types = {};

//* Request Handler
const handler: RequestHandler = async (req, res) => {
	products
		.filter(document => document.title === "categories")[0]
		["list"].forEach((category, index) => {
			categories[index] = category;
			types[category] = [];
		});

	products
		.filter(
			document => document.category != undefined && document.status === "Live"
		)
		.forEach(product_info => {
			types[product_info.category].push(product_info);
		});

	res.send({ Products: types, Categories: categories });
};

//* Export handler
export { handler };
