import redis from "redis"
import { promisify } from "util"
import kue from "kue"
import express from "express"


const client = redis.createClient();
const getAsync = promisify(client.get).bind(client);
const queue = kue.createQueue();
const app = express();
const port = 1245;


client.set("available_seats", 50);
let reservationEnabled = true;

function reserveSeat(number) {
    client.set("available_seats", number)
}

async function getCurrentAvailableSeats() {
    try {
        const availableSeats = await getAsync("available_seats")
        if (parseInt(availableSeats) < 0) {
            reservationEnabled = false
        }

        return parseInt(availableSeats) || 0;
    } catch (error) {
        console.log("Error getting current available seats", error);
    }
}

app.get("/available_seats", async (req, res) => {
    const seats = await getCurrentAvailableSeats()
    res.json({numberOfAvailableSeats: `${seats}`})
})

app.get("/reserve_seat", (req, res) => {
    if (!reservationEnabled) {
        return res.json({status: "Reservation are blocked"});
    }
    const job = queue.create("reserve_seat")
    .save((err) => {
        if (!err) {
            return res.json({status: "Reservation in process"})
        } else {
            return res.json({status: "Reservation failed"})
        }
    })

    job.on("complete", () => {
        console.log(`Seat reservation job ${job.id} completed`)
    })

    job.on("failed", (err) => {
        console.log(`Seat reservation job ${job.id} failed: ${err}`)
    })
})

app.get('/process', (req, res) => {
    queue.process("reserve_seat", async (job, done) => {
        const currentSeats = await getCurrentAvailableSeats()
        
        if (currentSeats <= 0) {
            done(new Error('Not enough seats available'))
        } else {
            const newSeats = currentSeats - 1
            reserveSeat(newSeats)

            if (newSeats === 0) {
                reservationEnabled = false
            }
        }
    })

    res.json({status: "Queue processing"})
})


app.listen(port, () => {
    console.log("Server is listening on port: ", port)
})
