import { IProductRepository } from "../ports/IOrderRepository";
import { Product } from "../../domain/product/product";

export class CreateProductService {
  constructor(private productRepo: IProductRepository) {}

  async execute(input: {
    name: string;
    price: number;
    description: string;
  }): Promise<Product> {
    // 1. generate id
    const id = crypto.randomUUID();

    // 2. create domain object (business rules apply here)
    const product = new Product(
      id,
      input.name,
      input.price,
      input.description
    );

    // 3. persist
    await this.productRepo.create(product);

    // 4. return
    return product;
  }
}
