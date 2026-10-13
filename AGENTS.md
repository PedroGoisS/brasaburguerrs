<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

- Keep seller product and store-settings editors in `src/components/admin`, using the existing store API so seller and customer views stay consistent.
- Use `src/components/Button.tsx` for new interactive commands to preserve the existing semantic button styles.
- Keep delivery pricing pure in `src/lib/delivery.ts` and Maps calls in `delivery.functions.ts`, protected by an encrypted temporary checkout cookie and existing CSRF middleware, so secrets never enter the browser.
- Delivery ranges are lower-inclusive and upper-exclusive except for the last upper boundary; compare full driving distances before rounding currency to avoid ambiguous boundary charges.
- Keep delivery settings on the existing store API; it remains browser-local demo persistence until seller authentication and shared store persistence are explicitly migrated.
- Keep editable categories and scoped extras in the existing store, normalizing older saved state, so existing demo catalogs survive upgrades.
- Identify cart lines by product plus extra quantities and snapshot extras in orders; customized variants must not merge or lose fulfillment details.
- Calculate storefront status from Brasília-time weekly/special hours, ignoring legacy manual overrides, so the indicator follows the registered schedule.
- Reject outdated Vite optimized-dependency requests and pre-optimize the product dialog; mixing optimizer generations can load different React dispatchers and blank the preview.
