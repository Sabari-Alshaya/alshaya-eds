import { getMetadata } from '../../scripts/aem.js';
import { loadFragment } from '../fragment/fragment.js';

// media query match that indicates mobile/tablet width
const isDesktop = window.matchMedia('(min-width: 900px)');

function closeOnEscape(e) {
  if (e.code === 'Escape') {
    const nav = document.getElementById('nav');
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections);
      navSectionExpanded.focus();
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections);
      nav.querySelector('button').focus();
    }
  }
}

function closeOnFocusLost(e) {
  const nav = e.currentTarget;
  if (!nav.contains(e.relatedTarget)) {
    const navSections = nav.querySelector('.nav-sections');
    if (!navSections) return;
    const navSectionExpanded = navSections.querySelector('[aria-expanded="true"]');
    if (navSectionExpanded && isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleAllNavSections(navSections, false);
    } else if (!isDesktop.matches) {
      // eslint-disable-next-line no-use-before-define
      toggleMenu(nav, navSections, false);
    }
  }
}

function openOnKeydown(e) {
  const focused = document.activeElement;
  const isNavDrop = focused.className === 'nav-drop';
  if (isNavDrop && (e.code === 'Enter' || e.code === 'Space')) {
    const dropExpanded = focused.getAttribute('aria-expanded') === 'true';
    // eslint-disable-next-line no-use-before-define
    toggleAllNavSections(focused.closest('.nav-sections'));
    focused.setAttribute('aria-expanded', dropExpanded ? 'false' : 'true');
  }
}

function focusNavSection() {
  document.activeElement.addEventListener('keydown', openOnKeydown);
}

/**
 * Toggles all nav sections
 * @param {Element} sections The container element
 * @param {Boolean} expanded Whether the element should be expanded or collapsed
 */
function toggleAllNavSections(sections, expanded = false) {
  if (!sections) return;
  sections.querySelectorAll('.nav-sections .default-content-wrapper > ul > li').forEach((section) => {
    section.setAttribute('aria-expanded', expanded);
  });
}

/**
 * Toggles the entire nav
 * @param {Element} nav The container element
 * @param {Element} navSections The nav sections within the container element
 * @param {*} forceExpanded Optional param to force nav expand behavior when not null
 */
function toggleMenu(nav, navSections, forceExpanded = null) {
  const expanded = forceExpanded !== null ? !forceExpanded : nav.getAttribute('aria-expanded') === 'true';
  const button = nav.querySelector('.nav-hamburger button');
  document.body.style.overflowY = (expanded || isDesktop.matches) ? '' : 'hidden';
  nav.setAttribute('aria-expanded', expanded ? 'false' : 'true');
  toggleAllNavSections(navSections, expanded || isDesktop.matches ? 'false' : 'true');
  button.setAttribute('aria-label', expanded ? 'Open navigation' : 'Close navigation');
  // enable nav dropdown keyboard accessibility
  if (navSections) {
    const navDrops = navSections.querySelectorAll('.nav-drop');
    if (isDesktop.matches) {
      navDrops.forEach((drop) => {
        if (!drop.hasAttribute('tabindex')) {
          drop.setAttribute('tabindex', 0);
          drop.addEventListener('focus', focusNavSection);
        }
      });
    } else {
      navDrops.forEach((drop) => {
        drop.removeAttribute('tabindex');
        drop.removeEventListener('focus', focusNavSection);
      });
    }
  }

  // enable menu collapse on escape keypress
  if (!expanded || isDesktop.matches) {
    // collapse menu on escape press
    window.addEventListener('keydown', closeOnEscape);
    // collapse menu on focus lost
    nav.addEventListener('focusout', closeOnFocusLost);
  } else {
    window.removeEventListener('keydown', closeOnEscape);
    nav.removeEventListener('focusout', closeOnFocusLost);
  }
}

function getCountryNames(row) {
  const en = row.Name || row.name || row.Country || '';
  const ar = row.NameAr || row.Name_AR || row.ArabicName || row['Name (AR)'] || row.Arabic || row.ar || en;
  return { en, ar };
}

