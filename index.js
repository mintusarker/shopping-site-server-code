const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion } = require("mongodb");

require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());

const port = process.env.PORT || 5000;

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.dl1tykd.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();

    const productsCollection = client.db("userProduct").collection("products");


    app.get('/products', async(req, res)=> {
        const result = await productsCollection.find({}).toArray();
        res.send(result)
    });


    app.post('/products', async (req,res)=> {
        const product = req.body;
        console.log(product);
        const result  = await productsCollection.insertOne(product);
        res.send(result)
    })


    app.delete('/products/:id', async (req, res)=>{
        const id = req.params.id;
        const filter = {_id: id};
        const result = await productsCollection.deleteOne(filter);
        res.send(result)
    });


  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server running");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



