const express = require('express');
const { readblogs, readTrending } = require('../controllers/readblogs');
const readblogById = require('../controllers/readblogById');
const createpost = require('../controllers/createpost');
const likesPost = require('../controllers/likesPost');
const subscribeBlogger = require('../controllers/subscribeBlogger');
const unsubscribeBlogger = require('../controllers/unsubscribeBlogger');
const viewPost = require('../controllers/viewPost');
const auth = require('../middleware/auth');

const router = express.Router();

router.get('/readblogs', readblogs);
router.get('/readblogs/trending', readTrending);
router.get('/readblogs/:id', readblogById);
router.post('/readblogs/:id/like', auth, likesPost);
router.post('/readblogs/:id/subscribe', auth, subscribeBlogger);
router.post('/readblogs/:id/unsubscribe', auth, unsubscribeBlogger);
router.post('/readblogs/:id/viewed', auth, viewPost);
router.post('/createpost', auth, createpost);

module.exports = router;
