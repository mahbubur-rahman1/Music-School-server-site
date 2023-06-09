const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.alw7nxz.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const instractorColection = client.db("musicSchool").collection(" instructors")
        const classesColection = client.db("musicSchool").collection("classes")


        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect()
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");



        app.get('/instructors', async (req, res) => {
            const result = await instractorColection.find().toArray()
            res.send(result)
        })




        app.get('/classes', async (req, res) => {
            const result = await classesColection.find().toArray()
            res.send(result)
        })



    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);









app.get('/', (req, res) => {
    res.send('SIMPLE CRUD IS RUNNING')
})


app.listen(port, () => {
    console.log(`SIMPLE CRUD IS RUNNNING ON PORT ${port}`)
})