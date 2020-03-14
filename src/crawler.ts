import axios from "axios";
import * as cheerio from "cheerio";
import { LowdbSync } from "lowdb";
import { Logger } from "pino";
import { ExposeRepository } from "repositories/expose.repository";

export default class Crawler {
  constructor(
    private db: LowdbSync<any>,
    private exposeRepository: ExposeRepository,
    private logger: Logger
  ) {}

  public start(): void {
    setInterval(() => {
      const crawlerItems = this.db.get("crawlerItems").value();
      crawlerItems.map(item => this.crawl(item.url, item.userId));
    }, 60000);
  }

  public async crawl(
    url: string,
    userId: string,
    dontSendPush = false
  ): Promise<void> {
    this.logger.info({ url, userId });
    const { data } = await axios(url);
    const $ = cheerio.load(data);

    const allExposeIds = $("a[data-go-to-expose-id]")
      .map(function() {
        return $(this).attr("data-go-to-expose-id");
      })
      .toArray();
    const uniqueEposeIds = [...new Set(allExposeIds)];

    const crawlPromises = uniqueEposeIds.map(id =>
      this.crawlExpose(id.toString(), userId, dontSendPush)
    );

    Promise.all(crawlPromises).catch(error =>
      this.logger.error(error, "Crawl Expose error")
    );

    this.db
      .get("crawlerItems")
      .find({ url, userId })
      .assign({ lastTimeCrawled: +new Date() })
      .write();

    this.logger.info("done");
  }

  private async crawlExpose(
    id: string,
    userId: string,
    dontSendPush: boolean
  ): Promise<void> {
    this.logger.info(`crawlExpose ${id} ${userId}`);

    if (await this.exposeRepository.single(id, userId)) {
      return;
    }

    const url = `https://www.immobilienscout24.de/expose/${id}`;
    const { data } = await axios(url);
    const $ = cheerio.load(data);

    const title = $("#expose-title")
      .text()
      .trim();
    const availableFrom = $(".is24qa-bezugsfrei-ab")
      .text()
      .trim();
    const livingArea = $(".is24qa-wohnflaeche-ca")
      .text()
      .trim();
    const rooms = $(".is24qa-zimmer")
      .text()
      .trim();
    const type = $(".is24qa-typ")
      .text()
      .trim();
    const lastRenovated = $(".is24qa-modernisierung-sanierung")
      .text()
      .trim();
    const constructionYear = $(".is24qa-baujahr")
      .text()
      .trim();
    const energyType = $(".is24qa-heizungsart")
      .text()
      .trim();
    const description = $(".is24-text")
      .text()
      .trim();
    let address = $(".address-block")
      .first()
      .text()
      .trim();
    const coldRent = $(".is24qa-kaltmiete")
      .first()
      .text()
      .trim();
    const utilities = $(".is24qa-nebenkosten")
      .text()
      .replace("+", "")
      .trim();
    const heatingCosts = $(".is24qa-heizkosten")
      .text()
      .replace("+", "")
      .trim();
    const totalRent = $(".is24qa-gesamtmiete")
      .text()
      .trim();
    const images = $(".sp-image")
      .map(function() {
        return $(this).data("src");
      })
      .toArray()
      .map((item: any) => item as string);

    if (address.includes("Anbieter")) {
      address = address.match(/\d+/)[0];
    }

    if (title.includes("Modell")) {
      return;
    }

    this.logger.info(
      {
        address,
        availableFrom,
        coldRent,
        constructionYear,
        description,
        energyType,
        heatingCosts,
        id,
        images,
        lastRenovated,
        livingArea,
        rooms,
        title,
        totalRent,
        type,
        utilities
      },
      "Expose data"
    );

    await this.exposeRepository.create({
      address,
      availableFrom,
      coldRent,
      constructionYear,
      createdAt: Date.now(),
      description,
      energyType,
      heatingCosts,
      id,
      images,
      lastRenovated,
      livingArea,
      rooms,
      title,
      totalRent,
      type,
      userId,
      utilities
    });

    this.logger.info({ dontSendPush });

    if (!dontSendPush) {
      this.sendPush(
        title,
        [
          `Bezugsfrei: ${availableFrom}`,
          `Gesamtmiete: ${totalRent}`,
          `Fläche: ${livingArea}`,
          `Baujahr ${constructionYear}`,
          `Adresse: ${address}`,
          `Zimmer: ${rooms}`,
          `Heizugsart: ${energyType}`,
          `Kaltmiete: ${coldRent}`,
          `Heizkosten: ${heatingCosts}`,
          `Nebenkosten: ${utilities}`,
          `Renoviert: ${lastRenovated}`,
          `Type: ${type}`
        ].join("\n"),
        id,
        userId
      );
    }
  }

  private async sendPush(
    title: string,
    message: string,
    exposeId: string,
    userId: string
  ) {
    const tokens = this.db
      .get("tokens")
      .filter({ userId })
      .value();

    tokens.forEach(item => {
      const data = {
        data: {
          notification: {
            body: message,
            data: { exposeId, url: `${process.env.FRONTEND_URI}/${exposeId}` },
            title
          }
        },
        to: (item as any).token
      };

      this.logger.info(data, "Sending push");

      axios({
        data,
        headers: {
          Authorization: `key=${process.env.FCM_AUTHORIZATION_KEY}`
        },
        method: "POST",
        url: "https://fcm.googleapis.com/fcm/send"
      }).catch(err =>
        this.logger.error(
          {
            data: err.response.data,
            status: err.response.status
          },
          "Sending push failed"
        )
      );
    });
  }
}
