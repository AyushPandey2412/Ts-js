import { ProductRepo } from "../infrastructure/db/ProductRepo";
import { CreateProductService } from "../application/services/createProductservice";
import { ProductController } from "../interfaces/http/product.controller";
import { productRoutes } from "../routes/product.routes";

export function composeProduct(app: any) {
  const productRepo = new ProductRepo();
  const createProductService = new CreateProductService(productRepo);
  const productController = new ProductController(createProductService);

  productRoutes(app, productController);
}
