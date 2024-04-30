const express = require('express');
const cors = require('cors');
const app = express();
const port = process.env.PORT || 5000;
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
require('dotenv').config()

const allowedOrigins = ['http://localhost:5173']

// middleware
app.use(cors())
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.kbuydyl.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

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
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const itemCollection = client.db('craftItemDB').collection('item');
    const userCollection = client.db('craftItemDB').collection('user');
    const categoryCollection = client.db('craftItemDB').collection('category');

    app.get('/item', async (req, res) => {
      const cursor = itemCollection.find();
      const result = await cursor.toArray();
        res.send(result);
      });
      
    app.get('/item/:identifier', async (req, res) => {
      const identifier = req.params.identifier;
      try {
        let result;
        if (ObjectId.isValid(identifier)) {
          result = await itemCollection.findOne({ _id: new ObjectId(identifier) });
        } else {
          result = await itemCollection.find({ $or: [{ user_email: identifier }, { subcategory: identifier }] }).toArray();
        }
        if (!result) {
          return res.status(404).send('Item not found');
        }
        res.send(result);
      } catch (error) {
        console.error('Error retrieving item:', error);
        res.status(500).send('Error retrieving item');
      }
    });
      
    const { ObjectId } = require('mongodb');

    app.post('/item', async (req, res) => {
      const newItem = req.body;
      console.log(newItem);
      const result = await itemCollection.insertOne(newItem)
      res.send(result)
    })

    app.put('/item/:id', async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const option = { upsert: true };
      const updatedItem = req.body;
      const item = {
        $set: {
          item_name: updatedItem.item_name, 
          subcategory: updatedItem.subcategory, 
          price: updatedItem.price, 
          rating: updatedItem.rating, 
          process_time: updatedItem.process_time, 
          description: updatedItem.description, 
          customization: updatedItem.customization, 
          stock_state: updatedItem.stock_state, 
          user_name: updatedItem.user_name, 
          user_email: updatedItem.user_email, 
          photo: updatedItem.photo
        }
      }

      const result = await itemCollection.updateOne(filter, item, option)
      res.send(result)
    })

    app.delete('/item/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      try {
        const result = await itemCollection.deleteOne(query);
        res.send(result);
      } catch (error) {
        console.error('Error deleting item:', error);
        res.status(500).send('Error deleting item');
      }
    });
    
    // user api
    app.post('/user', async (req, res) => {
        const newUser = req.body;
        console.log(newUser);
        const result = await userCollection.insertOne(newUser)
        res.send(result)
    })

    app.get('/user', async (req, res) => {
        const cursor = userCollection.find();
        const result = await cursor.toArray();
        res.send(result);
    });
    
    app.get('/user/:email', async (req, res) => {
        const email = req.params.email;
        const query = {email: email}
        const cursor = userCollection.find(query);
        const result = await cursor.toArray();
        res.send(result);
    });

    // category api
    app.get('/category', async (req, res) => {
      const cursor = categoryCollection.find();
      const result = await cursor.toArray();
      res.send(result);
    });


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
    res.send('server is running :)')
})

app.listen(port, () => {
    console.log(`Server is running on port: ${port}`);
})