function createCountrySelector(countries, lang) {
  if (!countries.length) return null;

  const selected = countries[0];
  const label = lang === 'ar'
    ? `${selected.ar} / ${selected.en}`
    : `${selected.en} / ${selected.ar}`;

  const container = document.createElement('div');
  container.className = 'nav-country-selector';
  container.innerHTML = `
    <button type="button" class="nav-country-trigger" aria-haspopup="listbox" aria-expanded="false">
      <span class="nav-country-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" aria-hidden="true" role="img"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 2c1.52 0 2.94.56 4.03 1.5L12 9.53 7.97 5.5A7.963 7.963 0 0 1 12 4zm-6 8a6.01 6.01 0 0 0 1.5 4.03L11.53 12 6 6.47A5.96 5.96 0 0 0 6 12zm6 6c-1.52 0-2.94-.56-4.03-1.5L12 14.47l4.03 4.03A7.963 7.963 0 0 1 12 18zm6-6a5.96 5.96 0 0 0-.5-2.53L12 11.53 17.03 14.5A6.01 6.01 0 0 0 18 12z" fill="currentColor"/></svg>
      </span>
      <span class="nav-country-caret" aria-hidden="true"></span>
    </button>
    <ul class="nav-country-menu" role="listbox" tabindex="-1">
      ${countries.map(({ code, en, ar, flag }) => {
        const optionLabel = lang === 'ar' ? `${ar} / ${en}` : `${en} / ${ar}`;
        return `
          <li class="nav-country-option" role="option" data-code="${code}" data-en="${en}" data-ar="${ar}" data-flag="${flag}">
            <div class="nav-country-left">
              <img src="${flag}" alt="${en} flag" />
              <span class="nav-country-name">${en}</span>
            </div>
            <div class="nav-country-right">
              <a class="nav-country-lang" href="/${lang}/${code}">English</a>
              <a class="nav-country-lang" href="/${lang === 'ar' ? 'ar' : 'en'}/${code}">عربي</a>
            </div>
          </li>`;
      }).join('')}
    </ul>
  `;

  const button = container.querySelector('.nav-country-trigger');
  const menu = container.querySelector('.nav-country-menu');
  const flagImage = container.querySelector('.nav-country-flag');
  const labelText = container.querySelector('.nav-country-label');

  const closeMenu = () => {
    button.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');
  };

  const openMenu = () => {
    button.setAttribute('aria-expanded', 'true');
    menu.classList.add('open');
    menu.focus();
  };

  button.addEventListener('click', () => {
    if (button.getAttribute('aria-expanded') === 'true') {
      closeMenu();
    } else {
      openMenu();
    }
  });

  container.addEventListener('keydown', (event) => {
    if (event.code === 'Escape') closeMenu();
  });

  menu.addEventListener('click', (event) => {
    // stop anchors from navigating when selecting an option
    const option = event.target.closest('.nav-country-option');
    if (!option) return;
    event.preventDefault();

    const en = option.dataset.en;
    const ar = option.dataset.ar;
    const flag = option.dataset.flag;
    const selectedLabel = lang === 'ar' ? `${ar} / ${en}` : `${en} / ${ar}`;

    flagImage.src = flag;
    flagImage.alt = `${en} flag`;
    labelText.textContent = selectedLabel;
    button.setAttribute('aria-expanded', 'false');
    menu.classList.remove('open');

    // Update right-links text (desktop and mobile variants)
    const rightWrapper = document.querySelector('.right-links .default-content-wrapper');
    if (rightWrapper) {
      const desktopLast = rightWrapper.querySelector('p.desktop-only:last-child');
      const mobileLast = rightWrapper.querySelector('p.mobile-only:last-child');
      const replaceText = lang === 'ar' ? ar : en;
      if (desktopLast) desktopLast.textContent = replaceText;
      if (mobileLast) mobileLast.textContent = replaceText;
    }
  });

  document.addEventListener('click', (event) => {
    if (!container.contains(event.target)) {
      closeMenu();
    }
  });

  return container;
}

