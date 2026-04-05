import { Order } from "../../domain/order/order"

export class OrderRepository {
  async save(order: Order) {
    // pretend DB write
    console.log("Saving order:", order.getSnapshot())
  }
}
