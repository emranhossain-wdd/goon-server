const express = require('express');
const app = express();
const cors = require('cors');
require('dotenv').config();
const { MongoClient } = require('mongodb');
const ObjectId = require('mongodb').ObjectId;
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.USER_ID}:${process.env.USER_PASS}@cluster0.ols3g.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });

async function run() {
    try {
        await client.connect();
        const database = client.db('goon');
        const blogs = database.collection('blogs');
        const users = database.collection('users');
        const orders = database.collection('orders');
        const reviews = database.collection('reviews');

        // rendering all blogs
        app.get('/topBlogs', async (req, res) => {
            const cursor = blogs.find({});
            const topBlogs = await cursor.toArray();
            res.json(topBlogs);
        });

        // rendering blogs by page
        app.get('/blogs', async (req, res) => {
            const cursor = blogs.find({});
            const page = req.query.page;
            const size = parseInt(req.query.size);
            const count = await cursor.count()
            let allBlogs;
            if (page) {
                allBlogs = await cursor.skip(page * size).limit(size).toArray();
            }
            else {
                allBlogs = await cursor.toArray();
            }
            res.json({
                count,
                allBlogs
            });
        });

        // single blog rendering
        app.get('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const blog = await blogs.findOne(query);
            res.json(blog);
        });

        // my blogs rendering by email
        app.get('/myBlogs', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const result = await blogs.find(query).toArray();
            res.json(result);
        })

        // check admin
        app.get('/users', async (req, res) => {
            const email = req.query.email;
            const query = { email: email };
            const user = await users.findOne(query);
            let isAdmin = false;
            if (user?.role === 'admin') {
                isAdmin = true;
            }
            res.json({ admin: isAdmin });
        })

        // all blogs added in database
        app.post('/blogs', async (req, res) => {
            const blog = req.body;
            const result = await blogs.insertOne(blog);
            res.json(result);
        });

        // users added in database
        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await users.insertOne(user);
        });

        // blog status update
        app.put('/status/:id', async (req, res) => {
            const id = req.params.id;
            const updateStatus = req.body;
            const query = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    status: updateStatus.status
                },
            };
            const result = await blogs.updateOne(query, updateDoc, options);
            res.json(result);
        })
        // make an admin
        app.put('/users', async (req, res) => {
            const user = req.body;
            const filter = { email: user.email };
            const updateDoc = {
                $set: {
                    role: 'admin'
                }
            };
            const result = await users.updateOne(filter, updateDoc);
            res.json(result);
        });

        // delete a particular blog
        app.delete('/blog/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await blogs.deleteOne(query);
            res.json(result);
        });

    }
    finally {
        // await client.close();
    }
}

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('goon server is running');
})

app.listen(port, () => {
    console.log(`listening at port ${port}`);
})