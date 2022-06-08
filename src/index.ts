import fetch from "node-fetch";
import * as cheerio from "cheerio";
const Url = require("url-parse");
import * as fs from "fs";
import * as path from "path";

const seenUrls: { [key: string]: boolean } = {};

const getUrl = (link: string, host: any, protocol: any) => {
  if (link.includes("https")) {
    return link;
  } else if (link.startsWith("/")) {
    return `${protocol}//${host}${link}`;
  } else {
    return `${protocol}//${host}/${link}`;
  }
};

const crawler = async (url: string) => {
  try {
    if (seenUrls[url]) return;

    console.log(`Visiting ${url}`);
    seenUrls[url] = true;
    const pasrsedUrl = new Url(url);
    const response = await fetch(url);

    const html = await response.text();

    const $ = cheerio.load(html);
    const links = $("a")
      .map((i, el) => $(el).attr("href"))
      .get();

    const imageUrls = $("img")
      .map((i, el) => $(el).attr("src"))
      .get();

    console.log(imageUrls);
    imageUrls.forEach(async (imageUrl) => {
      const imageResponse = await fetch(
        getUrl(imageUrl, pasrsedUrl.hostname, pasrsedUrl.protocol)
      );

      const imagePath = path.basename(imageUrl);
      if (imagePath.includes("?")) {
        const imageName = imagePath.split("?")[0];
        const image = await imageResponse.buffer();
        fs.writeFileSync(`./images/${imageName}`, image);
      } else {
        const image = await imageResponse.buffer();
        fs.writeFileSync(`./images/${imagePath}`, image);
      }
    });

    links
      .filter((link) => link.startsWith(pasrsedUrl))
      .forEach((link) => {
        crawler(getUrl(link, pasrsedUrl.hostname, pasrsedUrl.protocol));
      });
  } catch (e) {
    console.log("error starts here ===>>>>");
    console.log(e);
    return null;
  }
};

crawler("https://www.marvel.com/");
