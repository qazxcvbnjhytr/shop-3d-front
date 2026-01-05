import React from 'react';
import { CatalogFrame } from '../CatalogFrame/CatalogFrame';

export const CatalogCover = ({ title }) => {
  // Отримуємо дату та час прямо в компоненті
  const now = new Date();
  const dateString = now.toLocaleDateString('uk-UA');
  const timeString = now.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });

  return (
    <CatalogFrame showFooter={false} noPadding={true}>
      <div style={{ 
        width: '210mm',
        height: '296.7mm',
        background: 'linear-gradient(135deg, #c3ffe8, #00bfaf)', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '20mm', 
        boxSizing: 'border-box',
        position: 'relative',
        color: '#000000',
        fontFamily: 'Inter, sans-serif'
      }}>
        
        {/* Декор зверху */}
        <div style={{ letterSpacing: '8px', color: '#ffffff', fontWeight: 'bold', marginBottom: '20px' }}>
          EST. 2025
        </div>

        {/* Головний заголовок */}
        <h1 style={{ 
          fontSize: '75pt', 
          lineHeight: '0.8', 
          margin: '0', 
          fontFamily: 'Playfair Display, serif',
          fontWeight: '900'
        }}>
          {title.split(' ')[0]}<br/>
          <span style={{ color: '#ffffff' }}>{title.split(' ')[1]}</span>
        </h1>

        <div style={{ width: '80px', height: '6px', background: '#000000', margin: '40px 0' }}></div>

        {/* Слоган */}
        <p style={{ fontSize: '18pt', maxWidth: '450px', color: '#004d40', lineHeight: '1.4', fontWeight: '300' }}>
          Ми не просто робимо меблі.<br/>
          <b>Ми створюємо простір для вашого життя.</b>
        </p>

        {/* --- ТА САМА МІТКА ЧАСУ --- */}
        <div style={{ 
          position: 'absolute', 
          bottom: '15mm', // Відступ від самого низу листа
          left: '20mm', 
          fontSize: '7pt', 
          color: 'rgba(0, 77, 64, 0.6)', // Напівпрозорий темно-бірюзовий
          textTransform: 'uppercase',
          letterSpacing: '1px'
        }}>
          * Документ сформовано системою автоматично: {dateString} о {timeString}
        </div>

        {/* Декоративне коло */}
        <div style={{
          position: 'absolute',
          bottom: '-50px',
          right: '-50px',
          width: '400px',
          height: '400px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '50%',
          zIndex: 1
        }}></div>
      </div>
    </CatalogFrame>
  );
};