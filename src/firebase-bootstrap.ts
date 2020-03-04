import * as firebase from "firebase/app";
import "firebase/auth";
import "firebase/database";

export async function firebaseBootstrap(): Promise<void> {
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
}
