import { NextFunction, Request, Response } from 'express';
import { LowdbSync } from 'lowdb';
import { Logger } from 'pino';

export default class PushApi {
  constructor(private db: LowdbSync<any>, private logger: Logger) {}

  public subscribe(request: Request, response: Response, next: NextFunction) {
    const { id: userId } = (request as any).user;
    const { token } = request.body;

    this.logger.info({ method: 'subscribe', userId, token });

    if (
      !this.db
        .get('tokens')
        .find({ userId, token })
        .value()
    ) {
      this.db
        .get('tokens')
        .push({ userId, token })
        .write();
    }

    response.status(202).send();
  }

  public unsubscribe(request: Request, response: Response, next: NextFunction) {
    const { id: userId } = (request as any).user;
    const { token } = request.body;

    this.db
      .get('tokens')
      .remove({ userId, token })
      .write();

    response.status(202).send();
  }
}
