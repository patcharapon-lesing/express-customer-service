const express = require('express')
const bodyParser = require('body-parser')
const app = express()
app.use(bodyParser.json({ limit: '50mb', extended: true }))
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))
const Moment = require('moment')
const { check, validationResult } = require('express-validator');
const mongoose = require('mongoose')

// MongoDB Connect
// const uris = "mongodb://localhost:27017/blog" ; 
const uris = "mongodb://heroku_nnc3s5k3:r79vmq437h44bck5063uhjcnln@ds123171.mlab.com:23171/heroku_nnc3s5k3" ;
const config = { autoIndex: true, useNewUrlParser: true, useUnifiedTopology: true };

mongoose.connect(uris, config)
    .then(() => console.log(" Connect to MongoDB...."))
    .catch(err => console.log("Can't Connect MongoDB", err))
const customerSchema = new mongoose.Schema({
    caseID: String,
    caseBy: String,
    createDate: Date,
    topic: String,
    description: String,
    statusCase: String,
    updateDate: Date,
    image: Array
});
const dbCustomer = mongoose.model('Customer', customerSchema)



const setFormatDate = Moment().utcOffset(-300).format('YYYY-MM-DD');
const Customer = mongoose.model('Customer', customerSchema);
async function createCustomer(Data) {
    const customer = Customer({
        caseID: Data.caseID,
        caseBy: Data.caseBy,
        createDate: setFormatDate,
        topic: Data.topic,
        description: Data.description,
        statusCase: Data.statusCase,
        updateDate: setFormatDate,
        image: Data.image
    });
    await customer.save()
        .then(() => res = { resultCode: "20000" , status: true, msg: "Success", developerMessage: "Success" })
        .catch(err => res = { status: false, msg: "ผิดพลาด ไม่สามารถทำรายการได้ในขณะนี้", errors: err });
    return res
}

 app.listen(3000, () => { console.log('Start server at port 3000.') })

app.post('/create', [
    check('caseID').isString(),
    check('caseBy').isString(),
    check('topic').isString(),
    check('description').isString(),
    check('statusCase').isString(),
    check('image').isArray()
], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    let queryLastnum = {};
    let newCaseID;
    queryLastnum['caseID'] = { '$regex': req.body.caseID };
    dbCustomer.find(queryLastnum).count().then(Response => {
        newCaseID = Response + 1;
        const Data = {
            caseID: req.body.caseID + ("0000" + newCaseID).slice(-4),
            caseBy: req.body.caseBy,
            topic: req.body.topic,
            description: req.body.description,
            statusCase: req.body.statusCase,
            image: req.body.image
        }
        createCustomer(Data).then(Response => { return res.json( Response) });
    })
});

app.post('/search', [], (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(422).json({ errors: errors.array() });
    }
    const query = {};
    const stDateFm = Moment(req.body.stDate).format("YYYY-MM-DD 00:00:00.000Z")
    const enDateFm = Moment(req.body.enDate).format("YYYY-MM-DD 00:00:00.000Z")
    if (req.body.stDate && req.body.enDate) {
        query['createDate'] = { $gte: new Date(stDateFm), $lt: new Date(enDateFm) }
    } else if (req.body.caseID) {
        query['caseID'] = req.body.caseID
    } else {
        return res.json({
            status: false,
            msg: "ไม่สามารถทำรายการได้ในขณะนี้",
            errors: [
                {
                    "msg": "Invalid value",
                    "param": "caseID | stDate,enDate",
                    "location": "body"
                }
            ]
        })
    }
    dbCustomer.find(query)
        .then(Response => { return res.json({ resultCode: "20000" , status: true, msg: "success", data: Response }) })
        .catch(err => { return res.json({ status: false, msg: "ไม่สามารถทำรายการได้ในขณะนี้", errors: err }) });
});
