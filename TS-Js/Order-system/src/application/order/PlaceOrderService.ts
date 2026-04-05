import { Order } from "../../domain/order/order"
import { OrderRepository } from "../../infrastructure/db/OrderRepo"

export class PlaceOrderService {
  constructor(private repo: OrderRepository) {}

  async execute(userId: string) {
    const order = new Order(crypto.randomUUID(), userId)

    // business flow
    order.markPaid()

    await this.repo.save(order)

    return order.getSnapshot()
  }
}
