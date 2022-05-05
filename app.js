/**
 * This is the node.js file which holds all the server side functionality for yipper. It supplies
 * the yipper data through 4 endpoints as well as provides the local server for the webpage.
 *
 * /endpoint 1
 * this endpoint gets all yip data or all yip data relative to a given search term.
 * If there is an error in the processing, an error will be thrown, otherwise, a JSON doc will
 * be populated with either all yip data, or yip data relative to the search term and will be
 * sent to the client sideJS to implement in the page
 * this endpoint is a get request
 *
 * /endpoint 2
 * this endpoint gets the necessary information sent back to the client side in JSON format of
 * a specific user's yips. If there is an error in the request, an error will be thrown.
 * This endpoint is a get request
 *
 * /endpoint 3
 * this endpoint updates the data base through a post request of the requested id. The id is posted
 * to the endpoint and then the likes count is incremented by 1 and the likes count is then sent
 * as text to the client side.
 *
 * /endpoint 4
 * this endpoint adds a new yip to the data base through a post request at the endpoint of the yip's
 * author and yip's post. It then parses the post and appends the items accordingly to a json which
 * is added to the database. Common errors that occurr and can be thrown are users that dont exist
 */

'use strict';
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const multer = require('multer');
const upload = multer();
const app = express();
let sqlite3, sqlite3db;
sqlite3 = require('sqlite3').verbose();

const CREATE_STMNT = `CREATE TABLE yips(
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT,
        yip TEXT,
        hashtag TEXT,
        likes INTEGER DEFAULT 0,
        date TEXT
    )`;

const INSERTS1 = `INSERT INTO yips (id, name, yip, hashtag, likes, date) VALUES (?, ?, ?, ?, ?, ?)`;
const INSERT_STMNT2 = `INSERT INTO yips (name, yip, hashtag, likes, date) VALUES (?, ?, ?, ?, ?)`;
const SELECT_USER = 'SELECT name, yip, hashtag, date FROM yips';
const SELECT_ALL = `SELECT * FROM yips ORDER BY id DESC`;
const SELECT_ID = `SELECT id FROM yips`;
const SELECT_LIKES = `SELECT likes FROM yips`;

const INCREMENT_LIKES = `UPDATE yips SET likes = likes + 1`;

const DB_FILE = './yipper.db';
const CSV_FILE = './original-state.csv';

app.use(bodyParser.urlencoded({extended: true}));
app.use(upload.none());
app.use(express.json());

/**
 * helper method for endpoint 1, creates JSON object of all yips from database and sends it to the
 * client
 * throws error if there is an error in the database retrieval
 * @param {Request} req request object
 * @param {Response} res response object
 * throws error if there is an error in the database retrieval
 */
function handleSearch(req, res) {
  let whereClause = " WHERE yip LIKE '%" + req.query.search + "%'";
  sqlite3db.all(SELECT_ID + whereClause, [], (err, rows) => {
    if (err) {
      throw err;
    }
    let entries = [];
    rows.forEach((row) => {
      let entry = {
        "id": row.id
      };
      entries.push(entry);
    });
    res.send(JSON.stringify({yips: entries}));
  });
}

/**
 * helper method for endpoint 1, creates JSON object of all yips from database and sends it to the
 * client
 * throws error if there is an error in the database retrieval
 * @param {Request} req request object
 * @param {Response} res response object
 */
function handleYips(req, res) {
  sqlite3db.all(SELECT_ALL, [], (err, rows) => {
    if (err) {
      throw err;
    }
    let entries = [];
    rows.forEach((row) => {
      let entry = {
        "id": row.id,
        "name": row.name,
        "yip": row.yip,
        "hashtag": row.hashtag,
        "date": row.date,
        "likes": row.likes
      };
      entries.push(entry);
    });
    res.send(JSON.stringify({yips: entries}));
  });
}

// endpoint #1
app.get('/yipper/yips', function(req, res) {
  res.type('json');
  if (req.query.search) {
    handleSearch(req, res);
  } else {
    handleYips(req, res);
  }
});

