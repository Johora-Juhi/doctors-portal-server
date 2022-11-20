const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion } = require('mongodb');
require('dotenv').config();
const port = process.env.PORT || 5000;

const app = express();

// middleware 
app.use(cors());
app.use(express.json());


const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.bkdzfxe.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {
        const appointmentOptionsCollection = client.db('doctorsPortal').collection('appointmentOptions');
        const bookingsCollection = client.db('doctorsPortal').collection('bookings');

        app.get('/appointmentOptions', async (req, res) => {
            const date = req.query.date;
            console.log(date);
            const query = {};
            const options = await appointmentOptionsCollection.find(query).toArray();
            // to get all the bookings on a perticuler date 
            const bookingQuery = { appointmentDate: date };
            const alreadyBooked = await bookingsCollection.find(bookingQuery).toArray();

            // be careful with the name 

            options.forEach(option => {
                // to get the booked treatements according to the name , which will return all the booked appointment of a treatement in a array
                const optionBooked = alreadyBooked.filter(book => book.treatement === option.name);
                // now to get the time slots 
                const bookedSlots = optionBooked.map(book => book.slot);
                const remainingSlots = option.slots.filter(slot => !bookedSlots.includes(slot));
                option.slots = remainingSlots;
                console.log(date, option.name, option.slots, bookedSlots, remainingSlots.length);
            })
            res.send(options);
        });
        // advanced 
        // app.get('/v2/appointmentOptions', async(req, res) =>{
        //     const date = req.query.date;
        //     const options = await appointmentOptionCollection.aggregate([
        //         {
        //             $lookup:{
        //                 from: 'bookings',
        //                 localField: 'name',
        //                 foreignField: 'treatment',
        //                 pipeline: [
        //                     {
        //                         $match: {
        //                             $expr: { 
        //                                 $eq: ['$appointmentDate', date]
        //                              }
        //                         }
        //                     }
        //                  ],
        //                 as: 'booked'
        //             }
        //         },
        //         {
        //            $project: {
        //                 name: 1,
        //                 slots: 1,
        //                 booked: {
        //                     $map: {
        //                         input: '$booked',
        //                         as: 'book',
        //                         in: '$$book.slot'
        //                     }
        //                 }
        //            } 
        //         }, 
        //         {
        //             $project: {
        //                 name: 1,
        //                 slots: {
        //                     $setDifference: ['$slots', '$booked']
        //                 }
        //             }
        //         }
        //     ]).toArray();
        //     res.send(options);
        // })

        app.post('/bookings', async (req, res) => {
            const booking = req.body
            console.log(booking);
            const query={
                appointmentDate: booking.appointmentDate,
                email: booking.email,
                treatement:booking.treatement
            }

            const alreadyBooked= await bookingsCollection.find(query).toArray();
            if(alreadyBooked.length){
                const message=`You already have an appointment on ${booking.appointmentDate}`;
                return res.send({acknowledged: false, message})
            }
            const result = await bookingsCollection.insertOne(booking);
            res.send(result);
        })
    }
    finally {

    }

}
run().catch(console.dir);


app.get('/', (req, res) => {
    res.send('Doctors Portal server is running');
})

app.listen(port, () => console.log(`Doctors portal is running on port ${port}`))