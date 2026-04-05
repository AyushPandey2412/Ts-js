import { PlaceOrderService } from "../../application/order/PlaceOrderService"
import { OrderRepository } from "../../infrastructure/db/OrderRepo"

const service = new PlaceOrderService(new OrderRepository())

export async function createOrder(req, res) {
  const { userId } = req.body

  const result = await service.execute(userId)

  res.json(result)
}
