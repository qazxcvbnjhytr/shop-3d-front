// server/admin/routes/admin.index.js
import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/protectAdmin.js";

import adminProductsRoutes from "./products.routes.js";
import adminCategoriesRoutes from "./categories.routes.js";
import adminSubcategoriesRoutes from "./subcategories.routes.js";
import adminOrdersRoutes from "./orders.routes.js";
import adminUsersRoutes from "./users.routes.js";
import adminSettingsRoutes from "./settings.routes.js";

const router = Router();

// Єдиний gate для адмінки
router.use(protect, protectAdmin);

router.use("/products", adminProductsRoutes);
router.use("/categories", adminCategoriesRoutes);
router.use("/subcategories", adminSubcategoriesRoutes);
router.use("/orders", adminOrdersRoutes);
router.use("/users", adminUsersRoutes);
router.use("/settings", adminSettingsRoutes);

export default router;
