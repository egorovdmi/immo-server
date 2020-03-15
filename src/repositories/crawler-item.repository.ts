import { Repository } from "./repository";

export interface CrawlerItem {
  id: string;
  url: string;
  userId: string;
  lastTimeCrawled: number;
}

export class CrawlerItemRepository extends Repository<CrawlerItem> {
  constructor() {
    super("/crowler-items");
  }
}