async function addCountrySelector(nav) {
  if (!nav) return;

  const lang = document.documentElement.lang?.toLowerCase().startsWith('ar') ? 'ar' : 'en';
  const url = `/${lang}/countries.json`;

  try {
    let response = await fetch(url);
    if (!response.ok && lang === 'ar') {
      response = await fetch('/en/countries.json');
    }
    if (!response.ok) throw new Error('Country list not found');
    const json = await response.json();
    const rows = json.data || [];
    const countries = rows
      .filter((row) => row.Code && row.Name && row.Website==1) // basic validation
      .map((row) => {
        const { en, ar } = getCountryNames(row);
        return {
          code: row.Code.toLowerCase(),
          flag: `/icons/${row.Code.toLowerCase()}.svg`,
          en,
          ar,
        };
      })
      .filter((country) => country.en)
      .sort((a, b) => a.en.localeCompare(b.en));

    // If countries list is empty (local dev), provide a small fallback so dropdown is visible
    const fallback = [
      { code: 'sa', en: 'Saudi Arabia', ar: 'المملكة العربية السعودية', flag: '/icons/sa.svg' },
      { code: 'ae', en: 'United Arab Emirates', ar: 'الإمارات العربية المتحدة', flag: '/icons/ae.svg' },
      { code: 'kw', en: 'Kuwait', ar: 'الكويت', flag: '/icons/kw.svg' },
      { code: 'qa', en: 'Qatar', ar: 'قطر', flag: '/icons/qa.svg' },
      { code: 'bh', en: 'Bahrain', ar: 'البحرين', flag: '/icons/bh.svg' },
      { code: 'eg', en: 'Egypt', ar: 'مصر', flag: '/icons/eg.svg' },
    ];

    const finalCountries = countries.length ? countries : fallback;

    const selector = createCountrySelector(finalCountries, lang);
    if (!selector) return;

    const navBrand = nav.querySelector('.nav-brand');
    // Prefer placing after the second anchor inside .right-links if available
    const rightLinks = nav.querySelector('.right-links') || document.querySelector('.right-links');
    const secondAnchor = rightLinks?.querySelectorAll('.default-content-wrapper p')?.[1];
    if (secondAnchor && secondAnchor.parentNode) {
      secondAnchor.insertAdjacentElement('afterend', selector);
    } else if (navBrand) {
      navBrand.append(selector);
    } else {
      const navTools = nav.querySelector('.nav-tools');
      if (navTools) navTools.prepend(selector);
    }
  } catch (error) {
    // silent fail if countries JSON is unavailable
    // eslint-disable-next-line no-console
    console.warn('Country selector not loaded:', error);
  }
}

/**
 * loads and decorates the header, mainly the nav
 * @param {Element} block The header block element
 */
