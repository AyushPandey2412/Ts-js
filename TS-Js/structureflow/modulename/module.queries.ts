export const ProductQueries = {
  FIND_BY_PRODUCT_CODE: `
    SELECT product_code FROM g365in.products WHERE product_code = :productCode
  `,

  GET_BY_ID: `
    SELECT *
    FROM g365in.products
    WHERE product_id = :product_id AND is_active = TRUE
    LIMIT 1
  `,

  INSERT_PRODUCT: `
    INSERT INTO g365in.products (
      product_id, product_code, sku, parent_sku, product_name, brand,
      category, subcategory, description, short_description, weight,
      dimensions, mrp, cost_price, selling_price, hsn_code, tax_rate,
      is_fragile, is_hazardous, requires_serial_number, images,
      is_active, metadata, created_on
    )
    VALUES (
      gen_random_uuid(), :product_code, :sku, :parent_sku, :product_name,
      :brand, :category, :subcategory, :description, :short_description,
      :weight, :dimensions, :mrp, :cost_price, :selling_price,
      :hsn_code, :tax_rate, :is_fragile, :is_hazardous,
      :requires_serial_number, :images, :is_active, :metadata, NOW()
    )
    RETURNING *;
  `,

  CHECK_SKU_CONFLICT: `
    SELECT product_id FROM g365in.products
    WHERE sku = :sku AND product_id != :product_id
  `,

  UPDATE_PRODUCT: `
    UPDATE g365in.products SET
      sku = :sku,
      product_name = :product_name,
      brand = :brand,
      category = :category,
      subcategory = :subcategory,
      description = :description,
      short_description = :short_description,
      weight = :weight,
      dimensions = :dimensions,
      mrp = :mrp,
      cost_price = :cost_price,
      selling_price = :selling_price,
      tax_rate = :tax_rate,
      images = :images,
      metadata = :metadata,
      updated_by = :updated_by,
      updated_on = NOW()
    WHERE product_id = :product_id
    RETURNING *;
  `
};
