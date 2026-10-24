import type { ReactNode } from "react";
export function PageHeading({
  eyebrow,
  title,
  description,
  actions,
  embedded = false,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  embedded?: boolean;
}) {
  return (
    <div className={`page-heading${embedded ? " page-heading--embedded" : ""}`}>
      <div className="page-heading__copy">
        {eyebrow && <p className="eyebrow">{eyebrow}</p>}
        <h1>{title}</h1>
        {description && (
          <p className="page-heading__description">{description}</p>
        )}
      </div>
      {actions && <div className="page-heading__actions">{actions}</div>}
    </div>
  );
}
