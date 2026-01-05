import React from 'react';
import { CatalogFrame } from '../CatalogFrame/CatalogFrame';
export const CatalogTOC = ({ structure }) => {
  // Розбиваємо всі позиції на групи по 22 штуки, щоб вони точно влізли до футера
  const itemsPerPage = 22; 
  const allItems = [];
  
  structure.forEach(cat => {
    allItems.push({ type: 'cat', name: cat.catName });
    cat.subCategories.forEach(sub => {
      sub.products.forEach(p => {
        allItems.push({ type: 'prod', name: p.nameTxt, page: p.pageNo });
      });
    });
  });

  const chunks = [];
  for (let i = 0; i < allItems.length; i += itemsPerPage) {
    chunks.push(allItems.slice(i, i + itemsPerPage));
  }

  return (
    <>
      {chunks.map((chunk, index) => (
        <CatalogFrame key={index} pageNo="2" showFooter={true}>
          <h1 style={{ fontSize: '36pt', fontFamily: 'Playfair Display, serif', marginBottom: '10mm' }}>
            Зміст {chunks.length > 1 ? `(${index + 1})` : ''}
          </h1>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4mm' }}>
            {chunk.map((item, i) => (
              <div key={i} style={{ 
                display: 'flex', 
                alignItems: 'baseline', 
                paddingLeft: item.type === 'prod' ? '5mm' : '0' 
              }}>
                <span style={{ 
                  fontWeight: item.type === 'cat' ? '900' : 'normal',
                  color: item.type === 'cat' ? '#d32f2f' : '#333',
                  fontSize: item.type === 'cat' ? '12pt' : '10pt',
                  textTransform: item.type === 'cat' ? 'uppercase' : 'none'
                }}>
                  {item.name}
                </span>
                {item.type === 'prod' && (
                  <>
                    <div style={{ flex: 1, borderBottom: '1px dotted #ccc', margin: '0 8px' }}></div>
                    <span style={{ fontWeight: 'bold' }}>{item.page}</span>
                  </>
                )}
              </div>
            ))}
          </div>
        </CatalogFrame>
      ))}
    </>
  );
};