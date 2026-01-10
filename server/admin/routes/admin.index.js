import { Router } from "express";
import { protect } from "../../middleware/authMiddleware.js";
import { protectAdmin } from "../middleware/protectAdmin.js"; // ✅ правильний шлях
import * as adminCtrl from "../../controllers/adminController.js";

import adminProductsRoutes from "./products.routes.js";
import adminCategoriesRoutes from "./categories.routes.js";
import adminSubcategoriesRoutes from "./subcategories.routes.js";
import adminOrdersRoutes from "./orders.routes.js";
import adminSettingsRoutes from "./settings.routes.js";

const router = Router();

router.use(protect, protectAdmin);

router.use("/products", adminProductsRoutes);
router.use("/categories", adminCategoriesRoutes);
router.use("/subcategories", adminSubcategoriesRoutes);
router.use("/orders", adminOrdersRoutes);
router.use("/settings", adminSettingsRoutes);

router.get("/users", adminCtrl.getAllUsers);
router.post("/users", adminCtrl.createUser);
router.put("/users/:id", adminCtrl.updateUser);
router.delete("/users/:id", adminCtrl.deleteUser);

router.get("/stats", adminCtrl.getStats);

export default router;
