---
to: src/services/i18n/locales/en/admin-<%= h.inflection.transform(name, ['pluralize', 'underscore', 'dasherize']) %>.json
inject: true
before: <system>
---
    "<%= property %>": "<%= h.inflection.humanize(property) %>",