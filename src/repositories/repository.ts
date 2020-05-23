import * as firebase from "firebase/app";
import { Logger } from "pino";

export interface Entity {
  id: string;
  userId: string;
}

export class Repository<T extends Entity> {
  private cache: T[] = [];
  private isSyncedWithRemote = false;

  constructor(private resourceBasePath: string, private logger: Logger) { 
  }

  public async single(id: string, userId: string): Promise<T> {
    const cachedItem: T = this.singleFromCache(id, userId);
    if (cachedItem) {
      return cachedItem;
    }

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
    this.putItemToCache(result);
    return result;
  }

  public async create(entity: T): Promise<void> {
    const database = firebase.database();
    await database
      .ref(`${this.resourceBasePath}/${entity.userId}`)
      .push(entity);

    this.updateCachedItem(entity);
  }

  public async list(userId: string): Promise<T[]> {
    const allItems: T[] = await this.all();
    return allItems.filter((item: T) => item.userId === userId);
  }

  public async all(): Promise<T[]> {
    if (this.isSyncedWithRemote) {
      return this.cache;
    }

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

    this.updateCache(result);
    this.isSyncedWithRemote = true;
    return result;
  }

  public async remove(id: string, userId: string): Promise<boolean> {
    const storedEntityPath = await this.getResourcePath(id, userId);
    if (!storedEntityPath) {
      return false;
    }

    const database = firebase.database();
    await database.ref(storedEntityPath).remove();
    this.removeItemFromCache(id, userId);

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
    this.updateCachedItem(entity);
    return entity;
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

  private singleFromCache(id: string, userId: string): T {
    return this.cache.find((item: T) => item.id === id && item.userId === userId);
  }

  private putItemToCache(item: T): void {
    this.cache.push(item);
  }

  private updateCachedItem(entity: T): void {
    const cachedItem: T = this.singleFromCache(entity.id, entity.userId);
    if (cachedItem) {
      const keys = Object.keys(entity);
      keys.forEach((key: string) => cachedItem[key] = entity[key]);
    } else {
      this.putItemToCache(entity);
    }
  }

  private removeItemFromCache(id: string, userId: string): void {
    const cachedItem: T = this.singleFromCache(id, userId);
    if (cachedItem) {
      const index = this.cache.indexOf(cachedItem);
      this.cache.splice(index, 1);
    }
  }

  private updateCache(entities: T[]): void {
    this.cache = [...entities];
  }
}
