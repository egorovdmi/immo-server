import { NextFunction } from "connect";
import { Request, Response } from "express";
import { LowdbSync } from "lowdb";
import { Logger } from "pino";

import Crawler from "../crawler";

export default class CrawlerApi {
  constructor(
    private db: LowdbSync<any>,
    private logger: Logger,
    private crawler: Crawler
  ) {}

  public list(request: Request, response: Response, next?: NextFunction) {
    const { id: userId } = (request as any).user;
    const crawlerItems = this.db
      .get("crawlerItems")
      .filter({ userId })
      .values();

    response.json(crawlerItems);
  }

  public add(request: Request, response: Response, next?: NextFunction) {
    const { url } = request.body;
    const { id: userId } = (request as any).user;

    this.db
      .get("crawlerItems")
      .push({ url, userId, lastTimeCrawled: null })
      .write();

    this.crawler.crawl(url, userId, true);

    response.status(201).send();
  }

  public remove(request: Request, response: Response, next?: NextFunction) {
    const { url } = request.body;
    const { id: userId } = (request as any).user;

    this.db
      .get("crawlerItems")
      .remove({ url, userId })
      .write();

    response.send();
  }
}
