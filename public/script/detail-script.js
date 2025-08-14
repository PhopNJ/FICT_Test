const ITEMS_PER_PAGE = 3;
let currentPage = 1;

function renderDataList() {
    const detailsList = document.getElementById('details-list');
    detailsList.innerHTML = '';
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    const pageItems = dataItems.slice(start, end);

    pageItems.forEach(item => {
        detailsList.innerHTML += `
            <div class="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
            <!-- Header -->
            <div class="flex justify-between items-center bg-gray-50 px-4 py-3 cursor-pointer detail-header" id="detail-header">
                <div>
                <p class="font-semibold text-lg">โฉนดเลขที่ ${item.deed}</p>
                <div class="flex flex-wrap gap-2 mt-1">
                    <span class="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded">${item.landType}</span>
                    <span class="bg-green-100 text-green-800 text-xs px-2 py-1 rounded">สิ่งปลูกสร้าง ${item.buildings.length} หลัง</span>
                    <span class="bg-purple-100 text-purple-800 text-xs px-2 py-1 rounded">${item.displayArea}</span>
                </div>
                </div>
                <div class="flex items-center space-x-4">
                <div class="text-right">
                    <p class="font-bold text-xl text-blue-600">฿${item.displayTax.toLocaleString('th-TH')}</p>
                    <p class="text-sm text-gray-500">อัปเดต: ${item.landUpdated}</p>
                </div>
                <span class="toggle-arrow text-gray-500 transition-transform duration-300">
                    <i class="fa-solid fa-chevron-down"></i>
                </span>
                </div>
            </div>

            <!-- Collapsible Content -->
            <div class="detailWrap px-4 py-4 hidden">
                <!-- Land Info -->
                <section class="bg-gray-50 p-4 rounded-lg mb-6">
                <h3 class="font-semibold text-lg border-b pb-2 mb-3">ข้อมูลที่ดิน</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div class="flex justify-between"><span class="text-gray-600">เลขที่โฉนด:</span><span>${item.deed}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">ประเภทที่ดิน:</span><span>${item.landType}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">ลักษณะการใช้:</span><span>${item.usage}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">พื้นที่ (ไร่-งาน-วา):</span><span>${item.rai}-${item.ngan}-${item.wah}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">ราคาต่อตร.ว.:</span><span>฿${Number(item.pricePerWah).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">พื้นที่รวม:</span><span>${item.displayArea}</span></div>
                    <div class="flex justify-between"><span class="text-gray-600">มูลค่าที่ดิน:</span><span class="text-green-600">฿${Number(item.landTotalPrice).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span></div>
                </div>
                </section>

                <!-- Buildings -->
                <section>
                <h3 class="font-semibold text-lg mb-4">สิ่งปลูกสร้าง (${item.buildings.length} หลัง)</h3>
                ${item.buildings.map((b, i) => `
                <div class="border border-gray-200 rounded-lg p-4 mb-6">
                    <div class="flex justify-between items-center mb-3">
                    <div>
                        <h4 class="font-medium">หลังที่ ${i+1}: ${b.type}</h4>
                        <p class="text-sm text-gray-500">อายุ ${b.age.toLocaleString('th-TH')} ปี</p>
                    </div>
                    <div class="text-right">
                        <span class="text-blue-600 font-medium">฿${Number(b.displayPrice).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                        <p class="text-xs text-gray-500">มูลค่าหลังหักค่าเสื่อม</p>
                    </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-3 gap-x-6 gap-y-4 border-t border-gray-200 text-sm">
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">พื้นที่:</span>
                        <span>${b.displayArea}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">ราคาต่อตร.ม.:</span>
                        <span>฿${Number(b.pricePerSqm).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">ค่าเสื่อม:</span>
                        <span>฿${Number(b.depreciation).toLocaleString('th-TH', { maximumFractionDigits: 0 })} (${Math.round((b.depreciation/b.totalPrice)*100).toLocaleString('th-TH')}%)</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">มูลค่าหลังหักเสื่อม:</span>
                        <span>฿${Number(b.displayPrice).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">มูลค่าประเมินรวม:</span>
                        <span>฿${Number(b.totalAppraised).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">ค่ายกเว้นภาษี:</span>
                        <span>฿${Number(b.exemptionValue).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">ฐานภาษี:</span>
                        <span>฿${Number(b.taxBase).toLocaleString('th-TH', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">อัตราภาษี:</span>
                        <span>${b.taxRate.toLocaleString('th-TH')}%</span>
                    </div>
                    <div class="flex justify-between border-b border-gray-200 py-3">
                        <span class="text-gray-600">ภาษีที่ต้องชำระ:</span>
                        <span class="text-red-600">฿${b.displayTax.toLocaleString('th-TH')}</span>
                    </div>
                    </div>
                </div>
                `).join('')}
                </section>

                <!-- Total Tax Summary -->
                <section class="bg-gray-50 p-4 rounded-lg mt-6 flex justify-between items-center">
                <div>
                    <p class="text-gray-600 text-sm">ภาษีรวมทั้งหมด</p>
                    <p class="text-2xl font-bold text-red-600">฿${item.displayTax.toLocaleString('th-TH')}</p>
                </div>
                <div class="flex space-x-2">
                    <button class="btn-edit px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors" data-id="${item.id}">
                    <i class="fa-solid fa-pen-to-square mr-2"></i> แก้ไข
                    </button>
                    <button class="btn-delete px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors" data-id="${item.id}">
                    <i class="fa-solid fa-trash-can mr-2"></i> ลบ
                    </button>
                </div>
                </section>
            </div>
            </div>
            `;
    renderPagination();
    attachDetailEvents();
    attachDeleteEvents(); // 🔥 This ensures delete buttons are functional after render
    });
} 


function renderPagination() {
    const pagination = document.getElementById('pagination');
    const totalPages = Math.ceil(dataItems.length / ITEMS_PER_PAGE);
    pagination.innerHTML = `
    <span id="num-pagination">หน้า <span id="currentPage">${currentPage}</span> จาก ${totalPages}</span>
    ${Array.from({ length: totalPages }, (_, i) => `
        <button class="page-btn ${currentPage === i + 1 ? 'active' : ''}" data-page="${i + 1}">${i + 1}</button>
    `).join('')}
`;
    pagination.querySelectorAll('.page-btn').forEach(btn => {
        btn.onclick = () => {
            currentPage = parseInt(btn.getAttribute('data-page'));
            renderDataList();
        };
    });
}

function attachDetailEvents() {
    // Use class instead of duplicate ID
    document.querySelectorAll('.detail-header').forEach(header => {
        header.addEventListener('click', function () {
            const parent = header.closest('.border');
            const wrap = parent.querySelector('.detailWrap');
            const info = parent.querySelector('.detail-info');
            const option = parent.querySelector('.detailOption');
            const hr = parent.querySelector('.detail-hr');
            const arrow = header.querySelector('.toggle-arrow');

            if (!wrap || !arrow) return; // safety check

            const isOpen = wrap.classList.contains('open');

            if (isOpen) {
                wrap.classList.remove('open');
                wrap.style.display = 'none';

                if (info) { info.style.maxHeight = '0px'; info.style.opacity = '0'; }
                if (option) { option.style.maxHeight = '0px'; option.style.opacity = '0'; }
                if (hr) { hr.style.maxHeight = '0px'; hr.style.opacity = '0'; }

                arrow.style.transform = 'rotate(0deg)';
            } else {
                wrap.classList.add('open');
                wrap.style.display = 'block';

                setTimeout(() => {
                    if (info) { info.style.maxHeight = info.scrollHeight + 'px'; info.style.opacity = '1'; }
                    if (option) { option.style.maxHeight = option.scrollHeight + 'px'; option.style.opacity = '1'; }
                    if (hr) { hr.style.maxHeight = '2px'; hr.style.opacity = '1'; }

                    arrow.style.transform = 'rotate(180deg)';
                }, 10);
            }
        });
    });

    document.querySelectorAll('.btn-edit').forEach(btn => {
        btn.addEventListener('click', async function () {
            const detailWrap = btn.closest('.detailWrap');
            const detailInfo = detailWrap.querySelector('.detail-info');
            const detailItems = detailWrap.querySelectorAll('.detail-item');
            const isEditing = btn.getAttribute('data-editing') === 'true';

            if (!isEditing) {
                // Switch to edit mode (except updated field)
                detailItems.forEach(item => {
                    const title = item.querySelector('.detail-title')?.textContent?.trim();
                    const valueSpan = item.querySelector('.detail-value');

                    if (!valueSpan || title === "แก้ไขล่าสุด:") return; // Skip 'updated'

                    const oldValue = valueSpan.textContent;
                    const input = document.createElement('input');
                    input.type = 'text';
                    input.value = oldValue;
                    input.className = 'edit-input';
                    valueSpan.style.display = 'none';
                    item.appendChild(input);
                });
                btn.innerHTML = '<i class="fa-solid fa-floppy-disk mr-2"></i> บันทึก';
                btn.setAttribute('data-editing', 'true');
                detailInfo.style.maxHeight = detailInfo.scrollHeight + 'px';
            } else {
                // Save changes
                const payload = {};
                let id = null;

                detailItems.forEach(item => {
                    const title = item.querySelector('.detail-title')?.textContent?.trim();
                    const input = item.querySelector('.edit-input');
                    const valueSpan = item.querySelector('.detail-value');

                    if (!input || !valueSpan) return;

                    const newValue = input.value.trim();
                    valueSpan.textContent = newValue;
                    valueSpan.style.display = '';
                    input.remove();

                    switch (title) {
                        case "เลขที่โฉนด:":
                            id = newValue; // assuming this is primary key or unique
                            payload.deed = newValue;
                            break;
                        case "ประเภทที่ดิน:":
                            payload.landType = newValue;
                            break;
                        case "ลักษณะการใช้ประโยชน์:":
                            payload.usage = newValue;
                            break;
                        case "พื้นที่รวม:":
                            payload.area = newValue;
                            break;
                        case "มูลค่าที่ดิน:":
                            payload.landValue = newValue;
                            break;
                        case "ประเภทสิ่งปลูกสร้าง:":
                            payload.buildingType = newValue;
                            break;
                        case "มูลค่าสิ่งปลูกสร้าง:":
                            payload.buildingValue = newValue;
                            break;
                        case "ภาษีที่ต้องชำระ:":
                            payload.tax = newValue;
                            break;
                        default:
                            break;
                    }
                });

                try {
                    const res = await fetch(`/update/${id}`, {
                        method: 'PUT',
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify(payload)
                    });

                    const message = await res.text();
                    if (!res.ok) throw new Error(message);

                    showNotification('บันทึกข้อมูลสำเร็จ');
                } catch (err) {
                    alert('เกิดข้อผิดพลาดในการอัปเดต');
                    console.error(err);
                }

                btn.innerHTML = '<i class="fa-solid fa-pen-to-square mr-2"></i> แก้ไข';
                btn.setAttribute('data-editing', 'false');
                detailInfo.style.maxHeight = detailInfo.scrollHeight + 'px';
            }
        });
    });
}

function attachDeleteEvents() {
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', async function () {
            const id = this.getAttribute('data-id');
            if (!confirm(`ต้องการลบข้อมูลนี้หรือไม่?`)) return;

            try {
                const res = await fetch(`/delete/${id}`, {
                    method: 'DELETE'
                });

                const message = await res.text();
                if (res.ok) {
                    showNotification('ลบข้อมูลเรียบร้อยแล้ว');
                    location.reload();
                } else {
                    alert(`ล้มเหลว: ${message}`);
                }
            } catch (err) {
                alert('เกิดข้อผิดพลาดในการลบข้อมูล');
                console.error(err);
            }
        });
    });
}

function showNotification(message) {
    let noti = document.createElement('div');
    noti.className = 'custom-notification';
    noti.textContent = message;
    document.body.appendChild(noti);
    setTimeout(() => {
        noti.classList.add('hide');
        setTimeout(() => noti.remove(), 500);
    }, 5000);
}

renderDataList(); // Initial render