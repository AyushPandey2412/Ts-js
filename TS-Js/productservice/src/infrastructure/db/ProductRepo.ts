import { IProductRepository } from "../../application/ports/IOrderRepository";
import { Product } from "../../domain/product/product";
import { sequelize } from "../../config/db";

export class ProductRepo implements IProductRepository {
  async create(product: Product): Promise<void> {
    await sequelize.query(
      `INSERT INTO products (id, name, price, description)
       VALUES ($1, $2, $3, $4)`,
      {
        bind: [
          product.id,
          product.name,
          product.price,
          product.description,
        ],
      }
    );
  }

  async update(product: Product): Promise<void> {
    await sequelize.query(
      `UPDATE products
       SET name = $2, price = $3, description = $4
       WHERE id = $1`,
      {
        bind: [
          product.id,
          product.name,
          product.price,
          product.description,
        ],
      }
    );
  }

  async findById(id: string): Promise<Product | null> {
    const [rows] = await sequelize.query(
      `SELECT id, name, price, description
       FROM products
       WHERE id = $1`,
      { bind: [id] }
    );

    const data = (rows as any[])[0];
    if (!data) return null;

    return new Product(
      data.id,
      data.name,
      Number(data.price),
      data.description
    );
  }

  async findAll(): Promise<Product[]> {
    const [rows] = await sequelize.query(
      `SELECT id, name, price, description
       FROM products`
    );

    return (rows as any[]).map(
      (r) => new Product(r.id, r.name, Number(r.price), r.description)
    );
  }

  async delete(id: string): Promise<void> {
    await sequelize.query(
      `DELETE FROM products WHERE id = $1`,
      { bind: [id] }
    );
  }
}
