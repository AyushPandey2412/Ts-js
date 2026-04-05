// import { ProductService } from "./product.service";
// import { FastifyRequest, FastifyReply } from "fastify";

// const service = new ProductService();

// export async function getProductByIdHandler(req: FastifyRequest, reply: FastifyReply) {
//   const { product_id } = req.params as any;
//   const product = await service.getById(product_id);

//   if (!product) {
//     return reply.status(404).send({ message: "Product not found" });
//   }

//   return reply.send(product);
// }















// import { FastifyRequest, FastifyReply } from "fastify";
// import { ProductService } from "./product.service";
// import {
//   createProductSchema,
//   updateProductSchema,
//   CreateProductInput,
//   UpdateProductInput,
// } from "./product.schema";

// const service = new ProductService();

// /**
//  * CREATE PRODUCT
//  */
// export async function createProductHandler(
//   req: FastifyRequest,
//   reply: FastifyReply
// ) {
//   // 1️⃣ Validate & parse body
//   const data: CreateProductInput = createProductSchema.parse(req.body);

//   // 2️⃣ Call service (transaction + workflow inside)
//   const product = await service.createProduct(data);

//   // 3️⃣ HTTP response
//   return reply.status(201).send(product);
// }

// /**
//  * UPDATE PRODUCT
//  */
// export async function updateProductHandler(
//   req: FastifyRequest,
//   reply: FastifyReply
// ) {
//   // 1️⃣ Validate params + body
//   const { params, body } = updateProductSchema.parse({
//     params: req.params,
//     body: req.body,
//   });

//   const data: UpdateProductInput = {
//     product_id: params.product_id,
//     ...body,
//   };

//   // 2️⃣ Call service
//   const product = await service.updateProduct(data);

//   // 3️⃣ HTTP response
//   return reply.send(product);
// }

// /**
//  * GET PRODUCT BY ID
//  */
// export async function getProductByIdHandler(
//   req: FastifyRequest,
//   reply: FastifyReply
// ) {
//   // 1️⃣ Validate params
//   const { product_id } = updateProductSchema.shape.params.parse(req.params);

//   // 2️⃣ Call service
//   const product = await service.getById(product_id);

//   // 3️⃣ HTTP decision
//   if (!product) {
//     return reply.status(404).send({
//       message: "Product not found",
//     });
//   }

//   return reply.send(product);
// }
