/* ================================================================
   CodePreview.live — Menu System
   menu.js — Drawer, Pages, Accordion, Contact Form
================================================================= */

(function () {
  'use strict';

  /* ── DOM refs ── */
  const menuBtn     = document.getElementById('menuBtn');
  const backdrop    = document.getElementById('drawerBackdrop');
  const drawer      = document.getElementById('sideDrawer');
  const drawerClose = document.getElementById('drawerClose');

  /* ── Drawer state ── */
  let drawerOpen = false;

  function openDrawer() {
    drawerOpen = true;
    drawer.classList.add('is-open');
    backdrop.classList.add('is-visible');
    menuBtn.classList.add('is-open');
    menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    setTimeout(() => drawerClose && drawerClose.focus(), 60);
  }

  function closeDrawer() {
    drawerOpen = false;
    drawer.classList.remove('is-open');
    backdrop.classList.remove('is-visible');
    menuBtn.classList.remove('is-open');
    menuBtn.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
    menuBtn.focus();
  }

  if (menuBtn)     menuBtn.addEventListener('click', () => drawerOpen ? closeDrawer() : openDrawer());
  if (drawerClose) drawerClose.addEventListener('click', closeDrawer);
  if (backdrop)    backdrop.addEventListener('click', closeDrawer);

  /* ── ESC closes active page or drawer ── */
  document.addEventListener('keydown', e => {
    if (e.key !== 'Escape') return;
    const activePage = document.querySelector('.page-overlay.is-active');
    if (activePage) { closePage(activePage); return; }
    if (drawerOpen)   closeDrawer();
  });

  /* ── Focus trap inside drawer ── */
  document.addEventListener('keydown', e => {
    if (!drawerOpen || e.key !== 'Tab') return;
    const focusable = Array.from(drawer.querySelectorAll(
      'button:not([disabled]), [href], input:not([disabled]), [tabindex]:not([tabindex="-1"])'
    ));
    if (!focusable.length) return;
    const first = focusable[0];
    const last  = focusable[focusable.length - 1];
    if (e.shiftKey) {
      if (document.activeElement === first) { last.focus(); e.preventDefault(); }
    } else {
      if (document.activeElement === last) { first.focus(); e.preventDefault(); }
    }
  });

  /* ── Nav items → open page or handle Home ── */
  document.querySelectorAll('.drawer-nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      const pageId = item.dataset.page;

      // Home — close drawer, scroll to top
      if (!pageId) {
        closeDrawer();
        window.scrollTo({ top: 0, behavior: 'smooth' });
        return;
      }

      const page = document.getElementById(pageId);
      if (!page) { closeDrawer(); return; }

      closeDrawer();
      setTimeout(() => openPage(page), 80);
    });
  });

  /* ── Page system ── */
  function openPage(page) {
    document.querySelectorAll('.page-overlay.is-active').forEach(p => closePage(p));
    page.classList.add('is-active');
    document.body.style.overflow = 'hidden';
    page.scrollTop = 0;
    const backBtn = page.querySelector('.page-back-btn');
    setTimeout(() => backBtn && backBtn.focus(), 80);
  }

  function closePage(page) {
    page.classList.remove('is-active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.page-back-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const page = btn.closest('.page-overlay');
      if (page) closePage(page);
    });
  });

  /* ── FAQ Accordion ── */
  document.querySelectorAll('.faq-question').forEach(btn => {
    btn.addEventListener('click', () => {
      const item   = btn.closest('.faq-item');
      const isOpen = item.classList.contains('is-open');
      // Close all open items
      document.querySelectorAll('.faq-item.is-open').forEach(i => {
        i.classList.remove('is-open');
        i.querySelector('.faq-question').setAttribute('aria-expanded', 'false');
      });
      // Toggle the clicked one if it was closed
      if (!isOpen) {
        item.classList.add('is-open');
        btn.setAttribute('aria-expanded', 'true');
      }
    });
  });

  /* ── Contact form (client-side simulation) ── */
  const contactForm = document.getElementById('contactForm');
  if (contactForm) {
    contactForm.addEventListener('submit', e => {
      e.preventDefault();
      const submitBtn  = contactForm.querySelector('.form-submit');
      const origText   = submitBtn.textContent;
      submitBtn.textContent = 'Sending...';
      submitBtn.disabled    = true;

      setTimeout(() => {
        submitBtn.textContent    = 'Message Sent';
        submitBtn.style.background = 'linear-gradient(135deg, #55ef9a, #38d97a)';
        contactForm.reset();
        setTimeout(() => {
          submitBtn.textContent    = origText;
          submitBtn.style.background = '';
          submitBtn.disabled         = false;
        }, 2800);
      }, 900);
    });
  }

})();
