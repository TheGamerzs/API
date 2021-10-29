import "source-map-support/register";

import * as Sentry from "@sentry/node";
import { Integrations } from "@sentry/tracing";
import { BaseRedisCache } from "apollo-server-cache-redis";
import { ApolloServerPluginDrainHttpServer, ApolloServerPluginLandingPageDisabled } from "apollo-server-core";
import { ApolloServer } from "apollo-server-fastify";
import fastify, { FastifyContext } from "fastify";
import Redis from "ioredis";
import { MongoClient } from "mongodb";
import pEvent from "p-event";

import appUpdate from "./generic/appUpdate";
import ffUpdates from "./generic/ffUpdates";
import dataSources from "./util/dataSources";
import fastifyAppClosePlugin from "./util/fastifyAppClosePlugin";
import deleteScience from "./v2/deleteScience";
import versions from "./v2/versions";
import { resolvers } from "./v3/resolvers";
import { typeDefs } from "./v3/typeDefinition";

if (process.env.NODE_ENV !== "production")
	require("dotenv").config({ path: "../../.env" });

Sentry.init({
	dsn: process.env.SENTRY_DSN,
	enabled: process.env.NODE_ENV === "production",
	environment: process.env.NODE_ENV,
	integrations: [new Integrations.Mongo()],
	sampleRate: 0.05
});

export const mongodb = new MongoClient(process.env.MONGO_URL!, {
		appName: "PreMiD-API-Worker"
	}),
	redis = new Redis(process.env.REDIS_URL || "localhost"),
	baseRedisCache = new BaseRedisCache({
		client: redis
	}),
	dSources = dataSources(),
	app = fastify();

export let server: ApolloServer<FastifyContext>;

async function run() {
	server = new ApolloServer({
		typeDefs: await typeDefs,
		resolvers: await resolvers,
		dataSources: () => dSources,
		introspection: true,
		formatError(err) {
			if (err.extensions?.code === "INTERNAL_SERVER_ERROR")
				Sentry.captureException(err.extensions.exception);

			return err;
		},
		cache: baseRedisCache,
		plugins: [
			fastifyAppClosePlugin(app),
			ApolloServerPluginDrainHttpServer({ httpServer: app.server }),
			ApolloServerPluginLandingPageDisabled()
		]
	});

	await Promise.all([
		mongodb.connect(),
		pEvent(redis, "connect"),
		server.start()
	]);

	app.addHook("onError", (_, _1, error, done) => {
		Sentry.captureException(error);
		done();
	});

	app.addHook("onRequest", async (req, reply) => {
		//@ts-ignore
		req.responseTimeCalc = process.hrtime();
		reply.headers({
			"X-Response-Time": process.hrtime(),
			"Access-Control-Allow-Origin": "*",
			"Access-Control-Allow-Headers":
				"Origin, X-Requested-With, Content-Type, Accept"
		});
		return;
	});

	app.addHook("onSend", async (req, reply) => {
		//@ts-ignore
		const diff = process.hrtime(req.responseTimeCalc);
		reply.headers({
			"X-Response-Time": diff[0] * 1e3 + diff[1] / 1e6,
			"X-Powered-By": "PreMiD"
		});
		return;
	});

	app.register(server.createHandler({ path: "/v3" }));
	app.get("/v2/science/:identifier", deleteScience);
	app.get("/v2/versions", versions);
	app.get("/firefox/updates", ffUpdates);
	app.get("/app/update", appUpdate);
	app.get("/app/update/*", appUpdate);

	app
		.listen(process.env.PORT || 3001, process.env.HOST || "0.0.0.0")
		.then(url => {
			console.log(`🚀 API Listening on ${url}`);
		});
}

run();
