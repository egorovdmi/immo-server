import * as prompts from "prompts";
import * as dotenv from "dotenv";
import { firebaseBootstrap } from "firebase-bootstrap";
import { UserRepository } from "user.repository";

dotenv.config();

const run = async () => {
  await firebaseBootstrap();

  const userRepository = new UserRepository();
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

  let user = await userRepository.single(response.email);

  if (!user) {
    user = await userRepository.create(
      response.email,
      response.name,
      response.password
    );
    // tslint:disable-next-line:no-console
    console.log("User created");
  } else {
    // tslint:disable-next-line:no-console
    console.log("User already exists.");
  }

  process.exit();
};

run();