export default async function decorate(block) {
  // load nav as fragment
  const navMeta = getMetadata('nav');
  const navPath = navMeta ? new URL(navMeta, window.location).pathname : '/en/nav';
  const fragment = await loadFragment(navPath);

  // decorate nav DOM
  block.textContent = '';
  const nav = document.createElement('nav');
  nav.id = 'nav';
  while (fragment.firstElementChild) nav.append(fragment.firstElementChild);

  const classes = ['brand', 'sections', 'tools'];
  classes.forEach((c, i) => {
    const section = nav.children[i];
    if (section) section.classList.add(`nav-${c}`);
  });

  const navBrand = nav.querySelector('.nav-brand');
  const brandLink = navBrand.querySelector('.button');
  if (brandLink) {
    brandLink.className = '';
    brandLink.closest('.button-container').className = '';
  }

  const navSections = nav.querySelector('.nav-sections');
  if (navSections) {
    navSections.querySelectorAll(':scope .default-content-wrapper > ul > li').forEach((navSection) => {
      if (navSection.querySelector('ul')) navSection.classList.add('nav-drop');
      navSection.addEventListener('click', () => {
        if (isDesktop.matches) {
          const expanded = navSection.getAttribute('aria-expanded') === 'true';
          toggleAllNavSections(navSections);
          navSection.setAttribute('aria-expanded', expanded ? 'false' : 'true');
        }
      });
    });
  }

  // hamburger for mobile
  const hamburger = document.createElement('div');
  hamburger.classList.add('nav-hamburger');
  hamburger.innerHTML = `<button type="button" aria-controls="nav" aria-label="Open navigation">
      <span class="nav-hamburger-icon"></span>
    </button>`;
  hamburger.addEventListener('click', () => toggleMenu(nav, navSections));
  nav.prepend(hamburger);
  nav.setAttribute('aria-expanded', 'false');
  // prevent mobile nav behavior on window resize
  toggleMenu(nav, navSections, isDesktop.matches);
  isDesktop.addEventListener('change', () => toggleMenu(nav, navSections, isDesktop.matches));

  await addCountrySelector(nav);

  const navWrapper = document.createElement('div');
  navWrapper.className = 'nav-wrapper';
  navWrapper.append(nav);
  block.append(navWrapper);

  document.addEventListener('click', (event) => {
    const trigger = event.target.closest('.nav-country-trigger');
    if (!trigger) return;
    const container = trigger.closest('.nav-country-selector');
    const menu = container?.querySelector('.nav-country-menu');
    if (!menu) return;

    event.preventDefault();
    event.stopPropagation();

    const expanded = trigger.getAttribute('aria-expanded') === 'true';
    if (expanded) {
      trigger.setAttribute('aria-expanded', 'false');
      menu.classList.remove('open');
      menu.style.display = 'none';
      menu.style.opacity = '0';
    } else {
      trigger.setAttribute('aria-expanded', 'true');
      menu.classList.add('open');
      menu.style.display = 'block';
      menu.style.opacity = '1';
      menu.focus();
    }
  });
const observer = new MutationObserver(() => {
  const nav = document.querySelector('#nav');
  const navWrapper = document.querySelector('.nav-wrapper');
  const main = document.querySelector('main');

  if (!nav || !navWrapper || !main) return;

  let updated = false;

  // ✅ 1. Move right-links BEFORE nav
  const rightLinks = nav.querySelector('.right-links');
  if (rightLinks && nav.parentNode) {
    nav.parentNode.insertBefore(rightLinks, nav);
    updated = true;
  }

  // ✅ 2. Add desktop/mobile classes
  const wrapper = rightLinks?.querySelector('.default-content-wrapper');
  const paragraphs = wrapper?.querySelectorAll('p') || [];

  if (paragraphs.length >= 2) {
    paragraphs[0].classList.add('desktop-only');
    paragraphs[1].classList.add('mobile-only');
    updated = true;
  }

  // ✅ 3. Move sticky-social-media to main
  const sticky = document.querySelector('.sticky-social-media');
  if (sticky && !main.contains(sticky)) {
    main.appendChild(sticky);
    updated = true;
  }

  // ✅ 4. Replace right-links div → nav (ONLY if still div)
  if (rightLinks && rightLinks.tagName === 'DIV') {
    const newNav = document.createElement('nav');

    // copy attributes
    [...rightLinks.attributes].forEach(attr => {
      newNav.setAttribute(attr.name, attr.value);
    });

    newNav.innerHTML = rightLinks.innerHTML;

    rightLinks.replaceWith(newNav);
    updated = true;
  }

  const header = document.querySelector(".nav-wrapper");
  const hasVideo = document.querySelector(".alshaya-video");

  if (!header || !hasVideo) return;

  // ✅ Add transition (animation)
  header.style.transition = "background 0.9s ease";

  // ✅ On load (top of page)
  if (window.scrollY === 0) {
    header.style.background = "transparent";
  }

  window.addEventListener("scroll", function () {
    if (window.scrollY > 0) {
      // ✅ On scroll → white
      header.style.background = "#ffffff";
    } else {
      // ✅ Back to top → transparent
      header.style.background = "transparent";
    }
  });

  // ✅ Stop observer after successful update
  if (updated) observer.disconnect();
});

observer.observe(document.body, { childList: true, subtree: true });
}
