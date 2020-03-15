import * as bodyParser from "body-parser";
import * as cors from "cors";
import * as dotenv from "dotenv";
import * as express from "express";
import * as jwt from "express-jwt";
import { Server } from "http";
import * as lowdb from "lowdb";
import { LowdbSync } from "lowdb";
import * as FileSync from "lowdb/adapters/FileSync";
import * as pino from "pino";
import { Logger } from "pino";
import * as pinoHttp from "pino-http";

import CrawlerApi from "./api/crawler";
import ExposeApi from "./api/expose";
import PushApi from "./api/push";
import UserApi from "./api/user";

import Crawler from "./crawler";
import { firebaseBootstrap } from "./firebase-bootstrap";
import { UserRepository } from "./repositories/user.repository";
import { ExposeRepository } from "./repositories/expose.repository";
import { CrawlerItemRepository } from "./repositories/crawler-item.repository";

dotenv.config();

class App {
  private server: Server;
  private logger: Logger;
  private db: LowdbSync<any>;
  private app: express.Application;
  private crawler: Crawler;
  private userRepository: UserRepository;
  private exposeRepository: ExposeRepository;
  private crawlerItemRepository: CrawlerItemRepository;

  constructor() {
    this.app = express();
    this.server = new Server(this.app);
    this.logger = pino({ name: "immo" });
    this.userRepository = new UserRepository();
    this.exposeRepository = new ExposeRepository();
    this.crawlerItemRepository = new CrawlerItemRepository();

    const adapter = new FileSync("db.json");
    this.db = lowdb(adapter);

    this.db
      .defaults({
        crawlerItems: [],
        expose: [],
        initialRun: true,
        tokens: [],
        users: []
      })
      .write();

    this.crawler = new Crawler(
      this.db,
      this.crawlerItemRepository,
      this.exposeRepository,
      this.logger
    );

    this.config();
    this.routes();
    this.listen();
  }

  private config(): void {
    this.app.use(cors());
    this.app.use(pinoHttp({ logger: this.logger }));
    this.app.use(bodyParser.json());
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private routes(): void {
    const userApi = new UserApi(this.userRepository, this.logger);
    const pushApi = new PushApi(this.db, this.logger);
    const exposeApi = new ExposeApi(this.exposeRepository, this.logger);
    const crawlerApi = new CrawlerApi(
      this.crawlerItemRepository,
      this.logger,
      this.crawler
    );

    const jwtMiddleware = jwt({ secret: process.env.JWT_SECRET });

    this.app.get("/", (_, res) => {
      return res.send("Hello");
    });

    this.app.post("/api/users/token", (...args) =>
      userApi.createToken(...args)
    );

    this.app.get(
      "/api/crawler",
      jwtMiddleware,
      crawlerApi.list.bind(crawlerApi)
    );

    this.app.post(
      "/api/crawler/add",
      jwtMiddleware,
      crawlerApi.add.bind(crawlerApi)
    );

    this.app.post(
      "/api/crawler/remove",
      jwtMiddleware,
      crawlerApi.remove.bind(crawlerApi)
    );

    this.app.post(
      "/api/push/subscribe",
      jwtMiddleware,
      pushApi.subscribe.bind(pushApi)
    );

    this.app.post(
      "/api/push/unsubscribe",
      jwtMiddleware,
      pushApi.unsubscribe.bind(pushApi)
    );

    this.app.get("/api/expose", jwtMiddleware, exposeApi.list.bind(exposeApi));
    this.app.get(
      "/api/expose/:id",
      jwtMiddleware,
      exposeApi.get.bind(exposeApi)
    );
    this.app.post(
      "/api/expose/hide",
      jwtMiddleware,
      exposeApi.hide.bind(exposeApi)
    );
    this.app.post(
      "/api/expose/contacted",
      jwtMiddleware,
      exposeApi.contacted.bind(exposeApi)
    );
  }

  private listen(): void {
    const port = process.env.PORT || 3000;
    this.server.listen(port, () => {
      this.logger.info(`Server listening on port ${port}`);
      this.crawler.start();
    });
  }
}

const run = async () => {
  await firebaseBootstrap();
  // tslint:disable-next-line:no-unused-expression
  new App();
};

run();
