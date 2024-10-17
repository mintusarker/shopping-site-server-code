const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
var jwt = require("jsonwebtoken");
require("dotenv").config();

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

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

//jwt common function
function verifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  console.log(authHeader);
  if (!authHeader) {
    return res.status(401).send("unauthorized access");
  }
  const token = authHeader.split(" ")[1];
  console.log(token);
  jwt.verify(token, process.env.ACCESS_TOKEN, function (err, decoded) {
    if (err) {
      return res.status(403).send({ message: "forbidden access" });
    }
    req.decoded = decoded;
    next();
  });
}

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    // await client.connect();

    const productsCollection = client.db("userProduct").collection("products");
    const bookingsCollection = client.db("userProduct").collection("bookings");
    const paymentsCollection = client.db("userProduct").collection("payments");
    const usersCollection = client.db("userProduct").collection("users");
    const newArrivalCollection = client
      .db("userProduct")
      .collection("newProducts");
    const topSellingCollection = client
      .db("userProduct")
      .collection("topSelling");

    //get all products
    app.get("/products", async (req, res) => {
      const result = await productsCollection.find({}).toArray();
      res.send(result);
    });

    //price high to law
    app.get("/priceHigh", async (req, res) => {
      const data = await productsCollection
        .find({})
        .sort({ price: -1 })
        .toArray();
      res.send(data);
    });

    //price low to high
    app.get("/priceLow", async (req, res) => {
      const data = await productsCollection
        .find({})
        .sort({ price: 1 })
        .toArray();
      res.send(data);
    });

    //get product for payment completed by email
    app.get("/paymentDone", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await paymentsCollection.find(query).toArray();
      res.send(result);
    });

    //get payment by user email
    app.get("/payment-by-user/:email", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const result = await paymentsCollection.find(query).toArray();
      res.send(result);
    });

    //get All payment
    app.get("/payment", async (req, res) => {
      const result = await paymentsCollection.find({}).toArray();
      res.send(result);
    });

    //search API
    app.get("/search/:key", async (req, res) => {
      const data = await productsCollection
        .find({
          $or: [
            {
              name: { $regex: req.params.key },
            },
          ],
        })
        .toArray();
      res.send(data);
    });

    //jwt
    app.post("/jwt", async (req, res) => {
      const user = req.body;
      console.log(user);
      const token = jwt.sign(user, process.env.ACCESS_TOKEN, {
        expiresIn: "1h",
      });
      res.send({ token });
    });

    //get admin email
    app.get("/users/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query);
      res.send({ isAdmin: user?.role === "Admin" });
    });

    //save user to database
    app.put("/users", async (req, res) => {
      const user = req.body;
      const email = user.email;

      const filter = { email: email };
      const option = { upsert: true };

      const userinfo = {
        email: user.email,
        name: user.name,
      };

      const updateDoc = { $set: userinfo };
      const result = await usersCollection.updateOne(filter, updateDoc, option);
      res.send(result);
    });

    //get all users
    app.get("/users", async (req, res) => {
      const result = await usersCollection.find({}).toArray();
      res.send(result);
    });

    //delete user
    app.delete("/user/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await usersCollection.deleteOne(query);
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
    app.post("/products", verifyJWT, async (req, res) => {
      const product = req.body;
      console.log(product);
      const result = await productsCollection.insertOne(product);
      res.send(result);
    });

    //update product
    app.put("/products/:id", verifyJWT, async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const product = req.body;
      const option = { upsert: true };
      const updateProduct = {
        $set: {
          category: product.category,
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

    //update product quantity
    app.patch("/product", async (req, res) => {
      const data = req.body;
      const id = data.id;
      const filter = { _id: new ObjectId(id) };
      const quantity = data?.quantity;
      console.log(quantity);

      const options = { upsert: true };
      const updateProduct = {
        $set: {
          quantity: quantity,
        },
      };
      const result = await productsCollection.updateOne(
        filter,
        updateProduct,
        options
      );
      res.send(result);
    });

    //update top selling product quantity
    app.patch("/product-topSell", async (req, res) => {
      const data = req.body;
      const id = data.id;
      const filter = { _id: new ObjectId(id) };
      const quantity = data?.quantity;
      console.log(quantity);

      const options = { upsert: true };
      const updateProduct = {
        $set: {
          quantity: quantity,
        },
      };
      const result = await topSellingCollection.updateOne(
        filter,
        updateProduct,
        options
      );
      res.send(result);
    });

    //update new arrival product quantity
    app.patch("/product-newArrival", async (req, res) => {
      const data = req.body;
      const id = data.id;
      const filter = { _id: new ObjectId(id) };
      const quantity = data?.quantity;
      console.log(quantity);

      const options = { upsert: true };
      const updateProduct = {
        $set: {
          quantity: quantity,
        },
      };
      const result = await newArrivalCollection.updateOne(
        filter,
        updateProduct,
        options
      );
      res.send(result);
    });

    //delete product
    app.delete("/products/:id", verifyJWT, async (req, res) => {
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

    //get all booking
    app.get("/all_bookings", async (req, res) => {
      const result = await bookingsCollection.find({}).toArray();
      res.send(result);
    });

    //get bookings by email
    app.get("/bookings/email", async (req, res) => {
      const email = req.query.email;
      const query = { email: email };
      const bookings = await bookingsCollection.find(query).toArray();
      res.send(bookings);
    });

    //get booking by id for payment
    app.get("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const booking = await bookingsCollection.findOne(query);
      res.send(booking);
    });

    //delete bookings
    app.delete("/bookings/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await bookingsCollection.deleteOne(filter);
      res.send(result);
    });

    //new arrival
    //store new arrival products
    app.post("/new-arrival", async (req, res) => {
      const newProduct = req.body;
      const result = await newArrivalCollection.insertOne(newProduct);
      res.send(result);
    });

    //get new arrival product
    app.get("/new-arrival", async (req, res) => {
      const result = await newArrivalCollection.find({}).toArray();
      res.send(result);
    });

    //get new arrival products by id
    app.get("/newArrival/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await newArrivalCollection.find(query).toArray();
      res.send(result);
    });

    // //delete new arrival
    app.delete("/new-arrival/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await newArrivalCollection.deleteOne(filter);
      res.send(result);
    });

    //top selling
    //store top selling product
    app.post("/top-selling", async (req, res) => {
      const topSellProducts = req.body;
      const result = await topSellingCollection.insertOne(topSellProducts);
      res.send(result);
    });

    //get top selling product
    app.get("/top-selling", async (req, res) => {
      const result = await topSellingCollection.find({}).toArray();
      res.send(result);
    });

    //get top selling products by id
    app.get("/topSelling/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await topSellingCollection.find(query).toArray();
      res.send(result);
    });

    //delete top selling product
    app.delete("/top-selling/:id", async (req, res) => {
      const id = req.params.id;
      const filter = { _id: new ObjectId(id) };
      const result = await topSellingCollection.deleteOne(filter);
      res.send(result);
    });

    //get admin email
    app.get("/user/admin/:email", async (req, res) => {
      const email = req.params.email;
      const query = { email };
      const user = await usersCollection.findOne(query).toArray();
      const admin = user?.role === "Admin";
      res.send({ isAdmin: admin });
    });

    //payment method ----stripe
    app.post("/create-payment-intent", verifyJWT, async (req, res) => {
      const booking = req.body;
      console.log(booking);
      const price = booking.price;
      const amount = price * 100;

      const paymentIntent = await stripe.paymentIntents.create({
        currency: "usd",
        amount: amount,
        payment_method_types: ["card"],
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    app.post("/payments", verifyJWT, async (req, res) => {
      const payment = req.body;
      const result = await paymentsCollection.insertOne(payment);
      const id = payment.bookingId;
      const filter = { _id: new ObjectId(id) };
      const updatedDoc = {
        $set: {
          paid: true,
          transactionId: payment.transactionId,
        },
      };
      const updatedResult = await bookingsCollection.updateOne(
        filter,
        updatedDoc
      );
      res.send(result);
    });
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("server running check");
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
