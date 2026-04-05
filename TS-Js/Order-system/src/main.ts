import express from "express"
import { createOrder } from "./interfaces/http/order.controller"

const app = express()
app.use(express.json())

app.post("/orders", createOrder)

app.listen(3000, () => {
  console.log("Server running")
})
