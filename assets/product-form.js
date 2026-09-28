const money = (cents) => `$${(cents / 100).toFixed(2)}`;

class VariantSelects extends HTMLElement {
  product = { id: 0, title: '', variants: [] };
  currentVariant = null;

  connectedCallback() {
    const productJson = document.getElementById('ProductJSON');

    if (!productJson) return;

    this.product = JSON.parse(productJson.textContent || '{}');

    this.addEventListener('change', this.onVariantChange);

    const initialVariant = this.product.variants.find(
      (variant) => variant.id === Number(this.dataset.initialVariantId)
    );

    this.setCurrentVariant(initialVariant);
  }

  disconnectedCallback() {
    this.removeEventListener('change', this.onVariantChange);
  }

  getSelectedOptions() {
    return [...this.querySelectorAll('input[type="radio"]:checked')].map(
      (input) => input.value
    );
  }

  findVariant(options) {
    return this.product.variants.find((variant) =>
      variant.options.every((option, index) => option === options[index])
    );
  }

  onVariantChange = () => {
    this.setCurrentVariant(this.findVariant(this.getSelectedOptions()));
  };

  setCurrentVariant(variant) {
    this.currentVariant = variant ?? null;
    this.render();
  }

  render() {
    this.renderOptionLabels();

    if (!this.currentVariant) {
      this.renderUnavailable();
      return;
    }

    const variant = this.currentVariant;

    this.renderPrice(variant);
    this.renderComparePrice(variant);
    this.renderMedia(variant);
    this.renderSku(variant);
    this.renderAvailability(variant);
    this.syncVariantInputs(variant);
    this.updateUrl(variant);
  }

  renderOptionLabels() {
    this.querySelectorAll('fieldset').forEach((fieldset) => {
      const selectedInput = fieldset.querySelector('input:checked');
      const selectedValue = fieldset.querySelector('[data-selected-value]');

      if (selectedValue) {
        selectedValue.textContent = selectedInput?.value ?? '';
      }
    });
  }

  renderPrice(variant) {
    const price = document.getElementById('Price');

    if (price) {
      price.textContent = money(variant.price);
    }
  }

  renderComparePrice(variant) {
    const comparePrice = document.getElementById('ComparePrice');
    const saleBadge = document.getElementById('SaleBadge');

    if (!comparePrice || !saleBadge) return;

    const onSale =
      variant.compare_at_price !== null &&
      variant.compare_at_price > variant.price;

    comparePrice.hidden = !onSale;
    saleBadge.hidden = !onSale;

    if (onSale) {
      comparePrice.textContent = money(variant.compare_at_price);
    }
  }

  renderMedia(variant) {
    const media = document.getElementById('ProductMedia');
    const caption = document.getElementById('MediaCaption');

    if (media && variant.featured_image) {
      media.src = variant.featured_image.src;
    }

    if (caption) {
      caption.textContent = `${this.product.title} — ${variant.option1}`;
    }
  }

  renderSku(variant) {
    const sku = document.getElementById('Sku');

    if (sku) {
      sku.textContent = variant.sku || '—';
    }
  }

  renderAvailability(variant) {
    const availability = document.getElementById('Availability');

    if (availability) {
      availability.textContent = variant.available
        ? 'In stock'
        : 'Sold out';

      availability.dataset.state = variant.available ? 'in' : 'out';
    }

    this.querySelectorAll('[data-atc]').forEach((button) => {
      button.disabled = !variant.available;
      button.textContent = variant.available
        ? 'Add to cart'
        : 'Sold out';
    });
  }

  syncVariantInputs(variant) {
    const inputs = document.querySelectorAll(
      `input[name="id"][data-product-id="${this.product.id}"]`
    );

    inputs.forEach((input) => {
      input.value = String(variant.id);
    });
  }

  updateUrl(variant) {
    const url = new URL(window.location.href);

    url.searchParams.set('variant', String(variant.id));

    window.history.replaceState({}, '', url);
  }

  renderUnavailable() {
    const price = document.getElementById('Price');
    const comparePrice = document.getElementById('ComparePrice');
    const saleBadge = document.getElementById('SaleBadge');
    const sku = document.getElementById('Sku');
    const availability = document.getElementById('Availability');

    if (price) price.textContent = '—';
    if (comparePrice) comparePrice.hidden = true;
    if (saleBadge) saleBadge.hidden = true;
    if (sku) sku.textContent = '—';

    if (availability) {
      availability.textContent = 'Unavailable';
      availability.dataset.state = 'out';
    }

    this.querySelectorAll('[data-atc]').forEach((button) => {
      button.disabled = true;
      button.textContent = 'Unavailable';
    });
  }
}

if (!customElements.get('variant-selects')) {
  customElements.define('variant-selects', VariantSelects);
}