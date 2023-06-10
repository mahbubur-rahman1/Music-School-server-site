const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');

app.use(cors());
app.use(express.json());


const jwtVerify = (req, res, next)=>{
    const authorization = req.headers.authorization
    if(!authorization){
      return res.status(401).send({error: true, message: 'unathorization access'})
    }
    // bearer token
    const token = authorization.split(' ')[1];
  
    jwt.verify(token, process.env.ACCESS_TOKEN_SCRECT, (err, decoded)=>{
      if(err){
        return res.status(401).send({error: true, message: 'unathorization access'})
      }
      req.decoded = decoded;
      next()
    })
  }



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
        const enrollCollection = client.db("musicSchool").collection("allEnroll")

        app.post('/jwt', (req, res)=>{
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SCRECT, {expiresIn: '1hr' })
          res.send({token})
          })


          app.get('/enroll', jwtVerify, async(req, res)=>{
            const email = req.query.email;
            // console.log(email)
            if(!email){
             return res.send([]);
            }
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
              return res.status(403).send({error: True, message: 'porviden access'})
            }
          
            const query = {email: email};
            // console.log(query)
            const result = await enrollCollection.find(query).toArray();
            res.send(result)
          })



          app.post('/all-enroll', async(req, res)=>{
            const enroll = req.body;
            const result = await enrollCollection.insertOne(enroll);
            res.send(result)
          })


        app.get('/instructors', async (req, res) => {
            const result = await instractorColection.find().toArray()
            res.send(result)
        })




        app.get('/classes', async (req, res) => {
            const result = await classesColection.find().toArray()
            res.send(result)
        })


        // Connect the client to the server	(optional starting in v4.7)
        // await client.connect()
        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");






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