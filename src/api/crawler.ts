import { NextFunction } from "connect";
import { Request, Response } from "express";
import { LowdbSync } from "lowdb";
import { Logger } from "pino";

import Crawler from "../crawler";
import { CrawlerItemRepository } from "../repositories/crawler-item.repository";

export default class CrawlerApi {
  constructor(
    private crawlerItemRepository: CrawlerItemRepository,
    private logger: Logger,
    private crawler: Crawler
  ) {}

  public async list(request: Request, response: Response, next?: NextFunction) {
    const { id: userId } = (request as any).user;
    const crawlerItems = await this.crawlerItemRepository.list(userId);

    response.json(crawlerItems);
  }

  public async add(request: Request, response: Response, next?: NextFunction) {
    const { url } = request.body;
    const { id: userId } = (request as any).user;

    await this.crawlerItemRepository.create({
      id: url,
      url,
      userId,
      lastTimeCrawled: null
    });
    this.crawler.crawl(url, userId, true);

    response.status(201).send();
  }

  public async remove(
    request: Request,
    response: Response,
    next?: NextFunction
  ) {
    const { url } = request.body;
    const { id: userId } = (request as any).user;

    await this.crawlerItemRepository.remove(url, userId);

    response.send();
  }
}
