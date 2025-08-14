document.querySelector('form').addEventListener('submit', async function (e) {
  e.preventDefault();
  console.log('🏁 Form submission started');

  try {
    const submitBtn = e.target.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.innerHTML = '<i class="fa fa-spinner fa-spin"></i> กำลังบันทึก...';

    const buildings = [];
    const landTotalPrice = parseFloat(document.getElementById('landTotalPrice')?.textContent.replace(/,/g, '')) || 0;
    console.log('🌳 Land total price:', landTotalPrice);

    // First collect all building data
    document.querySelectorAll('.building-entry').forEach((entry, index) => {
      console.log(`🏗️ Processing building #${index + 1}`);
      
      try {
        // Basic building info
        const type = entry.querySelector('input[name="buildingType[]"]')?.value || '';
        const area = parseFloat(entry.querySelector('.building-area')?.value) || 0;
        const pricePerSqM = parseFloat(entry.querySelector('.price-per-sqm')?.value) || 0;
        const totalPrice = parseFloat(entry.querySelector('.buildingTotalPrice')?.textContent.replace(/,/g, '')) || 0;
        const age = parseInt(entry.querySelector('.building-age')?.value) || 0;
        const depreciation = parseFloat(entry.querySelector('.depreciation-value')?.textContent.replace(/,/g, '')) || 0;
        const finalPrice = parseFloat(entry.querySelector('.final-price')?.textContent.replace(/,/g, '')) || 0;
        
        // Tax calculations
        const exemptionValue = parseFloat(entry.querySelector('.exemptionValue')?.value) || 0;
        const taxRate = parseFloat(entry.querySelector('.taxRate')?.value) || 0.5; // Default to 0.5% if empty
        const taxBase = Math.max(finalPrice - exemptionValue, 0);
        const taxAmount = taxBase * (taxRate / 100);
        const summaryTotalAppraised = landTotalPrice + finalPrice;

        console.log(`📊 Building #${index + 1} calculations:`, {
          type, area, pricePerSqM, totalPrice, age, depreciation, finalPrice,
          exemptionValue, taxRate, taxBase, taxAmount, summaryTotalAppraised
        });

        buildings.push({
          type,
          area,
          pricePerSqM,
          totalPrice,
          age,
          depreciation,
          finalPrice,
          exemptionValue,
          taxRate,
          taxBase,
          taxAmount,
          summaryTotalAppraised
        });
      } catch (err) {
        console.error(`❌ Error processing building #${index + 1}:`, err);
        throw new Error(`Building ${index + 1} data error: ${err.message}`);
      }
    });

    // Then validate the collected building data
    function validateBuildingData(buildings) {
      return buildings.map(building => {
        // Ensure required fields exist
        return {
          type: building.type || 'unknown',
          area: Number(building.area) || 0,
          pricePerSqM: Number(building.pricePerSqM) || 0,
          totalPrice: Number(building.totalPrice) || 0,
          age: Number(building.age) || 0,
          depreciation: Number(building.depreciation) || 0,
          finalPrice: Number(building.finalPrice) || 0,
          exemptionValue: Number(building.exemptionValue) || 0,
          taxRate: Number(building.taxRate) || 0,
          taxBase: Math.max((Number(building.finalPrice) || 0) - (Number(building.exemptionValue) || 0), 0),
          taxAmount: (Number(building.taxBase) || 0) * (Number(building.taxRate) || 0) / 100,
          summaryTotalAppraised: (Number(building.finalPrice) || 0) + (Number(landTotalPrice) || 0)
        };
      });
    }

    const validatedBuildings = validateBuildingData(buildings);

    const payload = {
      landType: document.getElementById('landType')?.value || '',
      titleDeedNumber: document.getElementById('titleDeedNumber')?.value || '',
      landUsageType: document.querySelector('input[name="landUsageType"]:checked')?.value || '',
      landRai: parseInt(document.getElementById('landRai')?.value) || 0,
      landNgan: parseInt(document.getElementById('landNgan')?.value) || 0,
      landWah: parseFloat(document.getElementById('landWah')?.value) || 0,
      pricePerSqWah: parseFloat(document.getElementById('pricePerSqWah')?.value) || 0,
      landTotalPrice: landTotalPrice,
      buildingData: validatedBuildings
    };

    console.log('📦 Final payload to server:', payload);

    const res = await fetch('/submit', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Debug': 'true'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Server response error:', errorText);
      throw new Error(errorText || 'Unknown server error');
    }

    console.log('✅ Server response OK');
    alert('ส่งข้อมูลเรียบร้อยแล้ว');
    window.location.href = window.location.pathname;

  } catch (err) {
    console.error('❌ Form submission failed:', err);
    alert(`เกิดข้อผิดพลาด: ${err.message}`);
  } finally {
    const submitBtn = document.querySelector('form button[type="submit"]');
    if (submitBtn) {
      submitBtn.disabled = false;
      submitBtn.textContent = 'บันทึกข้อมูล';
    }
  }
});

