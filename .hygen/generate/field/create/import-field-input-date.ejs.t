---
inject: true
to: src/app/admin/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/create/page-content.tsx
at_line: 2
skip_if: import FormDateTimePickerInput from
---

<% if (kind === 'primitive') { -%>
  <% if (type === 'Date') { -%>
    import FormDateTimePickerInput from "@/components/form/date-pickers/date-time-picker";
  <% } -%>
<% } -%>
