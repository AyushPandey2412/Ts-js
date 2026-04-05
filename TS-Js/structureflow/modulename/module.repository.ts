// import { sequelize } from "../../config/database";
// import { QueryTypes, Transaction } from "sequelize";
// import { ProductQueries } from "./product.queries";

// export class ProductRepository {
//   async findByProductCode(code: string, t?: Transaction) {
//     return sequelize.query(ProductQueries.FIND_BY_PRODUCT_CODE, {
//       replacements: { productCode: code },
//       type: QueryTypes.SELECT,
//       transaction: t,
//     });
//   }

//   async getById(product_id: string) {
//     const rows = await sequelize.query(ProductQueries.GET_BY_ID, {
//       replacements: { product_id },
//       type: QueryTypes.SELECT,
//     });
//     return rows[0] || null;
//   }

//   async create(data: any, t: Transaction) {
//     const [row] = await sequelize.query(ProductQueries.INSERT_PRODUCT, {
//       replacements: data,
//       type: QueryTypes.SELECT,
//       transaction: t,
//     });`
//     return row;
//   }

//   async checkSkuConflict(sku: string, product_id: string, t: Transaction) {
//     return sequelize.query(ProductQueries.CHECK_SKU_CONFLICT, {
//       replacements: { sku, product_id },
//       type: QueryTypes.SELECT,
//       transaction: t,
//     });
//   }

//   async update(data: any, t: Transaction) {
//     const rows = await sequelize.query(ProductQueries.UPDATE_PRODUCT, {
//       replacements: data,
//       type: QueryTypes.SELECT,
//       transaction: t,
//     });
//     return rows[0];
//   }
// }
