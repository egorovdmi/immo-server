import * as bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { LowdbSync } from "lowdb";
import { Logger } from "pino";
export default class UserApi {
  constructor(private db: LowdbSync<any>, private logger: Logger) {}

  public async createToken(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const data: any = this.db
      .get("users")
      .find({ email: request.body.email })
      .value();

    if (!data) {
      response.status(404).send();
      return;
    }

    const isValid = await bcrypt.compare(request.body.password, data.hash);

    if (!isValid) {
      response.status(401).send();
      return;
    }

    const user = {
      email: data.email,
      id: data.id,
      name: data.name
    };

    const token = jwt.sign(user, process.env.JWT_SECRET);
    response.send({ token });
  }
}
