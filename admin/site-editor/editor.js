/* SM Flowers block editor module
 * Isolated from the Orders UI. This module only renders site-content controls.
 * Integration point: existing admin can load this module without replacing order logic.
 */
(() => {
  'use strict';

  const BLOCKS = [
    { id: 'home', title: 'Главная', photo: true },
    { id: 'studio', title: 'О студии', photo: false },
    { id: 'collections', title: 'Коллекции', photo: true },
    { id: 'bouquets', title: 'Букеты', photo: true },
    { id: 'life', title: 'Жизнь студии', photo: true },
    { id: 'contacts', title: 'Студия / Контакты', photo: false },
  ];

  function createEditor(root) {
    if (!root || root.dataset.smSiteEditorReady === '1') return;
    root.dataset.smSiteEditorReady = '1';

    const fragment = document.createDocumentFragment();
    for (const block of BLOCKS) {
      const card = document.createElement('section');
      card.className = 'sm-site-block';
      card.dataset.block = block.id;
      card.innerHTML = `
        <button class="sm-site-block__header" type="button" aria-expanded="false">
          <span>${block.title}</span><span aria-hidden="true">⌄</span>
        </button>
        <div class="sm-site-block__body" hidden>
          ${block.photo ? '<div class="sm-site-block__photos"><h3>Фотографии</h3><div class="sm-site-photo-slot">Управление фотографиями этого блока</div></div>' : ''}
          <div class="sm-site-block__texts"><h3>Тексты</h3><div class="sm-site-text-slot">Редактирование текстов этого блока</div></div>
        </div>`;
      const header = card.querySelector('.sm-site-block__header');
      const body = card.querySelector('.sm-site-block__body');
      header.addEventListener('click', () => {
        const open = header.getAttribute('aria-expanded') === 'true';
        header.setAttribute('aria-expanded', String(!open));
        body.hidden = open;
      });
      fragment.appendChild(card);
    }
    root.appendChild(fragment);
  }

  window.SMFlowersSiteEditor = { createEditor, BLOCKS };
})();
