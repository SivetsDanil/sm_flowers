(() => {
  const reorderStudioContact = () => {
    const routeLinks = Array.from(document.querySelectorAll('.sm-studio-route-link'));
    routeLinks.forEach(link => {
      const parent = link.parentElement;
      if (!parent) return;

      // Keep the address first, move the existing route link before the working-hours block.
      const children = Array.from(parent.children);
      const hours = children.find(el => {
        if (el === link) return false;
        const text = (el.textContent || '').replace(/\s+/g, ' ').trim().toLowerCase();
        return text.includes('круглосуточ') || text.includes('график работы') || text.includes('часы работы') || text.includes('работаем');
      });

      if (hours && link.nextElementSibling !== hours) parent.insertBefore(link, hours);
    });
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', reorderStudioContact, { once: true });
  } else {
    reorderStudioContact();
  }

  window.addEventListener('load', reorderStudioContact, { once: true });
})();
