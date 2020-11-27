require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const https = require('https');
const http = require('http');
const fs = require('fs');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
const port = 5000;

if(process.env.NODE_ENV === 'production') {
  //static folder
  app.use(express.static(__dirname + '/public'));

  //handle SPA
  app.get(/.*/, (req, res) => res.sendFile(__dirname + '/public/index.html'));
}

app.get('/saka', (req, res) => {
  try {
    fs.readFile('./data/sakaMembers.json', function (error, data) {
      if (error) {
        throw error
      }

    res.send(JSON.parse(data))
    })
  } catch (error) {
    console.log(error.message)
  }
});

app.get('/crawl',async (req, res) => {
  res.send(await getAllDataFromOfficalWebsite());
});

app.listen(process.env.PORT || port, () => console.log(`express listrn at port ${port}`));

async function getAllDataFromOfficalWebsite() {
  /*const dataHina = getNogizaka46Website().then((val) => {
    return val;
  });*/
  let res = await Promise.all([getHinatazaka46Website(),getSakurazaka46Website(),getNogizaka46Website()]);
  return JSON.stringify(res);
}

function getHinatazaka46Website() {
  const url ='https://www.hinatazaka46.com/s/official/?ima=0000';
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {

      res.setEncoding('utf8');
      let rawData = '';

      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          const dom = new JSDOM(`${rawData}`);

          const news = [...dom.window.document.querySelectorAll(".p-news__item a")];
          const blogs = [...dom.window.document.querySelectorAll(".p-blog__item a")];

          var newsDatas = news.map((dataItem) => {
            let context = myDataTrim(dataItem.textContent);
            return {
              url: 'https://www.hinatazaka46.com' + dataItem.getAttribute("href"),
              date: context[0],
              differ: context[1],
              title: context[2],
              group: 'Hinatazaka46'
            }
          });

          var blogsDatas = blogs.map((dataItem) => {
            let context = myDataTrim(dataItem.textContent);
            return {
              url: 'https://www.hinatazaka46.com' + dataItem.getAttribute("href"),
              title: context[0],
              name: context[1],
              time: context[2],
              group: 'Hinatazaka46'
            }
          });
          //console.log(blogsDatas);

          resolve({
            newsDatas: newsDatas,
            blogsDatas: blogsDatas
          });
        } catch (e) {
          reject(e.message);
        }
      });
    }).on('error', (e) => {
      reject(`Got error: ${e.message}`);
    });
  });
}

function getSakurazaka46Website() {
  const url ='https://sakurazaka46.com/s/s46/?ima=0259';
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {

      res.setEncoding('utf8');
      let rawData = '';

      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          const dom = new JSDOM(`${rawData}`);

          const news = [...dom.window.document.querySelectorAll(".com-news-part a")];
          let blogs = [...dom.window.document.querySelectorAll(".top-blog-slicks a")];

          var newsDatas = news.map((dataItem) => {
            let context = myDataTrim(dataItem.textContent);
            return {
              url: 'https://sakurazaka46.com' + dataItem.getAttribute("href"),
              date: context[1],
              differ: context[0],
              title: context[2],
              group: 'Sakurazaka46'
            }
          });

          var blogsDatas = blogs.map((dataItem) => {
            let context = myDataTrim(dataItem.textContent);
            return {
              url: 'https://sakurazaka46.com' + dataItem.getAttribute("href"),
              title: context[2],
              name: context[0],
              time: context[1],
              group: 'Sakurazaka46'
            }
          });

          resolve({
            newsDatas: newsDatas,
            blogsDatas: blogsDatas
          });
        } catch (e) {
          reject(e.message);
        }
      });
    }).on('error', (e) => {
      reject(`Got error: ${e.message}`);
    });
  });
}

function getNogizaka46Website() {
  const url ='http://www.nogizaka46.com/';
  return new Promise((resolve, reject) => {
    http.get(url, (res) => {

      res.setEncoding('utf8');
      let rawData = '';

      res.on('data', (chunk) => {
        rawData += chunk;
      });

      res.on('end', () => {
        try {
          const dom = new JSDOM(`${rawData}`);

          const news = [...dom.window.document.querySelectorAll("#idxnews li")];
          let newsUrls = [...dom.window.document.querySelectorAll("#idxnews li a")];
          newsUrls = newsUrls.map((urlItem) => {
            return urlItem.getAttribute("href");
          });
          const blogs = [...dom.window.document.querySelectorAll("#blogmodule li")];
          let blogsUrls = [...dom.window.document.querySelectorAll("#blogmodule li .pic a")];
          blogsUrls = blogsUrls.map((urlItem) => {
            return urlItem.getAttribute("href");
          });


          var newsDatas = news.map((dataItem, index) => {
            let context = myDataTrim(dataItem.textContent);
            return {
              url: newsUrls[index],
              date: context[0],
              differ: '',
              title: context[1],
              group: 'Nogizaka46'
            }
          });

          var blogsDatas = blogs.map((dataItem, index) => {
            let context = myDataTrim(dataItem.textContent);
            return {
              url: blogsUrls[index],
              title: context[2],
              name: context[1],
              time: context[0],
              group: 'Nogizaka46'
            }
          });

          resolve({
            newsDatas: newsDatas,
            blogsDatas: blogsDatas
          });
        } catch (e) {
          reject(e.message);
        }
      });
    }).on('error', (e) => {
      reject(`Got error: ${e.message}`);
    });
  });
}

function myDataTrim(data) {
  let result = data.replace(/\n/g, "|").split("|");
  result = result.map((item) => {
    return item.trim();
  });
  result = result.filter((item) => {
    return item.length > 0;
  });
  return [...result];
}
