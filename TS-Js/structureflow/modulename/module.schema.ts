// // src/schemas/product.schema.ts
// import { z } from "zod";

// // Shared fields
// // const baseProductSchema = {
// //   sku: z.string().min(1, "SKU is required").max(100),
// //   // product_id: z.string().max(100).optional(),
// //   parent_sku: z.string().max(100).optional(),
// //   product_name: z.string().min(1, "Product name is required").max(500),
// //   brand: z.string().max(100).optional(),
// //   category: z.string().max(100).optional(),
// //   subcategory: z.string().max(100).optional(),
// //   description: z.string().optional(),
// //   short_description: z.string().max(500).optional(),
// //   weight: z.number().max(99999.999).optional(),
// //   dimensions: z.record(z.string(), z.any()).optional(),
// //   mrp: z.number().max(99999999.99).optional(),
// //   cost_price: z.number().max(99999999.99).optional(),
// //   selling_price: z.number().max(99999999.99).optional(),
// //   hsn_code: z.string().max(20).optional(),
// //   tax_rate: z.number().max(999.99).optional(),
// //   is_fragile: z.boolean().optional(),
// //   is_hazardous: z.boolean().optional(),
// //   requires_serial_number: z.boolean().optional(),
// //   images: z.array(z.string()).optional(),
// //   videos: z.array(z.string()).optional(),
// //   is_active: z.boolean().optional(),
// //   metadata: z.record(z.string(), z.any()).optional()
// // };





// // this is for testing with postman 

// export const baseProductSchema = {
//   sku: z.string().min(1, "SKU is required").max(100),
//   parent_sku: z.string().max(100).optional(),
//   product_name: z.string().min(1, "Product name is required").max(500),
//   brand: z.string().max(100).optional(),
//   category: z.string().max(100).optional(),
//   subcategory: z.string().max(100).optional(),
//   description: z.string().optional(),
//   short_description: z.string().max(500).optional(),


//   weight: z.coerce.number().max(99999.999).optional(),
//   mrp: z.coerce.number().max(99999999.99).optional(),
//   cost_price: z.coerce.number().max(99999999.99).optional(),
//   selling_price: z.coerce.number().max(99999999.99).optional(),
//   tax_rate: z.coerce.number().max(999.99).optional(),

//   dimensions: z.preprocess((val) => {
//     if (typeof val === "string") return JSON.parse(val);
//     return val;
//   }, z.record(z.string(), z.any()).optional()),
//   metadata: z.preprocess((val) => {
//     if (typeof val === "string") return JSON.parse(val);
//     return val;
//   }, z.record(z.string(), z.any()).optional()),


//   is_fragile: z.coerce.boolean().optional(),
//   is_hazardous: z.coerce.boolean().optional(),
//   requires_serial_number: z.coerce.boolean().optional(),
//   is_active: z.coerce.boolean().optional(),
//   hsn_code: z.string().max(20).optional(),


//   images: z.array(z.string()).optional(),
//   videos: z.array(z.string()).optional(),
// };



// // export const createProductSchema = z.object({
// //   body: z.object({
// //     ...baseProductSchema,
// //     // created_by: z.string().uuid(),
// //   }),
// // });

// export const createProductSchema = z.object({
//   ...baseProductSchema,
//   // created_by: z.string().uuid(),
// });





// // export const updateProductSchema = z.object({
// //   params: z.object({
// //     product_id: z.string().uuid(),
// //   }),
// //   body: z.object({
// //     sku: z.string().max(100).optional(),
// //     parent_sku: z.string().max(100).optional(),
// //     product_name: z.string().max(500).optional(),
// //     brand: z.string().max(100).optional(),
// //     category: z.string().max(100).optional(),
// //     subcategory: z.string().max(100).optional(),
// //     description: z.string().optional(),
// //     short_description: z.string().max(500).optional(),
// //     weight: z.number().max(99999.999).optional(),
// //     dimensions: z.record(z.string(), z.any()).optional(),
// //     mrp: z.number().max(99999999.99).optional(),
// //     cost_price: z.number().max(99999999.99).optional(),
// //     selling_price: z.number().max(99999999.99).optional(),
// //     hsn_code: z.string().max(20).optional(),
// //     tax_rate: z.number().max(999.99).optional(),
// //     is_fragile: z.boolean().optional(),
// //     is_hazardous: z.boolean().optional(),
// //     requires_serial_number: z.boolean().optional(),
// //     images: z.array(z.string()).optional(),
// //     is_active: z.boolean().optional(),
// //     metadata: z.record(z.string(), z.any()).optional(),
// //     updated_by: z.string().uuid().optional(),
// //   }),
// // });


// export const updateProductSchema = z.object({
//   params: z.object({
//     product_id: z.string().uuid(),
//   }),
//   body: z.object({
//     sku: z.string().max(100).optional(),
//     parent_sku: z.string().max(100).optional(),
//     product_name: z.string().max(500).optional(),
//     brand: z.string().max(100).optional(),
//     category: z.string().max(100).optional(),
//     subcategory: z.string().max(100).optional(),
//     description: z.string().optional(),
//     short_description: z.string().max(500).optional(),

//     weight: z.coerce.number().max(99999.999).optional(),
//     mrp: z.coerce.number().max(99999999.99).optional(),
//     cost_price: z.coerce.number().max(99999999.99).optional(),
//     selling_price: z.coerce.number().max(99999999.99).optional(),
//     tax_rate: z.coerce.number().max(999.99).optional(),

    
//     dimensions: z.preprocess((val) => {
//       if (typeof val === "string") return JSON.parse(val);
//       return val;
//     }, z.record(z.string(), z.any()).optional()),
//     metadata: z.preprocess((val) => {
//       if (typeof val === "string") return JSON.parse(val);
//       return val;
//     }, z.record(z.string(), z.any()).optional()),

   
//     is_fragile: z.coerce.boolean().optional(),
//     is_hazardous: z.coerce.boolean().optional(),
//     requires_serial_number: z.coerce.boolean().optional(),
//     is_active: z.coerce.boolean().optional(),

//     images: z.array(z.string()).optional(),

//     hsn_code: z.string().max(20).optional(),

//     updated_by: z.string().uuid().optional(),
//   }),
// });





// export const getAllProductsSchema = z.object({
//   query: z.object({
//     page: z
//       .string()
//       .optional()
//       .transform((val) => (val ? parseInt(val, 10) : undefined)),
//     limit: z
//       .string()
//       .optional()
//       .transform((val) => (val ? parseInt(val, 10) : undefined)),
//     search: z.string().max(500).optional(),
//     category: z.string().max(100).optional(),
//     subcategory: z.string().max(100).optional(),
//     is_active: z
//       .string()
//       .optional()
//       .transform((val) => (val === "true" ? true : val === "false" ? false : undefined)),
//     brand: z.string().max(100).optional(),
//   }),
// });


// export const changeStatusProductSchema = z.object({
//   is_active: z.boolean(),
// });

// // export type CreateProductInput = z.infer<typeof createProductSchema>["body"];
// export type CreateProductInput = z.infer<typeof createProductSchema>;
// // export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"];




// export type UpdateProductInput = z.infer<typeof updateProductSchema>["body"] & {
//   product_id: string;
// };
