import * as firebase from "firebase/app";

export interface Entity {
  id: string;
  userId: string;
}

export class Repository<T extends Entity> {
  constructor(private resourceBasePath: string) {}

  public async single(id: string, userId: string): Promise<T> {
    const database = firebase.database();
    const query = await database
      .ref(`${this.resourceBasePath}/${userId}`)
      .orderByChild("id")
      .equalTo(id)
      .once("value");

    const value = query.val();

    if (!value) {
      return null;
    }

    const entityKey = Object.keys(value)[0];
    const result = value[entityKey] as T;
    return result;
  }

  public async create(entity: T): Promise<void> {
    const database = firebase.database();
    await database
      .ref(`${this.resourceBasePath}/${entity.userId}`)
      .push(entity);
  }

  public async list(userId: string): Promise<T[]> {
    const database = firebase.database();
    const query = await database
      .ref(`${this.resourceBasePath}/${userId}`)
      .once("value");

    const hashTable = query.val();

    if (!hashTable) {
      return [];
    }

    const entityKeys = Object.keys(hashTable);
    const result = entityKeys.map((key: string) => hashTable[key] as T);
    return result;
  }

  public async all(): Promise<T[]> {
    const database = firebase.database();
    const query = await database.ref(`${this.resourceBasePath}`).once("value");

    const hashTable = query.val();

    if (!hashTable) {
      return [];
    }

    const userIds = Object.keys(hashTable);
    const result = userIds.reduce((acc: T[], userId: string) => {
      const entityKeys = Object.keys(hashTable[userId]);
      const entities = entityKeys.map(
        (entityKey: string) => hashTable[userId][entityKey]
      );
      return [...acc, ...entities];
    }, []) as T[];
    return result;
  }

  public async remove(id: string, userId: string): Promise<boolean> {
    const storedEntityPath = await this.getResourcePath(id, userId);
    if (!storedEntityPath) {
      return false;
    }

    const database = firebase.database();
    await database.ref(storedEntityPath).remove();

    return true;
  }

  public async update(entity: T): Promise<T> {
    const storedEntityPath = await this.getResourcePath(
      entity.id,
      entity.userId
    );
    if (!storedEntityPath) {
      return null;
    }

    const database = firebase.database();
    await database.ref(storedEntityPath).set(entity);
  }

  private async getResourcePath(id: string, userId: string): Promise<string> {
    const database = firebase.database();
    const query = await database
      .ref(`${this.resourceBasePath}/${userId}`)
      .orderByChild("id")
      .equalTo(id)
      .once("value");

    const value = query.val();

    if (!value) {
      return null;
    }

    return `${this.resourceBasePath}/${userId}/${Object.keys(value)[0]}`;
  }
}
