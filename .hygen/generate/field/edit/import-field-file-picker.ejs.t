---
inject: true
to: src/app/admin/<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>/edit/[id]/page-content.tsx
at_line: 2
skip_if: import FormImagePicker from
---

<% if (kind === 'reference' || kind === 'denormalized') { -%>
  <% if (referenceType === 'toOne') { -%>
    <% if (type === 'File') { -%>
      import FormImagePicker from "@/components/form/image-picker/image-picker";
    <% } -%>
  <% } -%>  
<% } -%>