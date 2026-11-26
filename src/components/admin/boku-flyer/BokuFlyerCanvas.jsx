import React, { forwardRef } from 'react';
import { FLYER, priceLabel } from './flyerModel';
import './bokuFlyer.css';
function DishPhoto({ product, images }) {
  return images[product.photo] ? <img crossOrigin="anonymous" src={images[product.photo]} alt={product.flyerName} className="boku-flyer-photo" /> : <div className="boku-flyer-photo boku-flyer-photo-pending">Foto pendiente</div>;
}
function DishPrice({ product, featured }) {
  const price = featured ? FLYER.dailyPrice : product.currentPrice;
  return <div className="boku-flyer-price">{product.basePrice > price && <del>{priceLabel(product.basePrice)}</del>}<strong>{priceLabel(price)}</strong></div>;
}
function Gallery({ products, images, names, columns, rows, extra = false }) {
  return <div className={`boku-flyer-gallery ${extra ? 'is-extra' : ''}`} style={{ gridTemplateColumns: `repeat(${columns},minmax(0,1fr))`, gridTemplateRows: `repeat(${rows},minmax(0,1fr))` }}>
    {products.map(product => <article key={product.id} data-check-fit className="boku-flyer-tile">
      <DishPhoto product={product} images={images} /><div className="boku-flyer-tile-copy"><h3 data-check-fit>{names[product.id] ?? product.flyerName}</h3><DishPrice product={product} /></div>
    </article>)}
  </div>;
}
const BokuFlyerCanvas = forwardRef(function BokuFlyerCanvas({ daily, others, extras, images, showDescriptions, descriptions, names, logoUrl, layout, theme, copy, showIncludes, showFooter, showStartingPrice, startingPrice }, ref) {
  return <div ref={ref} className="boku-flyer-canvas" data-testid="boku-flyer-canvas" style={{ width: FLYER.width, height: FLYER.height, '--boku-primary': theme?.primary || '#bc0e0e', '--boku-background': theme?.background || '#f6f7f5', '--featured-height': `${layout.featuredHeight}px` }}>
    <header className="boku-flyer-header">{images[logoUrl] && <img src={images[logoUrl]} crossOrigin="anonymous" className="boku-flyer-logo" alt="Boku Bento" />}<strong>Boku Bento</strong><h1 data-check-fit>{copy.title}</h1></header>
    <section className="boku-flyer-daily"><div className="boku-flyer-section-heading"><h2 data-check-fit>{copy.dailyTitle}</h2><strong>{priceLabel(FLYER.dailyPrice)}</strong></div>
      {showIncludes && <p className="boku-flyer-includes" data-check-fit>{copy.includes}</p>}
      <div className="boku-flyer-featured-grid">{daily.map(product => <article key={product.id} data-check-fit className="boku-flyer-featured"><DishPhoto product={product} images={images} /><div className="boku-flyer-featured-copy"><h3 data-check-fit>{names[product.id] ?? product.flyerName}</h3>{showDescriptions && <p data-check-fit className="boku-flyer-description">{descriptions[product.id] ?? product.shortDescription}</p>}<DishPrice product={product} featured /></div></article>)}</div>
    </section>
    {others.length > 0 && <section className="boku-flyer-menu"><div className="boku-flyer-section-heading"><h2 data-check-fit>{copy.menuTitle}</h2></div><Gallery products={others} images={images} names={names} columns={layout.columns} rows={layout.rows} /></section>}
    {extras.length > 0 && <section className="boku-flyer-extras" style={{ height: layout.extrasHeight }}><div className="boku-flyer-section-heading"><h2 data-check-fit>{copy.extrasTitle}</h2>{showStartingPrice && startingPrice && <strong>Desde {priceLabel(startingPrice)}</strong>}</div><Gallery products={extras} images={images} names={names} columns={layout.extraColumns} rows={layout.extraRows} extra /></section>}
    {showFooter && <footer className="boku-flyer-footer" data-check-fit>{copy.footer}</footer>}
  </div>;
});
export default BokuFlyerCanvas;
