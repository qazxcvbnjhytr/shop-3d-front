import React from 'react';
import { CatalogFrame } from '../CatalogFrame/CatalogFrame';

export const CatalogCategoryPage = ({ categoryName, subCategoryName, index }) => (
  <CatalogFrame showFooter={false} noPadding={true}>
    <div style={{ 
      height: '100%', 
      width: '210mm',
      background: 'linear-gradient(135deg, #00bfaf 0%, #004d40 100%)', 
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'center', 
      alignItems: 'center',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden',
      color: '#ffffff'
    }}>
      
      {/* ФОНОВИЙ НОМЕР РОЗДІЛУ (Прикольна фішка) */}
      <div style={{
        position: 'absolute',
        fontSize: '250pt',
        fontWeight: '900',
        fontFamily: 'Playfair Display, serif',
        color: 'rgba(255, 255, 255, 0.05)',
        lineHeight: '1',
        zIndex: 1,
        pointerEvents: 'none',
        left: '-20px',
        bottom: '-50px'
      }}>
        {index < 10 ? `0${index}` : index}
      </div>

      {/* ОСНОВНИЙ КОНТЕНТ */}
      <div style={{ zIndex: 2, position: 'relative' }}>
        <div style={{ 
          letterSpacing: '10px', 
          color: '#c3ffe8', 
          fontWeight: '300', 
          marginBottom: '15px',
          fontSize: '10pt',
          textTransform: 'uppercase'
        }}>
          Collection — 2025
        </div>

        <h1 style={{ 
          fontSize: '55pt', 
          fontFamily: 'Playfair Display, serif', 
          textTransform: 'uppercase',
          margin: '0',
          lineHeight: '1',
          letterSpacing: '-1px'
        }}>
          {categoryName}
        </h1>

        {subCategoryName && (
          <div style={{ 
            marginTop: '30px', 
            padding: '12px 40px', 
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(5px)',
            border: '1px solid rgba(195, 255, 232, 0.3)',
            fontSize: '16pt',
            fontWeight: '300',
            letterSpacing: '2px',
            textTransform: 'lowercase',
            fontStyle: 'italic'
          }}>
            {subCategoryName}
          </div>
        )}
      </div>

      {/* ДЕКОРАТИВНІ ЛІНІЇ (Стиль і геометрія) */}
      <div style={{ 
        position: 'absolute', 
        top: '40px', 
        right: '40px', 
        width: '100px', 
        height: '1px', 
        background: '#c3ffe8' 
      }}></div>
      
      <div style={{ 
        position: 'absolute', 
        bottom: '80px', 
        width: '1px', 
        height: '150px', 
        background: 'linear-gradient(to bottom, transparent, #c3ffe8)' 
      }}></div>

      {/* МІТКА БРЕНДУ */}
      <div style={{
        position: 'absolute',
        right: '-40px',
        transform: 'rotate(-90deg)',
        fontSize: '9pt',
        letterSpacing: '5px',
        color: 'rgba(195, 255, 232, 0.5)',
        textTransform: 'uppercase'
      }}>
        Premium Quality Furniture
      </div>

    </div>
  </CatalogFrame>
);