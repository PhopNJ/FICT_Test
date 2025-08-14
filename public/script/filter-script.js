document.addEventListener('DOMContentLoaded', function () {
    // Dropdown handling (unchanged)
    document.querySelectorAll('.custom-dropdown').forEach(dropdown => {
        const selected = dropdown.querySelector('.dropdown-selected');
        const options = dropdown.querySelector('.dropdown-options');
        const hiddenInput = dropdown.querySelector('input[type="hidden"]');

        selected.addEventListener('click', e => {
            e.stopPropagation();
            document.querySelectorAll('.custom-dropdown.open').forEach(d => {
                if (d !== dropdown) d.classList.remove('open');
            });
            dropdown.classList.toggle('open');
        });

        options.querySelectorAll('.dropdown-option').forEach(option => {
            option.addEventListener('click', function () {
                selected.textContent = this.textContent;
                hiddenInput.value = this.getAttribute('data-value');
                dropdown.classList.remove('open');
                filterData();
                updateFilterCount();
            });
        });

        document.addEventListener('click', e => {
            if (!dropdown.contains(e.target)) {
                dropdown.classList.remove('open');
            }
        });
    });

    // Filter count display
    function updateFilterCount() {
        let count = 0;
        ['search','taxRangeMin','taxRangeMax','valueRangeMin','valueRangeMax','landType','districtDropdown','sortByDropdown']
            .forEach(id => {
                const el = document.getElementById(id);
                if (el && el.value.trim()) count++;
            });
        const badge = document.getElementById('active-filter-count');
        if (badge) badge.textContent = count > 0 ? `ใช้ตัวกรอง ${count} รายการ` : 'ไม่มีตัวกรองที่ใช้งาน';
    }

    // Attach input/change events
    ['search','taxRangeMin','taxRangeMax','valueRangeMin','valueRangeMax','landType','districtDropdown','sortByDropdown']
        .forEach(id => {
            const el = document.getElementById(id);
            if (!el) return;
            const eventType = el.tagName === 'INPUT' ? 'input' : 'change';
            el.addEventListener(eventType, () => {
                updateFilterCount();
                filterData();
            });
        });

    // Clear filters
    const clearBtn = document.getElementById('clearBtn');
    if (clearBtn) {
        clearBtn.addEventListener('click', () => {
            ['search','taxRangeMin','taxRangeMax','valueRangeMin','valueRangeMax'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.value = '';
            });
            [{id:'landType',defaultText:'เลือกประเภทที่ดิน'},
             {id:'districtDropdown',defaultText:'เลือกเขต'},
             {id:'sortByDropdown',defaultText:'เลือกการเรียงลำดับ'}].forEach(({id,defaultText}) => {
                const input = document.getElementById(id);
                if (input) input.value = '';
                const dropdown = input?.closest('.custom-dropdown');
                if (dropdown) {
                    const sel = dropdown.querySelector('.dropdown-selected');
                    if (sel) sel.textContent = defaultText;
                }
            });
            updateFilterCount();
            filterData();
        });
    }

    // Data logic
    let data = [];
    const tableBody = document.getElementById('filter-table-body');
    const pagination = document.getElementById('filter-pagination');
    const ITEMS_PER_PAGE = 5;
    let currentPage = 1;

    fetch('/filter-data')
        .then(res => res.json())
        .then(json => {
            console.log('Fetched data:', json); // sanity check
            data = Array.isArray(json) ? json : [];
            filterData();
        })
        .catch(err => console.error('Error loading data:', err));

    function filterData() {
        if (!data || !Array.isArray(data)) return;
        let filtered = [...data];

        const searchValue = (document.getElementById('search')?.value || '').trim().toLowerCase();
        const landTypeValue = (document.getElementById('landType')?.value || '').trim();
        const districtValue = (document.getElementById('districtDropdown')?.value || '').trim();
        const sortByValue = (document.getElementById('sortByDropdown')?.value || '').trim();

        const taxMin = parseFloat(document.getElementById('taxRangeMin')?.value) || null;
        const taxMax = parseFloat(document.getElementById('taxRangeMax')?.value) || null;
        const valueMin = parseFloat(document.getElementById('valueRangeMin')?.value) || null;
        const valueMax = parseFloat(document.getElementById('valueRangeMax')?.value) || null;

        if (searchValue) {
            filtered = filtered.filter(item =>
                (item.titleDeedNumber?.toLowerCase().includes(searchValue)) ||
                (item.district?.toLowerCase().includes(searchValue))
            );
        }

        if (landTypeValue) filtered = filtered.filter(item => item.landType === landTypeValue);
        if (districtValue) filtered = filtered.filter(item => item.district === districtValue);

        if (taxMin !== null) filtered = filtered.filter(item => Number(item.totalTax) >= taxMin);
        if (taxMax !== null) filtered = filtered.filter(item => Number(item.totalTax) <= taxMax);

        if (valueMin !== null) filtered = filtered.filter(item => Number(item.landTotalPrice) >= valueMin);
        if (valueMax !== null) filtered = filtered.filter(item => Number(item.landTotalPrice) <= valueMax);

        if (sortByValue) {
            switch (sortByValue) {
                case 'lastModified-desc': filtered.sort((a,b)=>new Date(b.lastModified)-new Date(a.lastModified)); break;
                case 'lastModified-asc': filtered.sort((a,b)=>new Date(a.lastModified)-new Date(b.lastModified)); break;
                case 'totalTax-desc': filtered.sort((a,b)=>Number(b.totalTax)-Number(a.totalTax)); break;
                case 'totalTax-asc': filtered.sort((a,b)=>Number(a.totalTax)-Number(b.totalTax)); break;
            }
        }

        currentPage = 1;
        renderTable(filtered);
    }

    function renderTable(filtered) {
        if (!tableBody) return;
        tableBody.innerHTML = '';
        const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        const end = start + ITEMS_PER_PAGE;
        const pageItems = filtered.slice(start, end);

        pageItems.forEach(item => {
            tableBody.innerHTML += `
            <tr class="hover:bg-gray-100">
                <td class="font-medium text-center p-2">${item.titleDeedNumber || '-'}</td>
                <td class="text-center p-2">${item.landUsageType || '-'}</td>
                <td class="text-center thai-number p-2">${item.landTotalArea?.toLocaleString('th-TH') || '0'}</td>
                <td class="text-center p-2">${item.buildingType || '-'}</td>
                <td class="text-center thai-number p-2">${item.buildingArea?.toLocaleString('th-TH') || '0'}</td>
                <td class="text-center font-bold text-blue-600 thai-number p-2">
                    ${item.buildingFinalPrice?.toLocaleString('th-TH') || '0'} บาท<br>
                    <span class="text-sm font-light text-gray-600">ที่ดิน: ${item.landTotalPrice?.toLocaleString('th-TH') || '0'} บาท</span>
                </td>
                <td class="text-center font-bold text-blue-600 thai-number p-2">
                    ${item.totalTax?.toLocaleString('th-TH') || '0'} บาท<br>
                    <span class="text-sm font-light text-gray-600">อัตรา: ${item.taxRate?.toFixed(2) || '0'}%</span>
                </td>
            </tr>`;
        });

        renderPagination(totalPages, filtered.length);
    }

    function renderPagination(totalPages, totalItems) {
        if (!pagination) return;
        pagination.innerHTML = `
            <span>หน้า <span id="currentPage">${currentPage}</span> จาก ${totalPages}</span>
            ${Array.from({length: totalPages}, (_, i) => `
                <button class="page-btn ${currentPage === i+1 ? 'active' : ''}" data-page="${i+1}">${i+1}</button>
            `).join('')}
        `;
        pagination.querySelectorAll('.page-btn').forEach(btn => {
            btn.onclick = () => {
                currentPage = parseInt(btn.getAttribute('data-page'));
                renderTable(data.slice((currentPage-1)*ITEMS_PER_PAGE, currentPage*ITEMS_PER_PAGE));
            };
        });

        const exportEl = document.getElementById('export-count');
        if (exportEl) exportEl.textContent = `แสดงผลลัพธ์ ${totalItems} รายการ`;
    }

    updateFilterCount();
});

