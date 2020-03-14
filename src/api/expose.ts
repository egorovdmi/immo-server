import { NextFunction } from "connect";
import { Request, Response } from "express";
import { LowdbSync } from "lowdb";
import * as _ from "lodash";
import { Logger } from "pino";
import { ExposeRepository } from "repositories/expose.repository";

export default class UserApi {
  constructor(
    private db: LowdbSync<any>,
    private exposeRepository: ExposeRepository,
    private logger: Logger
  ) {}

  public async list(request: Request, response: Response, next?: NextFunction) {
    const { id: userId } = (request as any).user;

    const exposes = await this.exposeRepository.list(userId);
    const result = _.orderBy(exposes, ["createdAt"], ["asc"]);

    response.json(result);
  }

  public hide(request: Request, response: Response, next?: NextFunction) {
    const { id, createdAt } = request.body;
    const { id: userId } = (request as any).user;

    const expose = this.db
      .get("expose")
      .find({ id, createdAt, userId })
      .assign({ isHidden: true })
      .write();

    response.json(expose);
  }

  public contacted(request: Request, response: Response, next?: NextFunction) {
    const { id } = request.body;
    const { id: userId } = (request as any).user;

    const expose = this.db
      .get("expose")
      .find({ id, userId })
      .assign({ hasBeenContacted: true })
      .write();

    response.json(expose);
  }

  public async get(request: Request, response: Response, next?: NextFunction) {
    const { id } = request.params;
    const { id: userId } = (request as any).user;

    const expose = await this.exposeRepository.single(id, userId);
    response.json(expose);
  }
}
