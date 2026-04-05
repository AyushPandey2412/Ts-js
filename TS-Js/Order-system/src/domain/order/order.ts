export class Order {
  private status: "created" | "paid"

  constructor(
    private id: string,
    private userId: string
  ) {
    this.status = "created"
  }

  markPaid() {
    if (this.status !== "created") {
      throw new Error("Order cannot be paid")
    }
    this.status = "paid"
  }

  getSnapshot() {
    return {
      id: this.id,
      userId: this.userId,
      status: this.status,
    }
  }
}
