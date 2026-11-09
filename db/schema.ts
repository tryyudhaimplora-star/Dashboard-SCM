import { pgTable, text, integer } from 'drizzle-orm/pg-core';
export const skuCartons = pgTable('sku_cartons', {
  sku: text().primaryKey(),
  qtyPerCtn: integer('qty_per_ctn').notNull(),
});
