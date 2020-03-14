import * as firebase from "firebase/app";

export interface Expose {
  id: string;
  address: string;
  availableFrom: string;
  coldRent: string;
  constructionYear: string;
  createdAt: number;
  description: string;
  energyType: string;
  heatingCosts: string;
  images: string[];
  lastRenovated: string;
  livingArea: string;
  rooms: string;
  title: string;
  totalRent: string;
  type: string;
  userId: string;
  utilities: string;
}

export class ExposeRepository {
  public async single(id: string, userId: string): Promise<Expose> {
    const database = firebase.database();
    const query = await database
      .ref(`/expose/${userId}`)
      .orderByChild("id")
      .equalTo(id)
      .once("value");

    const value = query.val();

    if (!value) {
      return null;
    }

    const exposeKey = Object.keys(value)[0];
    const result = value[exposeKey] as Expose;
    return result;
  }

  public async create(expose: Expose): Promise<void> {
    const database = firebase.database();
    await database.ref(`/expose/${expose.userId}`).push(expose);
  }

  public async list(userId: string): Promise<Expose[]> {
    const database = firebase.database();
    const query = await database.ref(`/expose/${userId}`).once("value");

    const hashTable = query.val();

    if (!hashTable) {
      return [];
    }

    const exposeKeys = Object.keys(hashTable);
    const result = exposeKeys.map((key: string) => hashTable[key] as Expose);
    return result;
  }
}
