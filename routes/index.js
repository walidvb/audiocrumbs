var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', {layout: false});
});
router.get('/begin', function (req, res, next) {
  res.render('experience');
});

module.exports = router;
