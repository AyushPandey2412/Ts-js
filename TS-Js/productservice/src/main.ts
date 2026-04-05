import fastify from "fastify";
import { connectDB } from "./config/db";
import { composeProduct } from "./composition/product.composition";

async function bootstrap() {
  await connectDB();

  const app = fastify();

  composeProduct(app);

  await app.listen({ port: 3000 });
  console.log("Server running on http://localhost:3000");
}

bootstrap();
