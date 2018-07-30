var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});
router.get('/experiences', function (req, res, next) {
  res.render('experiences');
});


// The Camp
router.get('/experiences/thecamp', function (req, res, next) {
  res.render('experiences/thecamp', { layout: 'layout_experience'});
});
router.get('/experiences/thecamp/play', function (req, res, next) {
  res.render('experiences/thecamp_play', { layout: 'layout_experience' });
});

module.exports = router;
