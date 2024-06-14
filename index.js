const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

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
    const bookingsCollection = client.db("userProduct").collection("bookings");
    const paymentsCollection = client.db("userProduct").collection("payments");

    app.get("/products", async (req, res) => {
      const result = await productsCollection.find({}).toArray();
      res.send(result);
    });

    //get product by email
    app.get("/product", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      console.log(query);
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    //get by id
    app.get("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await productsCollection.find(query).toArray();
      res.send(result);
    });

    //add product
    app.post("/products", async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    //update product
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const product = req.body;
      const option = { upsert: true };
      const updateProduct = {
        $set: {
          name: product.name,
          price: product.price,
          quantity: product.quantity,
          image: product.image,
          detail: product.detail,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateProduct,
        option
      );
      res.send(result);
    });

    //delete product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await productsCollection.deleteOne(filter);
      res.send(result);
    });

    //booking
    app.post("/bookings", async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const result = await bookingsCollection.insertOne(booking);
      res.send(result);
    });

    //get bookings by email
    app.get('/bookings', async (req, res) => {
      const email = req.query.email;
      const query = { email: email }
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
  });

    //get booking by id for payment
    app.get('/bookings/:id', async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
  })

    //payment method ----stripe
    app.post('/create-payment-intent', async (req, res) => {
      const booking = req.body;
      console.log(booking)
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
          currency: 'usd',
          amount: amount,
          "payment_method_types": [
              "card"
          ],
      });
      res.send({
          clientSecret: paymentIntent.client_secret,
      });
  })

  app.post('/payments', async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: ObjectId(id) };
      const updatedDoc = {
          $set: {
              paid: true,
              transactionId: payment.transactionId
          }
      }
      const updatedResult = await bookingsCollection.updateOne(filter, updatedDoc);
      res.send(result);
  })


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
