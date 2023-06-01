"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const Books_1 = require("./../../models/Books");
const express_1 = __importDefault(require("express"));
const User_1 = require("../../models/User");
const auth_1 = require("../../middleware/auth");
const router = express_1.default.Router();
const NodeCache = require('node-cache');
const cache = new NodeCache();
router.get('/allBooks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    Books_1.Books.find({}, (err, Books) => {
        if (err)
            throw new mongoose_1.Error(err.message);
        if (Books) {
            const page = parseInt(String(req.query.page)) || 1;
            const limit = parseInt(String(req.query.limit)) || 10;
            const startIndex = (page - 1) * limit;
            const endIndex = page * limit;
            const results = {};
            if (endIndex < Books.length) {
                results.next = {
                    page: page + 1,
                    limit: limit,
                };
            }
            results.total = Books.length;
            if (startIndex > 0) {
                results.previous = {
                    page: page - 1,
                    limit: limit,
                };
            }
            results.results = Books.slice(startIndex, endIndex);
            res.json(results);
        }
    });
}));
router.get('/searchBooks', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const cacheKey = JSON.stringify(req.query); // use the query as the cache key
    const cachedResult = cache.get(cacheKey);
    if (cachedResult) {
        console.log('Serving from cache');
        return res.json(cachedResult);
    }
    const query = {
        name: {
            // also find partial matches and turkish characters (i.e. case insensitive)
            $regex: req.query.name,
            $options: 'i',
        },
    };
    const page = parseInt(String(req.query.page)) || 1;
    const limit = parseInt(String(req.query.limit)) || 10;
    const startIndex = (page - 1) * limit;
    const [count, results] = yield Promise.all([
        Books_1.Books.countDocuments(query, { collation: { locale: 'tr', strength: 2 } }),
        Books_1.Books.find(query)
            .select('name path size date url uploader')
            .populate('uploader', 'username email')
            .skip(startIndex)
            .limit(limit)
            .lean(),
    ]);
    const endIndex = Math.min(startIndex + limit, count);
    const pagination = {};
    if (endIndex < count) {
        pagination.next = {
            page: page + 1,
            limit: limit,
        };
    }
    pagination.total = count;
    if (startIndex > 0) {
        pagination.previous = {
            page: page - 1,
            limit: limit,
        };
    }
    pagination.results = results;
    cache.set(cacheKey, pagination); // store the result in the cache
    res.json(pagination);
}));
router.post('/addNewBook', (req, res) => {
    const ikinciParti = new Books_1.Books({
        name: req.body.name,
        url: req.body.url,
        size: req.body.size,
        date: new Date(),
        uploader: req.body.uploader,
    });
    ikinciParti.save((err, data) => {
        if (err)
            console.log(err);
        res.json(data);
    });
});
router.get('/recently-added', (req, res) => {
    Books_1.Books.find({})
        .sort({ date: -1 })
        .limit(50)
        .exec((err, data) => {
        if (err)
            console.log(err);
        res.json(data);
    });
});
router.post('/deleteBook', auth_1.auth, (req, res) => {
    const id = req.body.id;
    console.log('id: ', id);
    Books_1.Books.findByIdAndDelete(id, (err, data) => {
        if (err)
            console.log(err);
        if (!data) {
            return res.status(404).json({ msg: 'Book not found' });
        }
        res.json(data);
    });
    cache.flushAll();
});
router.post('/updateBook', (req, res) => {
    User_1.User.findOne({ username: 'mehmesayin' })
        .then((user) => {
        return Books_1.Books.updateMany({}, { $set: { uploader: user === null || user === void 0 ? void 0 : user._id } });
    })
        .then((result) => {
        res.json(result);
    })
        .catch((error) => {
        console.error(error);
    });
});
module.exports = router;