// endpoint #2
app.get('/yipper/user/:user', function(req, res) {
  res.type('json');
  let whereClause = " WHERE name = '" + req.params.user + "'";
  sqlite3db.all(SELECT_USER + whereClause, [], (err, rows) => {
    if (err) {
      throw err;
    } else {
      let entries = [];
      rows.forEach((row) => {
        let entry = {
          "name": row.name,
          "yip": row.yip,
          "hashtag": row.hashtag,
          "date": row.date
        };
        entries.push(entry);
      });
      res.send(JSON.stringify(entries));
    }
  });
});

// endpoint #3
app.post('/yipper/likes', function(req, res) {
  res.type('text');
  if (!req.body.id) {
    res.send("Missing one or more of the required params");
    return;
  }
  let whereClause = " WHERE id = " + req.body.id;
  sqlite3db.run(INCREMENT_LIKES + whereClause, (err) => {
    if (err) {
      throw err;
    }
    sqlite3db.all(SELECT_LIKES + whereClause, [], (error, rows) => {
      if (error) {
        throw error;
      }
      if (rows.length === 0) {
        res.send('Yikes. ID does not exist.');
      } else {
        res.send(rows[0].likes.toString());
      }
    });
  });
});

// endpoint #4
app.post('/yipper/new', function(req, res) {
  res.type('json');
  if (!req.body.name || !req.body.full) {
    res.send('Missing one or more of the required params.');
    return;
  }
  let whereClause = " WHERE name='" + req.body.name + "'";
  sqlite3db.all(SELECT_ID + whereClause, [], (err, rows) => {
    if (err) {
      throw err;
    }
    if (rows.length === 0) {
      res.send('Yikes. User does not exist.');
      return;
    }
    yipperNewHelper(req, res);
  });
});

/**
 * helper method for creating a new yip, populates the JSON using the req,
 * and then sends in back to the client
 * will throw error if there is an error
 * @param {Request} req request object
 * @param {Response} res response object
 */
function yipperNewHelper(req, res) {
  let hashPos = req.body.full.indexOf('#');
  let yipStr = req.body.full.substring(0, hashPos);
  let hashTagStr = req.body.full.substring(hashPos + 1);
  let dateStr = (new Date()).toISOString();
  let params = [req.body.name, yipStr, hashTagStr, 0, dateStr];
  sqlite3db.run(INSERT_STMNT2, params, function(error) {
    if (error) {
      throw error;
    }
    res.send(JSON.stringify(
      {
        id: this.lastID,
        name: req.body.name,
        yip: yipStr,
        hashtag: hashTagStr,
        date: dateStr,
        likes: 0
      }
    ));
  });
}

app.use(express.static('public'));

const PORT = process.env.PORT || 8080;

/**
 * This method creates and populate the data base. If it is not created, then it makes it from
 * the csv file.
 * @param {err} callback callback function
 */
function initServer(callback) {
  if (!fs.existsSync(DB_FILE)) {
    initServerHelper(sqlite3, callback);
  } else {
    sqlite3db = new sqlite3.Database(DB_FILE, sqlite3.OPEN_READWRITE,
    (err) => {
      if (err) {
        callback(err);
        return;
      }
      callback(null);
    });
  }
}

/**
 * helper method for initServer, creates new database readining in csv data
 * @param {'sqlite3D'} sqlite3D sqlite3 equal
 * @param {'callback'} callback callback function
 */
function initServerHelper(sqlite3D, callback) {
  let initData = fs.readFileSync(CSV_FILE, 'utf8');
  sqlite3db = new sqlite3D.Database(DB_FILE, sqlite3.OPEN_READWRITE | sqlite3.OPEN_CREATE,
  (err) => {
    if (err) {
      callback(err);
      return;
    }
    sqlite3db.run(CREATE_STMNT, (error) => {
      if (error) {
        callback(error);
        return;
      }
      let rows = initData.split(/(\r?\n)/g);
      for (let i in rows) {
        let colStr = rows[i].trim();
        if (colStr.length > 0) {
          let colsData = colStr.split(',');
          let params = [colsData[0], colsData[1], colsData[2], colsData[3], colsData[4],
          colsData[5]];
          sqlite3db.run(INSERTS1, params);
        }
      }
      callback(null);
    });
  });
}

initServer((err) => {
  if (err) {
    console.error(err.message);
    return;
  }
  app.listen(PORT);
});
