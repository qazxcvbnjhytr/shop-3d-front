import React from 'react';
import { CatalogFrame } from '../CatalogFrame/CatalogFrame';

export const CatalogProductPage = ({ item }) => {
  const s = item.specifications || {};
  
  // Розрахунок ціни
  const hasDiscount = item.discount > 0;
  const oldPrice = Math.round(item.price * 1.15); // Декоративна стара ціна, якщо немає в базі
  const currentPrice = item.price;

  return (
    <CatalogFrame pageNo={item.pageNo}>
      <div style={{ height: '100%', display: 'flex', flexDirection: 'column', position: 'relative' }}>
        
        {/* ВЕРХНЯ ТИПОГРАФІКА (Асиметрична) */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12mm' }}>
          <div style={{ borderLeft: '3px solid #00bfaf', paddingLeft: '15px' }}>
            <h1 style={{ 
              fontFamily: 'Playfair Display, serif', 
              fontSize: '38pt', 
              margin: '0', 
              lineHeight: '1', 
              fontWeight: '900',
              letterSpacing: '-1px'
            }}>
              {item.name?.ua || item.name}
            </h1>
            <div style={{ fontSize: '9pt', color: '#00bfaf', letterSpacing: '3px', marginTop: '5px', fontWeight: 'bold' }}>
              {item.sku} // {item.collectionKeys?.[0]?.toUpperCase() || 'SIGNATURE'}
            </div>
          </div>
          <div style={{ textAlign: 'right', fontSize: '8pt', color: '#ccc', letterSpacing: '2px', textTransform: 'uppercase' }}>
            {item.category}<br/>{item.subCategory}
          </div>
        </div>

        {/* ГОЛОВНИЙ БЛОК З ФОТО (Центральний акцент) */}
        <div style={{ position: 'relative', marginBottom: '15mm' }}>
          <div style={{ 
            background: '#fcfcfc', 
            height: '110mm', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            borderRadius: '2px',
            boxShadow: '0 20px 40px rgba(0,0,0,0.02)'
          }}>
            <img src={item.b64} style={{ maxWidth: '85%', maxHeight: '85%', objectFit: 'contain' }} alt="" />
          </div>
          
          {/* Плашка знижки - мінімалізм */}
          {hasDiscount && (
            <div style={{ 
              position: 'absolute', 
              top: '-10px', 
              right: '20px', 
              background: '#000', 
              color: '#fff', 
              padding: '15px 10px', 
              fontSize: '12pt', 
              fontWeight: '900',
              writingMode: 'vertical-rl',
              letterSpacing: '2px'
            }}>
              OFFER -{item.discount}%
            </div>
          )}
        </div>

        {/* ІНФОРМАЦІЙНА СІТКА */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.2fr', gap: '20mm', flex: 1 }}>
          
          {/* Ліво: Опис та Кольори */}
          <div>
            <p style={{ fontSize: '10.5pt', color: '#555', lineHeight: '1.7', margin: '0 0 20px 0', fontWeight: '300' }}>
              {item.description?.ua || item.description}
            </p>
            
            <div style={{ marginTop: '30px' }}>
              <span style={{ fontSize: '8pt', letterSpacing: '2px', color: '#aaa', display: 'block', marginBottom: '12px' }}>AVAILABLE FINISHES</span>
              <div style={{ display: 'flex', gap: '15px' }}>
                {item.colorKeys?.map(color => (
                  <div key={color} style={{ textAlign: 'center' }}>
                    <div style={{ 
                      width: '32px', 
                      height: '32px', 
                      borderRadius: '50%', 
                      background: color, 
                      border: '4px solid #fff',
                      boxShadow: '0 5px 15px rgba(0,0,0,0.1)'
                    }} />
                    <span style={{ fontSize: '7pt', color: '#aaa', marginTop: '5px', display: 'block' }}>{color.toUpperCase()}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Право: Характеристики (Чиста таблиця) */}
          <div style={{ background: '#fdfdfd', padding: '20px', border: '1px solid #f5f5f5' }}>
            <h4 style={{ fontSize: '8pt', letterSpacing: '3px', margin: '0 0 15px 0', borderBottom: '1px solid #000', paddingBottom: '5px' }}>TECHNICAL DETAILS</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px 20px' }}>
              {[
                ['Width', s.width + ' cm'],
                ['Height', s.height + ' cm'],
                ['Depth', s.depth + ' cm'],
                ['Weight', s.weight + ' kg'],
                ['Material', s.materialKey],
                ['Warranty', s.warranty + ' months']
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #eee', paddingBottom: '5px', fontSize: '9pt' }}>
                  <span style={{ color: '#999' }}>{label}</span>
                  <span style={{ fontWeight: 'bold' }}>{val}</span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: '20px', fontSize: '8pt', fontWeight: 'bold', color: item.inStock ? '#00bfaf' : '#d32f2f' }}>
               {item.inStock ? '● IN STOCK' : '○ BY ORDER ONLY'}
            </div>
          </div>
        </div>

        {/* ПАНЕЛЬ ЦІНИ (Преміальний фініш) */}
        <div style={{ 
          marginTop: '10mm', 
          background: '#1a1a1a', 
          padding: '30px 40px', 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          color: '#fff'
        }}>
          <div>
            <div style={{ fontSize: '7pt', letterSpacing: '5px', opacity: '0.4', marginBottom: '5px' }}>INVESTMENT</div>
            <div style={{ fontSize: '11pt', fontWeight: '300', color: '#00bfaf' }}>Exclusive Furniture Systems</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '14pt', textDecoration: 'line-through', opacity: '0.3', marginRight: '20px', fontWeight: '300' }}>
              {oldPrice.toLocaleString()}
            </span>
            <span style={{ fontSize: '36pt', fontWeight: '900', letterSpacing: '-1px' }}>
              {currentPrice?.toLocaleString()} <span style={{ fontSize: '16pt', fontWeight: '300' }}>UAH</span>
            </span>
          </div>
        </div>
      </div>
    </CatalogFrame>
  );
};