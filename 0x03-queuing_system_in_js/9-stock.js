import express from "express"
import redis from "redis"
import { promisify } from "util"

const app  = express();
const PORT = 1245;
const client = redis.createClient()
const getAsync = promisify(client.get).bind(client)

const listProducts = [
    {id: 1, name: "Suitcase 250", price: 50, stock: 4},
    {id: 2, name: "Suitcase 450", price: 100, stock: 10},
    {id: 3, name: "Suitcase 650", price: 350, stock: 2},
    {id: 4, name: "Suitcase 1050", price: 550, stock: 5}
]


function getItemById(id) {
    return listProducts.find(product => product.id === id)
}

function reserveStockById(itemId, stock) {
    client.set(`item.${itemId}`, stock)
}

async function getCurrentReservedStockById(itemId) {
    try {
        const stock = await getAsync(`item.${itemId}`)
        return stock ?  parseInt(stock, 10) : 0;
    } catch (error) {
        console.error("Error getting stock", error)
        return 0
    }
}


app.get("/list_products", (req, res) => {
    const formattedProducts = listProducts.map(product => ({
        itemId: product.id,
        itemName: product.name,
        price: product.price,
        initialAvailableQuantity: product.stock
    }))
    res.json(formattedProducts)
})

app.get('/list_products/:itemId', async (req, res) => {
    const { itemId } = req.params;
    const product = getItemById(parseInt(itemId, 10));

    if (!product) {
        return res.status(404).json({status: "Product not found"});
    }

    const reservedStock = await getCurrentReservedStockById(itemId);
    const currentQuantity = product.stock - reservedStock;

    res.json({
        itemId: product.id,
        itemName: product.name,
        price: product.price,
        initialAvailableQuantity: product.stock,
        currentQuantity,
    });
})


app.get('/reserve_product/:itemId', async (req, res) => {
    const { itemId } = req.params
    const product = getItemById(parseInt(itemId, 10))

    if (!product) {
        res.status(404).json({status: "Product not found"})
    }

    const reservedStock = await getCurrentReservedStockById(itemId);
    const currentQuantity = product.stock - reservedStock;

    if (currentQuantity <= 0) {
        return res.status(404).json(
            {
                status: "Not enough stock available", 
                itemId: parseInt(itemId),
            }
        )
    } else {
        reserveStockById(itemId, product.stock)
        res.json({status: "Reservation confirmed", itemId: parseInt(itemId)})
    }    
})


app.listen(PORT, () => {
    console.log("Server is running on port: ", PORT)
})
