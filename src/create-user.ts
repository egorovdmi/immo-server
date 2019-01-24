import * as bcrypt from "bcrypt";
import * as lowdb from "lowdb";
import * as FileSync from "lowdb/adapters/FileSync";
import * as prompts from "prompts";
import { v4 as uuid } from "uuid";

const run = async () => {
  const adapter = new FileSync("db.json");
  const db = lowdb(adapter);

  const response = await prompts([
    {
      message: "Please enter your EMail.",
      name: "email",
      type: "text"
    },
    {
      message: "Please enter your Name.",
      name: "name",
      type: "text"
    },
    {
      message: "Enter your Password.",
      name: "password",
      style: "password",
      type: "text"
    }
  ]);

  const id = uuid();
  const hash = await bcrypt.hash(response.password, 10);

  if (
    !db
      .get("users")
      .find({ email: response.email })
      .value()
  ) {
    db.get("users")
      .push({ email: response.email, hash, id, name: response.name })
      .write();

    console.log("User created");
  }
};

run();
