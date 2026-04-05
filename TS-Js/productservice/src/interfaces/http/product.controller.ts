import { CreateProductService } from "../../application/services/createProductservice";

export class ProductController {
  constructor(
    private createProduct: CreateProductService
  ) {}

  async create(req: any, res: any) {
    try {
      const { name, price, description } = req.body;

      const product = await this.createProduct.execute({
        name,
        price,
        description,
      });

      res.status(201).send(product);
    } catch (err: any) {
      res.status(400).send({ error: err.message });
    }
  }
}
