import { Repository } from "./repository";

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
  isHidden?: boolean;
  hasBeenContacted?: boolean;
}

export class ExposeRepository extends Repository<Expose> {
  constructor() {
    super("/expose");
  }
}
