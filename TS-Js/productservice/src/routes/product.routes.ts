import { ProductController } from "../interfaces/http/product.controller";

export function productRoutes(app: any, controller: ProductController) {
  app.post("/products", (req: any, res: any) =>
    controller.create(req, res)
  );
}
