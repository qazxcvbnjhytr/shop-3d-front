import React, { useRef, useState, useMemo } from "react";
import axios from "axios";
import html2pdf from "html2pdf.js";

import { useTranslation } from "../../hooks/useTranslation"; // ✅ ДОДАТИ

import { CatalogCover } from "./CatalogCover/CatalogCover";
import { CatalogTOC } from "./CatalogTOC/CatalogTOC";
import { CatalogProductPage } from "./CatalogProductPage/CatalogProductPage";
import { CatalogCategoryPage } from "./CatalogCategoryPage/CatalogCategoryPage";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

// ✅ Нормалізація: твій проект часто має uk/ua
const normalizeLang = (lang) => (lang === "uk" ? "ua" : (lang || "ua"));

// ✅ Мовозалежний текст
const getTxtByLang = (obj, lang = "ua") => {
  const L = normalizeLang(lang);
  if (obj == null) return "";
  if (typeof obj === "string" || typeof obj === "number") return String(obj);

  if (typeof obj === "object") {
    // пріоритет: поточна мова -> ua -> en -> перше значення
    return (
      String(obj?.[L] ?? obj?.ua ?? obj?.en ?? Object.values(obj)[0] ?? "")
    );
  }
  return "";
};

const toBase64 = (url) =>
  new Promise((resolve) => {
    const img = new Image();
    img.setAttribute("crossOrigin", "anonymous");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = img.width;
      canvas.height = img.height;
      canvas.getContext("2d").drawImage(img, 0, 0);
      resolve(canvas.toDataURL("image/jpeg", 0.9));
    };
    img.onerror = () => resolve(null);
    img.src = url;
  });

