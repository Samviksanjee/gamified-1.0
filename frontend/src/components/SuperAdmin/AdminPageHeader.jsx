/** Page title row for the Super Admin console. Same props as the shared PageHeader (eyebrow is ignored). */
export default function AdminPageHeader({ title, subtitle, action }) {
  return (
    <div className="sa-page-header">
      <div>
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      {action && <div className="sa-page-header-action">{action}</div>}
    </div>
  );
}
