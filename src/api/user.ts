import * as bcrypt from "bcrypt";
import { NextFunction, Request, Response } from "express";
import * as jwt from "jsonwebtoken";
import { Logger } from "pino";
import { UserRepository, User } from "user.repository";

export default class UserApi {
  constructor(private userRepository: UserRepository, private logger: Logger) {}

  public async createToken(
    request: Request,
    response: Response,
    next: NextFunction
  ) {
    const dbUser: User = await this.userRepository.single(request.body.email);

    if (!dbUser) {
      response.status(404).send();
      return;
    }

    const isValid = await bcrypt.compare(request.body.password, dbUser.hash);

    if (!isValid) {
      response.status(401).send();
      return;
    }

    const user = {
      email: dbUser.email,
      id: dbUser.id,
      name: dbUser.name
    };

    const token = jwt.sign(user, process.env.JWT_SECRET);
    response.send({ token });
  }
}
