export default async function decorate(block) {
  try {
    const url = '/en/countries.json';

    const res = await fetch(url);
    const json = await res.json();

    console.log('JSON:', json);

    const rows = json.data || [];

    if (!rows.length) {
      block.innerHTML = '<p>No data available</p>';
      return;
    }

    const countries = buildHierarchy(rows);

    console.log('Processed countries:', countries);


    const countriesjob = getCountriesWithJobs(json);

    console.log(countriesjob);

    const countriesbrands = getCountriesWithBrands(json);

    console.log(countriesbrands);
    const countriesflags = getCountriesWithFlags(json);

    console.log(countriesflags);


    block.innerHTML = buildHTML(countriesflags);

  } catch (e) {
    console.error('ERROR:', e);
    block.innerHTML = '<p>Error loading data</p>';
  }
}

/**
 * Convert flat JSON to hierarchy
 */function buildHierarchy(rows) {
  const map = {};

  rows.forEach(row => {
    if (!row.Published) return;

    const country = row.Code;
    const countryName = row.Name;
    const brand = row.Brands;

    if (!map[country]) {
      map[country] = {
        country,
        countryName,
        sortOrder: Number(row.SortOrder) || 0,
        brands: new Set()
      };
    }

    if (brand) {
      map[country].brands.add(brand);
    }
  });

  return Object.values(map)
    .map(c => ({
      ...c,
      brands: [...c.brands]
    }))
    .sort((a, b) => a.sortOrder - b.sortOrder);
}
/**
 * Render HTML
 */function buildHTML(countries) {
  return countries.map(c => `
    <div class="country">
      <h2>${c.name}</h2>
      <img src="${c.flag}" alt="${c.name} flag" />
    </div>
  `).join('');
}

/**
 * Optional dynamic interaction
 */
function addEvents(block) {
  block.querySelectorAll('li').forEach(item => {
    item.addEventListener('click', (e) => {
      const { country, brand, category } = e.target.dataset;

      // You can simulate dynamic URL
      history.pushState({}, '', `/en/countries?country=${country}&brand=${brand}&category=${category}`);

      alert(`Selected: ${country} → ${brand} → ${category}`);
    });
  });
}

/* jobs avaialable countries*/

export function getCountriesWithJobs(json) {
  const rows = json.data || [];

  return rows
    .filter(row => Number(row.Jobs) === 1)   // ✅ keep jobs = 1
    .map(row => row.Name);                  // ✅ return only country name
}

/* brands available countries */
export function getCountriesWithBrands(json) {
  const rows = json.data || [];

  return rows
    .filter(row => Number(row.Brands)  === 1)   // ✅ keep Brands = 1
    .map(row => row.Name);                  // ✅ return only country name
}
/* flags available countries */
export function getCountriesWithFlags(json) {
  const rows = json.data || [];

  return rows
    .filter(row => row.Code && row.Name)  // ✅ basic validation
    .map(row => ({
      name: row.Name,
      code: row.Code.toLowerCase(),
      flag: `/icons/${row.Code.toLowerCase()}.svg`  // ✅ local SVG path
    }));
}


