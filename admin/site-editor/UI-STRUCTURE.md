# Block editor UI

Implement the site editor as a separate tab from Orders. Orders must remain untouched.

Each site block is an independent accordion/card. Opening one block reveals only its own content.

1. Главная
   - Фотография: preview, upload/replace, hide, delete
   - Тексты: labeled fields with human-readable names, edit/save/hide/delete
2. О студии
   - Тексты only
3. Коллекции
   - Фотографии: each collection with preview and replace
   - Тексты: collection section title/subtitle/captions
4. Букеты
   - Existing product management remains the source for bouquet photo/name/description/price/visibility.
5. Жизнь студии
   - Фотографии: all studio-life slots, each replace/hide/delete
   - Тексты: section title, Instagram handle/link, and «Каждый букет существует в единственном экземпляре»
   - Do not render «Авторский букет» or «Розовое облако»
6. Студия / Контакты
   - Адрес
   - Карта URL
   - Map link label
   - Время работы
   - Телефон/social links

Responsive UI: one-column layout on mobile, two-column where appropriate on desktop. Save operations are independent per item.

Security: reuse the existing admin auth/is_admin guard. Do not modify orders queries, order tables, or order rendering while introducing this UI.