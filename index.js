const express = require('express')
const app = express()
const bodyParser = require('body-parser')
const cors = require('cors')
const fileUpload = require('express-fileupload')
const { MongoClient } = require('mongodb');
app.use(cors())
app.use(express.static('doctors'))
app.use(fileUpload())
app.use(express.json({ limit: '50mb' }))


require('dotenv').config()


const uri = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASS}@cluster0.uueml.mongodb.net/doctorsPortal?retryWrites=true&w=majority`;


const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const appointmentCollection = client.db("doctorsPortal").collection("appointments");
    const doctorsCollection = client.db("doctorsPortal").collection("doctors");
    const usersCollection = client.db("doctorsPortal").collection("users");


    app.post('/addAppointment', (req, res) => {
        const appointment = req.body;
        appointmentCollection.insertOne(appointment)
            .then(result => {
                res.send(result.insertedCount > 0);
            })
    })

    app.post('/appointmentsByDate', (req, res) => {
        const date = req.body;
        appointmentCollection.find({ date: date.date })
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    // app.post('/addADoctor', (req, res) =>{
    //     const file = req.files.file;
    //     const name = req.body.name;
    //     const email = req.body.email;
    //     console.log(name, email, file);

    //     file.mv(`${__dirname}/doctors/${file.name}`, (err) => {
    //         if (err !== null) {
    //             console.log(err);
    //             return res.status(500).send({msg : 'File Upload Failed'})
    //         }
    //         return res.send({name: file.name, path: `/${file.name}`})
    //     })
    // })



    app.post('/addADoctor', async (req, res) => {
        const image = req.files.image;
        const name = req.body.name;
        const email = req.body.email;
        const number = req.body.number;
        const imageData = image.data;
        const encodedImage = imageData.toString('base64');
        const imageBuffer = Buffer.from(encodedImage, 'base64');
        const doctors = {
            name,
            email,
            number,
            image: imageBuffer
        }
        const result = await doctorsCollection.insertOne(doctors);
        res.send(result)
    });


    app.get('/doctors', async (req, res) => {
        const query = doctorsCollection.find({});
        const result = await query.toArray();
        res.send(result);
    });

    app.post('/saveUser', async (req, res) => {
        const { displayName, token } = req.body;
        const userEmail = req.body.email;
        const email = userEmail.toLowerCase();
        const query =await usersCollection.findOne({ email: email.toLowerCase() });
        if (query) {
            return res.send({ alreadySaved: true })
        }
        const result = await usersCollection.insertOne({ displayName, email, token, role:'admin' });
        return res.send(result);
    });
    
    app.get('/', (req, res) => {
        res.send({ msg: 'connected' })
    })


});



// creativeadmin@gmail.com
// admin00


const port = 5000
app.listen(port)