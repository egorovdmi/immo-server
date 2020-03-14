import { v4 as uuid } from "uuid";
import * as bcrypt from "bcrypt";
import * as firebase from "firebase/app";

export interface User {
  id: string;
  email: string;
  name: string;
  hash: string;
}

export class UserRepository {
  public async single(email: string): Promise<User> {
    const database = firebase.database();
    const query = await database
      .ref("/users")
      .orderByChild("email")
      .equalTo(email)
      .once("value");

    const value = query.val();

    if (!value) {
      return null;
    }

    const userId = Object.keys(value)[0];
    const result = value[userId] as User;
    return result;
  }

  public async create(
    email: string,
    name: string,
    password: string
  ): Promise<User> {
    const id = uuid();
    const hash = await bcrypt.hash(password, 10);

    const database = firebase.database();
    const databaseResponse = await database
      .ref(`/users/${id}`)
      .set({ email, hash, id, name });

    return { id, email, name, hash };
  }
}
