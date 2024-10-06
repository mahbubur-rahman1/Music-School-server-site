const express = require('express');
const app = express();
require('dotenv').config()
const cors = require('cors');
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const jwt = require('jsonwebtoken');
const stripe = require('stripe')(process.env.PAYMENT_KEY)

app.use(cors());
app.use(express.json());


const jwtVerify = (req, res, next) => {
    const authorization = req.headers.authorization
    if (!authorization) {
        return res.status(401).send({ error: true, message: 'unathorization access' })
    }
    const token = authorization.split(' ')[1];

    jwt.verify(token, process.env.ACCESS_TOKEN_SCRECT, (err, decoded) => {
        if (err) {
            return res.status(401).send({ error: true, message: 'unathorization access' })
        }
        req.decoded = decoded;
        next()
    })
}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.alw7nxz.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        const usersCollection = client.db("musicSchool").collection("users")    
        const instractorColection = client.db("musicSchool").collection(" instructors")
        const classesColection = client.db("musicSchool").collection("classes")
        const enrollCollection = client.db("musicSchool").collection("allEnroll")
        const paymentCollection = client.db("musicSchool").collection("payment")


        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SCRECT, { expiresIn: '1hr' })
            res.send({ token })
        })

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.role !== 'admin') {
              return res.status(403).send({ error: true, message: 'porbidden message' });
            }
            next();
          }


        app.get('/enroll', jwtVerify, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                return res.send([]);
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: True, message: 'porviden access' })
            }

            const query = { email: email };
            const result = await enrollCollection.find(query).toArray();
            res.send(result)


        })


        app.get('/users', jwtVerify,  async(req, res)=>{
            const result = await usersCollection.find().toArray()
            res.send(result)
          })

          app.post('/users', async(req, res)=>{
            const user = req.body;
            const query = {email: user.email}
            const existing = await usersCollection.findOne(query)
          
            if(existing){
              return res.send({message: 'user is alreaady existing' })
            }
            const result = await usersCollection.insertOne(user)
            res.send(result)
          })



          app.get('/users/admin/:email', jwtVerify, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ admin: false })
  }

  const query = { email: email }
  const user = await usersCollection.findOne(query);
  const result = { admin: user?.role === 'admin' }
  res.send(result);
})

app.get('/users/instructor/:email', jwtVerify, async (req, res) => {
  const email = req.params.email;

  if (req.decoded.email !== email) {
    res.send({ admin: false })
  }

  const query = { email: email }
  const user = await usersCollection.findOne(query);
  const result = { admin: user?.role === 'instructor' }
  res.send(result);
})


        app.patch('/users/admin/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const updateUser = {
              $set: {
                role: 'admin'
              },
            }
            const result = await usersCollection.updateOne(query, updateUser)
            res.send(result)
          })

          app.patch('/users/instructor/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const updateUser = {
              $set: {
                role: 'instructor' 
              },
            }
            const result = await usersCollection.updateOne(query, updateUser)
            res.send(result)
          })


        app.delete('/user-delete/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await usersCollection.deleteOne(query)
            res.send(result)
          })







        app.post('/all-enroll', async (req, res) => {
            const enroll = req.body;
            const result = await enrollCollection.insertOne(enroll);
            res.send(result)
        })


        app.get('/instructors', async (req, res) => {
            const result = await instractorColection.find().toArray()
            res.send(result)
        })




        app.delete('/enroll/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await enrollCollection.deleteOne(query)
            res.send(result)
        })



        app.get('/my-class', jwtVerify, async(req, res)=>{
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
            console.log(query)
            const result = await classesColection.find(query).toArray();
            res.send(result)
          })


        app.delete('/my-classes/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: new ObjectId(id)}
            const result = await classesColection.deleteOne(query)
            res.send(result)
          })


          app.post('/addClass', async(req, res)=>{
            const item = req.body;
            const result = await classesColection.insertOne(item)
            res.send(result)
          
          })





        app.get('/classes', async (req, res) => {
            const result = await classesColection.find().toArray()
            res.send(result)
        })

        app.post("/create-payment-intent", jwtVerify, async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'usd',
                payment_method_types: ['card']
            });
            res.send({
                clientSecret: paymentIntent.client_secret
            });
        })


        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const insertResult = await paymentCollection.insertOne(payment)

            const query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
            const deleteResult = await enrollCollection.deleteMany(query)

            res.send({ result: insertResult, deleteResult });
        })



        app.get('/my-enroll-class', jwtVerify, async (req, res) => {
            const email = req.query.email;
            if (!email) {
                return res.send([]);
            }
            const decodedEmail = req.decoded.email;
            if (email !== decodedEmail) {
                return res.status(403).send({ error: True, message: 'porviden access' })
            }

            const query = { email: email };
            const result = await paymentCollection.find(query).toArray();
            res.send(result)
        })











        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");






    } finally {
       
    }
}
run().catch(console.dir);









app.get('/', (req, res) => {
    res.send('SIMPLE CRUD IS RUNNING')
})


app.listen(port, () => {
    console.log(`SIMPLE CRUD IS RUNNNING ON PORT ${port}`)
})

// "test": "echo \"Error: no test specified\" && exit 1"