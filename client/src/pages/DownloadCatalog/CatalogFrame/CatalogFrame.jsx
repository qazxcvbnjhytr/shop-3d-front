import React from 'react';
import './CatalogFrame.css';

export const CatalogFrame = ({ children, pageNo, theme = 'light', showFooter = true }) => (
  <div className={`catalog-page ${theme}`}>
    {/* Контент сторінки тепер у власному боксі з обмеженням */}
    <div className="catalog-body">
      {children}
    </div>

    {/* Футер тепер займає фіксоване місце внизу сторінки */}
    {showFooter && (
      <div className="catalog-footer">
        <div className="footer-line"></div>
        <div className="footer-row">
          <span className="brand-name">MEBLI HUB — LUXURY 2025</span>
          <span className="page-num">{pageNo}</span>
        </div>
      </div>
    )}
  </div>
);