document.addEventListener('DOMContentLoaded', function () {
    // Land Type Dropdown
    const landDropdown = document.getElementById('landTypeDropdown');
    const landSelected = landDropdown.querySelector('.dropdown-selected');
    const landOptions = landDropdown.querySelector('.dropdown-options');
    const landHiddenInput = landDropdown.querySelector('input[type="hidden"]');

    landSelected.addEventListener('click', function () {
        landDropdown.classList.toggle('open');
    });

    landOptions.querySelectorAll('.dropdown-option').forEach(option => {
        option.addEventListener('click', function () {
            landSelected.textContent = this.textContent;
            landHiddenInput.value = this.getAttribute('data-value');
            landDropdown.classList.remove('open');
        });
    });

    document.addEventListener('click', function (e) {
        if (!landDropdown.contains(e.target)) {
            landDropdown.classList.remove('open');
        }
    });
});

document.addEventListener('DOMContentLoaded', function () {
    // ---------- Helpers ----------
    function parseNumber(str) {
        return parseFloat((str || '').toString().replace(/,/g, '')) || 0;
    }

    const depreciationRates = {
        1:1,2:2,3:3,4:4,5:5,6:6,7:7,8:9,9:10,10:12,11:14,12:16,13:18,14:20,15:22,
        16:24,17:26,18:28,19:30,20:32,21:33,22:34,23:35,24:36,25:37,26:38,27:39,
        28:40,29:41,30:42,31:43,32:44,33:45,34:46,35:47,36:48,37:49,38:50,39:51,
        40:52,41:53,42:54,43:76
    };
    
    function getDepreciationPercent(age) {
        return age >= 43 ? 76 : (depreciationRates[age] || 0);
    }

    // ---------- Land Area Calculation ----------
    function calculateTotalWah() {
        const rai = parseNumber(document.getElementById('landRai').value);
        const ngan = parseNumber(document.getElementById('landNgan').value);
        const wah = parseNumber(document.getElementById('landWah').value);
        
        // 1 rai = 400 wah, 1 ngan = 100 wah
        const totalWah = (rai * 400) + (ngan * 100) + wah;
        document.getElementById('totalWah').textContent = totalWah.toFixed(2);
        calculateLandPrice();
    }

    // Initialize land area calculation
    ['landRai', 'landNgan', 'landWah'].forEach(id => {
        document.getElementById(id).addEventListener('input', calculateTotalWah);
    });
    calculateTotalWah(); // Initial calculation

    // ---------- Land Price Calculation ----------
    function calculateLandPrice() {
        const totalWah = parseNumber(document.getElementById('totalWah').textContent);
        const pricePerWah = parseNumber(document.getElementById('pricePerSqWah').value);
        const totalPrice = totalWah * pricePerWah;
        
        document.getElementById('landTotalPrice').textContent = totalPrice.toFixed(2);
        updateAllBuildingSummaries();
    }

    document.getElementById('pricePerSqWah').addEventListener('input', calculateLandPrice);

    // ---------- Building Calculations ----------
    function calculateBuilding(entry) {
        const area = parseNumber(entry.querySelector('.building-area').value);
        const pricePerSqM = parseNumber(entry.querySelector('.price-per-sqm').value);
        const totalPrice = area * pricePerSqM;
        
        // Update building total price
        entry.querySelector('.buildingTotalPrice').textContent = totalPrice.toFixed(2);
        
        // Calculate depreciation
        const age = parseInt(entry.querySelector('.building-age').value) || 0;
        const depPct = getDepreciationPercent(age);
        const depValue = Math.min(totalPrice * (depPct / 100), 999999999.99); // Limit to reasonable value
        
        const finalPrice = totalPrice - depValue;
        
        // Update displays
        entry.querySelector('.depreciation-value').textContent = depValue.toFixed(2);
        entry.querySelector('.final-price').textContent = finalPrice.toFixed(2);
        entry.querySelector('.depreciation-rate-text').textContent = `คิดอัตราเสื่อมร้อยละ ${depPct}`;
        
        updateBuildingSummary(entry);
    }

    function updateBuildingSummary(entry) {
        const landPrice = parseNumber(document.getElementById('landTotalPrice').textContent);
        const buildingPrice = parseNumber(entry.querySelector('.final-price').textContent);
        const exemption = parseNumber(entry.querySelector('.exemptionValue').value) || 0;
        const taxRate = parseNumber(entry.querySelector('.taxRate').value) || 0.5;
        
        const totalAppraised = landPrice + buildingPrice;
        const taxBase = Math.max(totalAppraised - exemption, 0);
        const taxAmount = taxBase * (taxRate / 100);
        
        // Update summary displays
        entry.querySelector('.summaryTotalAppraised').textContent = totalAppraised.toFixed(2);
        entry.querySelector('.AssessedValue').textContent = taxBase.toFixed(2);
        entry.querySelector('.summaryTaxAmount').textContent = taxAmount.toFixed(2);
    }

    function updateAllBuildingSummaries() {
        document.querySelectorAll('.building-entry').forEach(entry => {
            updateBuildingSummary(entry);
        });
    }

    // ---------- Event Binding ----------
    function bindBuildingEvents(entry) {
        // Bind calculation events
        entry.querySelectorAll('.building-area, .price-per-sqm, .building-age').forEach(input => {
            input.addEventListener('input', () => calculateBuilding(entry));
        });
        
        // Bind tax calculation events
        entry.querySelectorAll('.exemptionValue, .taxRate').forEach(input => {
            input.addEventListener('input', () => updateBuildingSummary(entry));
        });
        
        // Bind remove button
        const removeBtn = entry.querySelector('.remove-building');
        if (removeBtn) {
            removeBtn.addEventListener('click', function() {
                if (document.querySelectorAll('.building-entry').length <= 1) {
                    alert('ต้องมีสิ่งปลูกสร้างอย่างน้อย 1 รายการ');
                    return;
                }
                if (confirm('ต้องการลบสิ่งปลูกสร้างนี้หรือไม่?')) {
                    entry.remove();
                    renumberBuildings();
                    updateAllBuildingSummaries();
                }
            });
        }
    }

    // ---------- Building Management ----------
    function renumberBuildings() {
        document.querySelectorAll('.building-entry').forEach((entry, index) => {
            entry.querySelector('h3').textContent = `สิ่งปลูกสร้าง #${index + 1}`;
        });
    }

    function resetBuilding(entry) {
        // Clear inputs
        entry.querySelectorAll('input').forEach(input => {
            if (!input.classList.contains('taxRate')) { // Keep tax rate
                input.value = '';
            }
        });
        
        // Reset calculated values
        entry.querySelector('.buildingTotalPrice').textContent = '0.00';
        entry.querySelector('.depreciation-value').textContent = '0.00';
        entry.querySelector('.final-price').textContent = '0.00';
        entry.querySelector('.depreciation-rate-text').textContent = 'คิดอัตราเสื่อมร้อยละ 0';
        entry.querySelector('.summaryTotalAppraised').textContent = '0.00';
        entry.querySelector('.AssessedValue').textContent = '0.00';
        entry.querySelector('.summaryTaxAmount').textContent = '0.00';
        
        // Reset dropdown
        const dropdown = entry.querySelector('.building-type');
        dropdown.querySelector('.dropdown-selected').textContent = 'เลือกประเภทสิ่งปลูกสร้าง';
        dropdown.querySelector('input[type="hidden"]').value = '';
    }

    // Initialize existing buildings
    document.querySelectorAll('.building-entry').forEach(entry => {
        bindBuildingEvents(entry);
        calculateBuilding(entry);
    });

    // Add new building
    document.getElementById('addBuildingBtn').addEventListener('click', function() {
        const template = document.querySelector('.building-entry');
        const newEntry = template.cloneNode(true);
        
        resetBuilding(newEntry);
        bindBuildingEvents(newEntry);
        document.getElementById('buildingsContainer').appendChild(newEntry);
        renumberBuildings();
        
        // Initialize dropdown for new building
        const dropdown = newEntry.querySelector('.building-type');
        if (dropdown) {
            const selected = dropdown.querySelector('.dropdown-selected');
            const options = dropdown.querySelectorAll('.dropdown-option');
            const hiddenInput = dropdown.querySelector('input[type="hidden"]');
            
            selected.addEventListener('click', function(e) {
                e.stopPropagation();
                dropdown.classList.toggle('open');
            });
            
            options.forEach(option => {
                option.addEventListener('click', function(e) {
                    e.stopPropagation();
                    selected.textContent = this.textContent;
                    hiddenInput.value = this.getAttribute('data-value');
                    dropdown.classList.remove('open');
                });
            });
        }
        
        calculateBuilding(newEntry);
    });

    // Close dropdowns when clicking outside
    document.addEventListener('click', function(e) {
        if (!e.target.closest('.building-type')) {
            document.querySelectorAll('.building-type').forEach(dropdown => {
                dropdown.classList.remove('open');
            });
        }
    });
});