import React from 'react';

const PageHeader = ({ eyebrow, title, description, actions }) => (
  <header className={'page-heading' + (actions ? ' has-actions' : '')}>
    <div>
      <p className="eyebrow">{eyebrow}</p>
      <h1>{title}</h1>
      <p>{description}</p>
    </div>
    {actions && <div className="page-actions">{actions}</div>}
  </header>
);

export default PageHeader;