// Export button logic
document.getElementById('export-btn').addEventListener('click', () => {
    const filters = {
        search: document.getElementById('search')?.value || '',
        landType: document.getElementById('landType')?.value || '',
        taxMin: document.getElementById('taxRangeMin')?.value || '',
        taxMax: document.getElementById('taxRangeMax')?.value || '',
        valueMin: document.getElementById('valueRangeMin')?.value || '',
        valueMax: document.getElementById('valueRangeMax')?.value || '',
        sortBy: document.getElementById('sortByDropdown')?.value || ''
    };

    fetch('/export-data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filters })
    })
        .then(res => res.blob())
        .then(blob => {
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = '1export.xlsx';
            a.click();
            window.URL.revokeObjectURL(url);
        })
        .catch(err => console.error('Export failed:', err));
});

const importBtn = document.getElementById('importBtn');
const importFileInput = document.getElementById('importFile');

importBtn.addEventListener('click', () => {
  importFileInput.click();
});

importFileInput.addEventListener('change', async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const formData = new FormData();
  formData.append('file', file);

  try {
    const res = await fetch('/import-data', {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (res.ok) {
      document.getElementById('import-count').innerText = `นำเข้าข้อมูลสำเร็จ: ${result.insertedRows} แถว`;
    } else {
      alert('Error: ' + result.message);
    }
  } catch (error) {
    alert('Import failed: ' + error.message);
  }
});