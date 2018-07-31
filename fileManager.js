var request = require('request');
var cheerio = require('cheerio');

const URL = 'https://vbbros.net/audiocrumbs';
const generic = `${URL}/generic.mp3`;

const fetchFiles = (callback) => {
  request(`${URL}/custom`, function (error, response, html) {
    if (!error && response.statusCode == 200) {
      const $ = cheerio.load(html);
      const custom = [];
      $('li:not(:first-child) a').each((i, a) => custom.push(`${URL}/custom/${$(a).attr('href')}`));
      callback({
        generic,
        custom,
        originalSrc: [...custom],
      });
    }
  });
}

module.exports = fetchFiles