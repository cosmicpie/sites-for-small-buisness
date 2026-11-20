/* The menu is loaded once from data/menu.json. Edit that file to change names and prices. */
(function () {
  'use strict';
  var config = window.RESTAURANT_CONFIG || {};
  var byId = function (id) { return document.getElementById(id); };
  var safe = function (value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function (ch) { return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch]; }); };
  var money = function (value) { return '₹' + Number(value).toLocaleString('en-IN'); };
  var allBrandNodes = document.querySelectorAll('[data-brand]');
  allBrandNodes.forEach(function (el) { el.textContent = config.name || 'C3 Restaurant'; });
  document.querySelectorAll('[data-phone]').forEach(function (el) { el.textContent = config.phoneDisplay || ''; });
  document.querySelectorAll('[data-call]').forEach(function (el) { el.href = 'tel:' + (config.phoneLink || ''); });
  document.querySelectorAll('[data-address]').forEach(function (el) { el.textContent = config.address || ''; });
  document.querySelectorAll('[data-hours]').forEach(function (el) { el.textContent = config.hours || ''; });
  document.querySelectorAll('[data-whatsapp]').forEach(function (el) {
    el.href = 'https://wa.me/' + (config.whatsappNumber || '') + '?text=' + encodeURIComponent('Hello ' + (config.name || 'C3 Restaurant') + ', I would like to place an order.');
    el.target = '_blank'; el.rel = 'noopener';
  });
  document.querySelectorAll('[data-instagram]').forEach(function (el) {
    if (config.instagramUrl) {
      el.href = config.instagramUrl;
      el.target = '_blank';
      el.rel = 'noopener';
      el.hidden = false;
    } else {
      el.hidden = true;
    }
  });

  var navToggle = document.querySelector('.nav-toggle');
  if (navToggle) navToggle.addEventListener('click', function () {
    var nav = document.querySelector('.main-nav');
    var open = nav.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });

  var menuRoot = byId('menu-browser');
  if (!menuRoot) return;
  var data = null;
  var activeCategory = '';
  var searchTerm = '';
  var selectedOptions = Object.create(null);
  var cart = Object.create(null);
  var categoryList = byId('category-list');
  var searchInput = byId('menu-search');
  var dishList = byId('dish-list');
  var categoriesById = Object.create(null);

  function getItemKey(categoryId, itemIndex, optionKey) { return categoryId + ':' + itemIndex + ':' + (optionKey || 'default'); }
  function availableOptions(item) {
    if (Array.isArray(item.variants)) return item.variants.map(function (variant) { return { key: variant.key, label: variant.label, price: variant.price }; });
    var choices = [];
    if (item.half != null) choices.push({ key: 'half', label: 'Half', price: item.half, uncertain: Boolean(item.halfUnconfirmed) });
    if (item.full != null) choices.push({ key: 'full', label: 'Full', price: item.full });
    if (choices.length) return choices;
    return [{ key: 'default', label: '', price: item.price }];
  }
  function selectedOption(categoryId, itemIndex, item) {
    var choices = availableOptions(item);
    var key = selectedOptions[categoryId + ':' + itemIndex];
    return choices.find(function (choice) { return choice.key === key; }) || (Array.isArray(item.variants) ? choices[0] : choices[choices.length - 1]);
  }
  function renderCategories() {
    categoryList.innerHTML = data.categories.map(function (category) {
      var selected = category.id === activeCategory;
      return '<button type="button" class="category-button" data-category="' + safe(category.id) + '" aria-pressed="' + selected + '">' + safe(category.name) + '</button>';
    }).join('');
    categoryList.querySelectorAll('[data-category]').forEach(function (button) {
      button.addEventListener('click', function () {
        activeCategory = button.getAttribute('data-category');
        searchTerm = '';
        if (searchInput) searchInput.value = '';
        history.replaceState(null, '', '#category-' + activeCategory);
        renderCategories();
        renderItems();
      });
    });
  }
  function selectedItems() {
    var normalized = searchTerm.trim().toLocaleLowerCase();
    if (normalized) {
      return data.categories.reduce(function (all, category) {
        category.items.forEach(function (item, index) {
          if (item.name.toLocaleLowerCase().includes(normalized) || (item.description || '').toLocaleLowerCase().includes(normalized)) all.push({ category: category, item: item, index: index });
        });
        return all;
      }, []);
    }
    var category = categoriesById[activeCategory] || data.categories[0];
    return category.items.map(function (item, index) { return { category: category, item: item, index: index }; });
  }
  function renderItems() {
    var matches = selectedItems();
    var searching = Boolean(searchTerm.trim());
    var currentCategory = categoriesById[activeCategory] || data.categories[0];
    byId('category-title').textContent = searching ? 'Search results' : currentCategory.name;
    byId('section-kicker').textContent = searching ? 'DISHES THAT MATCH YOUR SEARCH' : 'FRESHLY MADE · 100% VEGETARIAN';
    byId('item-count').textContent = matches.length + (matches.length === 1 ? ' dish' : ' dishes');
    byId('no-results').hidden = matches.length > 0;
    dishList.hidden = matches.length === 0;
    dishList.innerHTML = matches.map(function (entry) {
      var item = entry.item;
      var options = availableOptions(item);
      var selected = selectedOption(entry.category.id, entry.index, item);
      var optionPicker = options.length > 1 ? '<div class="option-picker" role="group" aria-label="Choose size for ' + safe(item.name) + '">' + options.map(function (option) {
        var isSelected = option.key === selected.key;
        var label = option.label + (option.uncertain ? ' ?' : '');
        return '<button type="button" class="option-chip ' + (isSelected ? 'selected' : '') + '" data-option="' + safe(option.key) + '" data-cat="' + safe(entry.category.id) + '" data-index="' + entry.index + '" aria-pressed="' + isSelected + '" title="' + (option.uncertain ? 'Price unclear in supplied menu; confirm with restaurant' : '') + '">' + safe(label) + ' <span>' + money(option.price) + '</span></button>';
      }).join('') + '</div>' : '<span class="option-chip selected">' + safe(selected.label || 'Price') + ' <span>' + money(selected.price) + '</span></span>';
      var labels = (item.uncertainName ? '<span class="dish-label">Name unclear</span>' : '') + (item.halfUnconfirmed ? '<span class="dish-label">Half price to confirm</span>' : '');
      var categoryHint = searching ? '<span class="dish-label">' + safe(entry.category.name) + '</span>' : '';
      return '<article class="dish-card"><div class="dish-topline"><div class="dish-name">' + safe(item.name) + labels + categoryHint + '</div></div>' + (item.description ? '<p class="dish-description">' + safe(item.description) + '</p>' : '') + '<div class="dish-controls">' + optionPicker + '<button type="button" class="add-button" data-add="' + safe(entry.category.id) + '" data-index="' + entry.index + '" aria-label="Add ' + safe(item.name) + ' to order" title="Add to order">+</button></div></article>';
    }).join('');
    dishList.querySelectorAll('[data-option]').forEach(function (button) {
      button.addEventListener('click', function () {
        var key = button.getAttribute('data-cat') + ':' + button.getAttribute('data-index');
        selectedOptions[key] = button.getAttribute('data-option');
        renderItems();
      });
    });
    dishList.querySelectorAll('[data-add]').forEach(function (button) {
      button.addEventListener('click', function () { addToCart(button.getAttribute('data-add'), Number(button.getAttribute('data-index'))); });
    });
  }
  function addToCart(categoryId, itemIndex) {
    var category = categoriesById[categoryId];
    if (!category || !category.items[itemIndex]) return;
    var item = category.items[itemIndex];
    var option = selectedOption(categoryId, itemIndex, item);
    var key = getItemKey(categoryId, itemIndex, option.key);
    if (!cart[key]) cart[key] = { key: key, categoryId: categoryId, itemIndex: itemIndex, optionKey: option.key, name: item.name, optionLabel: option.label, price: Number(option.price), quantity: 0 };
    cart[key].quantity += 1;
    renderCart();
  }
  function changeQuantity(key, delta) {
    if (!cart[key]) return;
    cart[key].quantity += delta;
    if (cart[key].quantity <= 0) delete cart[key];
    renderCart();
  }
  function renderCart() {
    var items = Object.keys(cart).map(function (key) { return cart[key]; });
    var count = items.reduce(function (sum, item) { return sum + item.quantity; }, 0);
    var total = items.reduce(function (sum, item) { return sum + item.quantity * item.price; }, 0);
    byId('cart-count').textContent = String(count);
    byId('cart-total').textContent = money(total);
    if (!items.length) {
      byId('cart-items').innerHTML = '<p class="cart-empty">Add a dish to start your order.</p>';
      return;
    }
    byId('cart-items').innerHTML = items.map(function (item) {
      var size = item.optionLabel ? ' · ' + safe(item.optionLabel) : '';
      return '<div class="cart-line"><div class="cart-line-name">' + safe(item.name) + '<span class="cart-line-sub">' + size + ' · ' + money(item.price) + ' each</span></div><div class="quantity-control"><button type="button" data-qty="-1" data-key="' + safe(item.key) + '" aria-label="Remove one ' + safe(item.name) + '">−</button><span>' + item.quantity + '</span><button type="button" data-qty="1" data-key="' + safe(item.key) + '" aria-label="Add one ' + safe(item.name) + '">+</button></div></div>';
    }).join('');
    byId('cart-items').querySelectorAll('[data-qty]').forEach(function (button) {
      button.addEventListener('click', function () { changeQuantity(button.getAttribute('data-key'), Number(button.getAttribute('data-qty'))); });
    });
  }
  function updateCheckout() {
    var items = Object.keys(cart).map(function (key) { return cart[key]; });
    if (!items.length) {
      byId('checkout-link').href = 'https://wa.me/' + (config.whatsappNumber || '') + '?text=' + encodeURIComponent('Hello ' + (config.name || 'C3 Restaurant') + ', please share today’s menu.');
      return;
    }
    var total = items.reduce(function (sum, item) { return sum + item.quantity * item.price; }, 0);
    var lines = items.map(function (item) { return '- ' + item.name + (item.optionLabel ? ' (' + item.optionLabel + ')' : '') + ' × ' + item.quantity + ' = ' + money(item.quantity * item.price); });
    var message = 'Hello ' + (config.name || 'C3 Restaurant') + ', I would like to order:\n' + lines.join('\n') + '\nEstimated food total: ' + money(total) + '\nParcel charge (₹10 per parcel) is extra. Please confirm availability and delivery details.';
    byId('checkout-link').href = 'https://wa.me/' + (config.whatsappNumber || '') + '?text=' + encodeURIComponent(message);
  }
  var originalRenderCart = renderCart;
  renderCart = function () { originalRenderCart(); updateCheckout(); };
  function loadMenu() {
    fetch('data/menu.json', { cache: 'no-store' }).then(function (response) {
      if (!response.ok) throw new Error('Menu file returned ' + response.status);
      return response.json();
    }).then(function (menuData) {
      if (!menuData || !Array.isArray(menuData.categories) || !menuData.categories.length) throw new Error('Menu data is empty or invalid');
      data = menuData;
      data.categories.forEach(function (category) { categoriesById[category.id] = category; });
      var requested = decodeURIComponent(window.location.hash.replace(/^#category-/, ''));
      activeCategory = categoriesById[requested] ? requested : data.categories[0].id;
      byId('menu-loading').hidden = true;
      menuRoot.hidden = false;
      renderCategories();
      renderItems();
      renderCart();
    }).catch(function (error) {
      byId('menu-loading').hidden = true;
      var errorBox = byId('menu-error');
      errorBox.hidden = false;
      var localFile = window.location.protocol === 'file:';
      errorBox.textContent = localFile ? 'The menu needs to be opened through a local web server. Open a terminal in this folder and run: python3 -m http.server 8000 — then visit http://127.0.0.1:8000/menu.html' : 'Menu data could not be loaded. Check that data/menu.json is in this folder, then refresh. (' + error.message + ')';
    });
  }
  if (searchInput) {
    searchInput.addEventListener('input', function () { searchTerm = searchInput.value; renderCategories(); renderItems(); });
    document.addEventListener('keydown', function (event) {
      if (event.key === '/' && document.activeElement !== searchInput && !event.ctrlKey && !event.metaKey && !event.altKey) { event.preventDefault(); searchInput.focus(); }
      if (event.key === 'Escape' && document.activeElement === searchInput) { searchInput.value = ''; searchTerm = ''; renderItems(); searchInput.blur(); }
    });
  }
  loadMenu();
}());
