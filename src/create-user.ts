import * as bcrypt from "bcrypt";
import * as prompts from "prompts";
import { v4 as uuid } from "uuid";
import * as dotenv from "dotenv";
import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

dotenv.config();

const run = async () => {
  firebase.initializeApp({
    messagingSenderId: process.env.APP_FIREBASE_SERVER_ID,
    projectId: process.env.APP_FIREBASE_PROJECT_ID,
    apiKey: process.env.APP_FIREBASE_API_KEY,
    appId: process.env.APP_FIREBASE_APP_ID,
    authDomain: process.env.APP_FIREBASE_AUTH_DOMAIN,
    databaseURL: process.env.APP_FIREBASE_DATABASE_URL,
    storageBucket: process.env.APP_FIREBASE_STORAGE_BUCKET
  });

  try {
    await firebase
      .auth()
      .signInWithEmailAndPassword(
        process.env.APP_FIREBASE_LOGIN,
        process.env.APP_FIREBASE_PASSWORD
      );
  } catch (error) {
    const errorCode = error.code;
    const errorMessage = error.message;

    // tslint:disable-next-line:no-console
    console.log(
      `Error has occured. Error code: ${errorCode}, message: ${errorMessage}.`
    );
  }

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

  const database = firebase.database();
  const query = await database
    .ref("/users")
    .orderByChild("email")
    .equalTo(response.email)
    .once("value");

  if (!query.val()) {
    const databaseResponse = await database
      .ref(`/users/${id}`)
      .set({ email: response.email, hash, id, name: response.name });
    // tslint:disable-next-line:no-console
    console.log("User created");
  } else {
    // tslint:disable-next-line:no-console
    console.log("User already exists.");
  }

  process.exit();
};

run();