export default function DownloadCatalog() {
  const [isGenerating, setIsGenerating] = useState(false);
  const [catalogStructure, setCatalogStructure] = useState([]);
  const pdfRef = useRef(null);

  // ✅ Беремо поточну мову + переклади
  const { language, t } = useTranslation();
  const lang = useMemo(() => normalizeLang(language), [language]);

  const generate = async () => {
    if (isGenerating) return;
    setIsGenerating(true);

    try {
      const [prodRes, catRes] = await Promise.all([
        axios.get(`${API_URL}/api/products`, { params: { lang } }),     // ✅ якщо бекенд вміє
        axios.get(`${API_URL}/api/categories`, { params: { lang } }),   // ✅ якщо бекенд вміє
      ]);

      const allProducts = prodRes.data;
      const categories = catRes.data;

      // 1) Будуємо структуру мовою lang
      const baseStructure = categories
        .map((cat) => {
          const subCats = (cat.children || [])
            .map((sub) => {
              const products = allProducts.filter(
                (p) => p.category === cat.category && p.subCategory === sub.key
              );

              return {
                subName: getTxtByLang(sub.names, lang),
                products,
              };
            })
            .filter((s) => s.products.length > 0);

          return {
            catName: getTxtByLang(cat.names, lang),
            subCategories: subCats,
          };
        })
        .filter((c) => c.subCategories.length > 0);

      // 2) Трекер сторінок (Обкладинка=1, Зміст=2)
      let globalPageTracker = 3;

      const finalStructure = [];
      for (const cat of baseStructure) {
        const categoryPageIndex = finalStructure.length + 1;
        globalPageTracker++;

        const newSubCats = [];
        for (const sub of cat.subCategories) {
          const newProducts = [];
          for (const prod of sub.products) {
            const rawPath = prod.images?.[0];
            const fullUrl = rawPath?.startsWith("http")
              ? rawPath
              : `${API_URL}${rawPath}`;
            const b64 = await toBase64(fullUrl);

            newProducts.push({
              ...prod,
              // ✅ назва/опис відповідно до мови
              nameTxt: getTxtByLang(prod.name, lang),
              descTxt: getTxtByLang(prod.description, lang),
              b64,
              pageNo: globalPageTracker++,
            });
          }
          newSubCats.push({ ...sub, products: newProducts });
        }

        finalStructure.push({
          ...cat,
          subCategories: newSubCats,
          catIndex: categoryPageIndex,
        });
      }

      setCatalogStructure(finalStructure);

      // Чекаємо рендеру важких елементів
      await new Promise((r) => setTimeout(r, 3500));

      const opt = {
        margin: 0,
        // ✅ файл теж може залежати від мови
        filename: `MEBLI_HUB_LUXURY_2025_${lang.toUpperCase()}.pdf`,
        image: { type: "jpeg", quality: 1.0 },
        html2canvas: {
          scale: 2,
          useCORS: true,
          width: 794,
          letterRendering: true,
        },
        jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        pagebreak: { mode: ["css", "legacy"] },
      };

      await html2pdf().set(opt).from(pdfRef.current).save();
    } catch (e) {
      console.error("Генерація провалилась:", e);
      alert("Сталася помилка при створенні PDF.");
    } finally {
      setIsGenerating(false);
      setCatalogStructure([]);
    }
  };

  // ✅ локальні підписи UI через t (з fallback)
  const uiTitle = t?.catalogPdf?.generatorTitle || "Генератор каталогу";
  const uiDesc =
    t?.catalogPdf?.generatorDesc ||
    "Натисніть кнопку нижче, щоб сформувати актуальний преміум-каталог у форматі PDF.";
  const btnIdle = t?.catalogPdf?.downloadBtn || "ЗАНТАЖИТИ PDF";
  const btnBusy = t?.catalogPdf?.buildingBtn || "ЗБИРАЄМО СТОРІНКИ...";

  return (
    <div style={{ textAlign: "center", padding: "100px", background: "#f5f5f5", minHeight: "100vh" }}>
      <div style={{ maxWidth: "600px", margin: "0 auto", background: "#fff", padding: "40px", borderRadius: "20px", boxShadow: "0 10px 30px rgba(0,0,0,0.05)" }}>
        <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "24pt", marginBottom: "20px" }}>
          {uiTitle}
        </h2>
        <p style={{ color: "#666", marginBottom: "30px" }}>
          {uiDesc}
        </p>

        <button
          onClick={generate}
          disabled={isGenerating}
          style={{
            padding: "20px 50px",
            fontSize: "16pt",
            fontWeight: "bold",
            cursor: "pointer",
            background: "linear-gradient(135deg, #00bfaf, #004d40)",
            color: "#fff",
            border: "none",
            borderRadius: "50px",
            transition: "transform 0.2s",
            boxShadow: "0 5px 15px rgba(0, 191, 175, 0.3)",
          }}
          onMouseEnter={(e) => (e.target.style.transform = "scale(1.05)")}
          onMouseLeave={(e) => (e.target.style.transform = "scale(1)")}
        >
          {isGenerating ? btnBusy : btnIdle}
        </button>
      </div>

      {/* Рендер-зона (прихована) */}
      <div style={{ position: "absolute", left: "-10000px", top: 0 }}>
        <div ref={pdfRef} style={{ width: "210mm", background: "white" }}>
          {catalogStructure.length > 0 && (
            <>
              {/* ✅ Передай мову/туди, де є текст */}
              <CatalogCover title={t?.catalogPdf?.coverTitle || "MEBLI HUB"} lang={lang} />
              <CatalogTOC structure={catalogStructure} lang={lang} t={t} />

              {catalogStructure.map((cat, idx) => (
                <React.Fragment key={idx}>
                  <CatalogCategoryPage
                    categoryName={cat.catName}
                    index={cat.catIndex}
                    lang={lang}
                    t={t}
                  />

                  {cat.subCategories.map((sub, sIdx) => (
                    <React.Fragment key={sIdx}>
                      {sub.products.map((product) => (
                        <CatalogProductPage key={product._id} item={product} lang={lang} t={t} />
                      ))}
                    </React.Fragment>
                  ))}
                </React.Fragment>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
