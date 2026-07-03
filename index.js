const express = require("express");
const dontenv = require("dotenv");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// const { createRemoteJWKSet, jwtVerify } = require("jose-cjs");
dontenv.config();


const uri = process.env.MONGODB_URL;

const app = express();
const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

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

        const db = client.db("lawyers-info")
        const lawyers = db.collection("lawyers")

        //showing all the lawyer 
        app.get("/lawyers", async (req, res) => {

            const {
                availability,
                specialization,
                sort,
            } = req.query;

            const query = {};

            // Availability Filter
            if (availability) {
                query.availability = availability;
            }

            // Specialization Filter
            if (specialization) {
                query.specialization = specialization;
            }

            let sortOption = {};

            switch (sort) {
                case "rating":
                    sortOption = { rating: -1 };
                    break;

                case "experience":
                    sortOption = { experience: -1 };
                    break;

                case "fee-low":
                    sortOption = { consultationFee: 1 };
                    break;

                case "fee-high":
                    sortOption = { consultationFee: -1 };
                    break;

                case "newest":
                    sortOption = { joinedDate: -1 };
                    break;

                default:
                    sortOption = {};
            }

            const result = await lawyers
                .find(query)
                .sort(sortOption)
                .toArray();

            res.send(result);
        });

        //for banner section
        app.get("/featured-lawyers", async (req, res) => {

            const result = await lawyers.find({ featured: true }).limit(4).toArray();

            res.send(result);

        });
        //
        app.get("/TopLawyerExperts", async (req, res) => {

            const result = await lawyers.find({ featured: true }).limit(6).toArray();

            res.send(result);

        });

        //fetching lawyers data
        app.get("/lawyers/:id", async (req, res) => {
            const id = req.params.id;

            const lawyer = await lawyers.findOne({
                _id: new ObjectId(id),
            });

            res.send(lawyer);
        });

        const users = client.db("users-collection");
        const usersCollection = users.collection("users");

        app.post("/users", async (req, res) => {

            try {

                const user = req.body;
                const existingUser = await usersCollection.findOne({
                    email: user.email,
                });

                if (existingUser) {
                    return res.status(409).send({
                        success: false,
                        message: "User already exists.",
                    });
                }

                const result = await usersCollection.insertOne(user);

                res.send({
                    success: true,
                    insertedId: result.insertedId,
                });

            } catch (error) {

                res.status(500).send({
                    success: false,
                    message: error.message,
                });

            }
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

app.get("/", (req, res) => {
    res.send("Server is running fine!");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});