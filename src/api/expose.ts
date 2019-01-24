import { NextFunction } from "connect";
import { Request, Response } from "express";
import { LowdbSync } from "lowdb";
import { Logger } from "pino";

export default class UserApi {
  constructor(private db: LowdbSync<any>, private logger: Logger) {}

  public list(request: Request, response: Response, next?: NextFunction) {
    const { id: userId } = (request as any).user;

    const expose = this.db
      .get("expose")
      .filter({ userId })
      .values()
      .sortBy("createdAt");

    response.json(expose);
  }

  public hide(request: Request, response: Response, next?: NextFunction) {
    const { id } = request.body;
    const { id: userId } = (request as any).user;

    const expose = this.db
      .get("expose")
      .find({ id, userId })
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

  public get(request: Request, response: Response, next?: NextFunction) {
    const { id } = request.params;
    const { id: userId } = (request as any).user;

    const expose = this.db
      .get("expose")
      .find({ id, userId })
      .value();

    response.json(expose);
  }
}
