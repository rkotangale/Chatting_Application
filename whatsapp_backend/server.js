const express = require("express");
const mongoose = require("mongoose");
const Pusher = require("pusher");
const Messages = require("./dbMessages");
const Cors = require("cors");

//app config
const app = express();
const PORT = process.env.PORT || 5000;

const pusher = new Pusher({
    appId: "1217978",
    key: "894ed19a99283a3ffb71",
    secret: "ae5900ee7ffff2b9c559",
    cluster: "eu",
    useTLS: true
});

//middleware
app.use(express.json());

app.use(Cors());

//DB config
const connection_url = "mongodb+srv://Rajat:nLjj2KQCx8aH078T@cluster0.t5x2k.mongodb.net/whatsappdb?retryWrites=true&w=majority";
mongoose.connect(connection_url, {
    useCreateIndex: true,
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const db = mongoose.connection

db.once("open", () => {
    console.log("DB Connected");

    const msgCollection = db.collection("messagecontents");
    const changeStream = msgCollection.watch();

    changeStream.on('change', (change) => {
        console.log(change);

        if (change.operationType === 'insert') {
            const messageDetails = change.fullDocument;
            pusher.trigger('messages', 'inserted',
                {
                    name: messageDetails.name,
                    message: messageDetails.message,
                    timestamp: messageDetails.timestamp,
                    received: messageDetails.received,
                });
        } else {
            console.log("error triggering pusher");
        }
    })
})

//api routes
app.get("/", (req, res) => {
    res.status(200).send("Hello World");
})

app.get('/messages/sync', (req, res) => {
    Messages.find((err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(200).send(data)
        }
    })
})

app.post('/messages/new', (req, res) => {
    const dbMessage = req.body

    Messages.create(dbMessage, (err, data) => {
        if (err) {
            res.status(500).send(err)
        }
        else {
            res.status(201).send(data)
        }
    })
})

app.listen(PORT, () => {
    console.log(`Connection successfull at port ${PORT}`)
})
