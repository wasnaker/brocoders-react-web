---
inject: true
to: src/app/admin/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/page-content.tsx
before: \<index\-component\-head\-field \/\>
---
<% if (isShowInTable) { -%>
  <TableHead>{t("table.<%= property %>")}</TableHead>
<% } -%>