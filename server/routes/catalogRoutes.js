import express from 'express';
import path from 'path';

const router = express.Router();

router.get('/download', (req, res) => {
  const file = path.resolve('public/catalog-2024.pdf');
  res.download(file, 'MebliHub_Catalog.pdf', (err) => {
    if (err) {
      res.status(500).send({ message: "Файл не знайдено" });
    }
  });
});

export default router;