export class Product {
  constructor(
    public readonly id: string,
    public name: string,
    public price: number,
    public description: string
  ) {
    if (price < 0) {
      throw new Error("Price cannot be negative");
    }
  }
}
