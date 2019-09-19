"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const FileOpsBase_1 = require("mbake/lib/FileOpsBase");
const axios_1 = __importDefault(require("axios"));
const probe = require("probe-image-size");
const extractor = require("unfluff");
const SummarizerManager = require("node-summarizer").SummarizerManager;
const cheerio = require('cheerio');
const logger = require('tracer').console();
const yaml = require("js-yaml");
const fs = require("fs-extra");
const FileHound = require("filehound");
const sitemap_1 = require("sitemap");
class Map {
    constructor(root) {
        if (!root || root.length < 1) {
            console.info('no path arg passed');
            return;
        }
        this._root = root;
        this._rootLen = root.length;
    }
    gen() {
        const m = yaml.load(fs.readFileSync(this._root + '/map.yaml'));
        this._sitemap = sitemap_1.createSitemap({ hostname: m['hostname'] });
        const hostname = m['hostname'];
        console.log(hostname);
        const rec = FileHound.create()
            .paths(this._root)
            .match('dat.yaml')
            .findSync();
        for (let val of rec) {
            val = FileOpsBase_1.Dirs.slash(val);
            val = val.slice(0, -9);
            let dat = new FileOpsBase_1.Dat(val);
            let keys = dat.getAll();
            if (!('priority' in keys))
                continue;
            val = val.substring(this._rootLen);
            keys.url = val;
            this._sitemap.add(keys);
        }
        let xml = this._sitemap.toString(true);
        fs.writeFileSync(this._root + '/sitemap.xml', xml);
        console.info(' Sitemap ready', xml);
    }
}
exports.Map = Map;
class Scrape {
    constructor() {
        axios_1.default.defaults.responseType = 'document';
    }
    tst() {
        const u1 = 'https://www.nbcnews.com/think/opinion/why-trump-all-americans-must-watch-ava-duvernay-s-central-ncna1019421';
        this.s(u1).then(function (ret) {
            console.log(ret);
        });
    }
    s(url, selector) {
        return new Promise(function (resolve, reject) {
            try {
                console.info(url);
                axios_1.default.get(url).then(function (response) {
                    let ret = new Object();
                    const $ = cheerio.load(response.data);
                    if (!selector)
                        selector = 'body';
                    const textTags = $(selector);
                    let full_text = textTags.text();
                    let img = [];
                    $('img').each(function () {
                        img.push($(this).attr('src'));
                    });
                    ret['img'] = img;
                    let video = [];
                    $('video').each(function () {
                        video.push($(this).attr('src'));
                    });
                    ret['video'] = video;
                    let a = [];
                    $('a').each(function () {
                        let href = $(this).attr('href');
                        if (href.includes('javascript:'))
                            return;
                        if (href.includes('mailto:'))
                            return;
                        var n = href.indexOf('?');
                        if (n > 0)
                            href = href.substring(0, n);
                        a.push(href);
                    });
                    ret['href'] = a;
                    let data = extractor.lazy(response.data);
                    ret['url'] = data.canonicalLink();
                    ret['id'] = data.canonicalLink();
                    ret['title'] = data.softTitle();
                    ret['content_text'] = data.text();
                    ret['image'] = data.image();
                    ret['date_published'] = data.date();
                    ret['author'] = data.author();
                    ret['attachments'] = data.videos();
                    ret['tags'] = data.tags();
                    ret['description'] = data.description();
                    ret['title'] = Scrape.asci(ret['title']);
                    ret['content_text'] = Scrape.asci(ret['content_text']);
                    ret['description'] = Scrape.asci(ret['description']);
                    full_text = Scrape.asci(full_text);
                    const all = ret['title'] + ' ' + ret['content_text'] + ' ' + ret['description'] + ' ' + full_text;
                    const Summarizer = new SummarizerManager(all, 1);
                    ret['sentiment'] = Summarizer.getSentiment();
                    let summary = Summarizer.getSummaryByFrequency();
                    ret['content_text'] = Scrape.asci(data.description());
                    ret['description'] = summary.summary;
                    ret['word_count'] = Scrape.countWords(full_text);
                    const iurl = ret['image'];
                    if (iurl) {
                        Scrape.getImageSize(iurl).then(function (sz) {
                            ret['image_sz'] = sz;
                            resolve(ret);
                        });
                    }
                    else
                        resolve(ret);
                });
            }
            catch (err) {
                logger.warn(err);
                reject(err);
            }
        });
    }
    static getImageSize(iurl_) {
        return probe(iurl_, { timeout: 3000 });
    }
    static countWords(str) {
        return str.trim().split(/\s+/).length;
    }
    static asci(str) {
        if (!str)
            return '';
        const alpha_numeric = Array.from('\'"@,.?!abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789' + ' ');
        let filterd_string = '';
        for (let i = 0; i < str.length; i++) {
            let char = str[i];
            let index = alpha_numeric.indexOf(char);
            if (index > -1) {
                filterd_string += alpha_numeric[index];
            }
        }
        return filterd_string;
    }
}
exports.Scrape = Scrape;
module.exports = {
    Scrape, Map
};