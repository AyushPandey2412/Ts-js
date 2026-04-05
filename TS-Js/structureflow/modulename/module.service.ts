// import { sequelize } from "../../config/database";
// import { ProductRepository } from "./product.repository";
// import { ensureSkuIsUnique } from "./product.validators";

// export class ProductService {
//   constructor(private repo = new ProductRepository()) {}

//   async createProduct(data: any) {
//     return sequelize.transaction(async (t) => {
//       const product = await this.repo.create(data, t);
//       return product;
//     });
//   }

//   async updateProduct(data: any) {
//     return sequelize.transaction(async (t) => {
//       const conflicts = await this.repo.checkSkuConflict(
//         data.sku,
//         data.product_id,
//         t
//       );

//       ensureSkuIsUnique(conflicts);

//       return this.repo.update(data, t);
//     });
//   }

//   async getById(product_id: string) {
//     return this.repo.getById(product_id);
//   }
// }
