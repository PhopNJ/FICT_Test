const connection = require('../../db/connection');
const path = require('path');
const db = require('../../db/connection');
const ExcelJS = require('exceljs');
const multer = require('multer');
const upload = multer(); 

exports.renderFilter = (req, res) => {
  res.render('filter');
};

exports.getFilterData = async (req, res) => {
  const sql = `
    SELECT 
      b.id AS buildingId,
      b.building_type AS buildingType,
      b.area AS buildingArea,
      b.price_per_sqm AS pricePerSqm,
      b.total_price AS buildingTotalPrice,
      b.age AS buildingAge,
      b.depreciation AS buildingDepreciation,
      b.final_price AS buildingFinalPrice,
      l.id AS landId,
      l.title_deed_number AS titleDeedNumber,
      l.land_type AS landType,
      l.usage_type AS landUsageType,
      (l.rai*400 + l.ngan*100 + l.wah) AS landTotalArea,
      l.total_price AS landTotalPrice,
      COALESCE(ts.tax_amount,0) AS totalTax,
      COALESCE(ts.tax_rate,0) AS taxRate,
      l.updatedAt AS lastModified
    FROM buildings b
    LEFT JOIN lands l ON b.land_id = l.id AND l.deletedAt IS NULL
    LEFT JOIN tax_summary ts ON l.id = ts.land_id
    WHERE b.deletedAt IS NULL
    ORDER BY l.updatedAt DESC, b.id ASC
  `;

  try {
    const [results] = await db.query(sql);
    const formatted = results.map(r => ({
      ...r,
      buildingArea: Number(r.buildingArea),
      buildingTotalPrice: Number(r.buildingTotalPrice),
      buildingFinalPrice: Number(r.buildingFinalPrice),
      landTotalArea: Number(r.landTotalArea),
      landTotalPrice: Number(r.landTotalPrice),
      totalTax: Number(r.totalTax),
      taxRate: Number(r.taxRate)
    }));
    res.json(formatted);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
};



exports.exportData = async (req, res) => {
  try {
    const filters = req.body.filters || {};
    let sql = `
      SELECT 
        l.id AS land_id, l.land_type, l.title_deed_number, l.usage_type,
        l.rai, l.ngan, l.wah, l.price_per_wah, l.total_price AS land_total_price,
        b.id AS building_id, b.building_type, b.area, b.price_per_sqm,
        b.total_price AS building_total_price, b.age, b.depreciation, b.final_price,
        t.total_appraised, t.exemption_value, t.tax_base, t.tax_rate, t.tax_amount
      FROM lands l
      LEFT JOIN buildings b ON l.id = b.land_id
      LEFT JOIN tax_summary t ON l.id = t.land_id
      WHERE 1=1
    `;

    const params = [];
    if (filters.landType) {
      sql += ` AND l.land_type = ?`;
      params.push(filters.landType);
    }
    if (filters.search) {
      sql += ` AND (l.title_deed_number LIKE ? OR l.usage_type LIKE ?)`;
      params.push(`%${filters.search}%`, `%${filters.search}%`);
    }
    if (filters.taxMin) {
      sql += ` AND t.tax_amount >= ?`;
      params.push(filters.taxMin);
    }
    if (filters.taxMax) {
      sql += ` AND t.tax_amount <= ?`;
      params.push(filters.taxMax);
    }

    const [rows] = await db.query(sql, params);

    // Group rows by land to handle multiple buildings
    const landsMap = new Map();
    rows.forEach(row => {
      if (!landsMap.has(row.land_id)) {
        landsMap.set(row.land_id, {
          land: row,
          buildings: []
        });
      }
      if (row.building_id) {
        landsMap.get(row.land_id).buildings.push(row);
      }
    });

    const workbook = new ExcelJS.Workbook();
    // Optional: create workbook from scratch instead of template
    const sheet = workbook.addWorksheet('Land & Buildings');

    // Set header row
    sheet.columns = [
      { header: 'No.', key: 'no', width: 5 },
      { header: 'Title Deed # / Land Type', key: 'land_info', width: 30 },
      { header: 'Land Use', key: 'usage_type', width: 15 },
      { header: 'Rai', key: 'rai', width: 7 },
      { header: 'Ngan', key: 'ngan', width: 7 },
      { header: 'Wah', key: 'wah', width: 7 },
      { header: 'Total Area (sq.wah)', key: 'total_area', width: 15 },
      { header: 'Price per wah', key: 'price_per_wah', width: 15 },
      { header: 'Land Price', key: 'land_total_price', width: 15 },
      { header: 'Building #', key: 'building_count', width: 10 },
      { header: 'Building Type', key: 'building_type', width: 15 },
      { header: 'Area (sqm)', key: 'area', width: 12 },
      { header: 'Price per sqm', key: 'price_per_sqm', width: 15 },
      { header: 'Building Total Price', key: 'building_total_price', width: 18 },
      { header: 'Building Age', key: 'age', width: 10 },
      { header: 'Depreciation %', key: 'depreciation', width: 15 },
      { header: 'Building Final Price', key: 'final_price', width: 18 },
      { header: 'Total Appraised', key: 'total_appraised', width: 15 },
      { header: 'Exemption Value', key: 'exemption_value', width: 15 },
      { header: 'Remaining Value', key: 'remaining_value', width: 15 },
      { header: 'Tax Rate (%)', key: 'tax_rate', width: 12 },
      { header: 'Tax Amount', key: 'tax_amount', width: 15 },
    ];

    let no = 1;
    for (const { land, buildings } of landsMap.values()) {
      const totalArea = (land.rai * 400) + (land.ngan * 100) + land.wah;
      const remainingValue = (land.total_appraised || 0) - (land.exemption_value || 0);

      if (buildings.length === 0) {
        // No buildings: one row with building columns empty
        sheet.addRow({
          no: no++,
          land_info: `${land.land_type} / ${land.title_deed_number}`,
          usage_type: land.usage_type,
          rai: land.rai,
          ngan: land.ngan,
          wah: land.wah,
          total_area: totalArea,
          price_per_wah: land.price_per_wah,
          land_total_price: land.land_total_price,
          building_count: 0,
          building_type: '',
          area: '',
          price_per_sqm: '',
          building_total_price: '',
          age: '',
          depreciation: '',
          final_price: '',
          total_appraised: land.total_appraised,
          exemption_value: land.exemption_value,
          remaining_value: remainingValue,
          tax_rate: land.tax_rate,
          tax_amount: land.tax_amount,
        });
      } else {
        // For each building, output one row
        buildings.forEach(bldg => {
          sheet.addRow({
            no: no++,
            land_info: `${land.land_type} / ${land.title_deed_number}`,
            usage_type: land.usage_type,
            rai: land.rai,
            ngan: land.ngan,
            wah: land.wah,
            total_area: totalArea,
            price_per_wah: land.price_per_wah,
            land_total_price: land.land_total_price,
            building_count: buildings.length,
            building_type: bldg.building_type,
            area: bldg.area,
            price_per_sqm: bldg.price_per_sqm,
            building_total_price: bldg.building_total_price,
            age: bldg.age,
            depreciation: bldg.depreciation,
            final_price: bldg.final_price,
            total_appraised: land.total_appraised,
            exemption_value: land.exemption_value,
            remaining_value: remainingValue,
            tax_rate: land.tax_rate,
            tax_amount: land.tax_amount,
          });
        });
      }
    }

    // Style header
    sheet.getRow(1).font = { bold: true };
    sheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

    // Auto filter for all columns
    sheet.autoFilter = {
      from: 'A1',
      to: sheet.getRow(1).lastCell.address,
    };

    // Set response headers
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename=land_building_tax.xlsx');

    // Write to buffer and send
    const buffer = await workbook.xlsx.writeBuffer();
    res.send(buffer);

  } catch (err) {
    console.error('Export error:', err);
    res.status(500).send('Error generating Excel');
  }
};

exports.importData = async (req, res) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });

  // Helper to safely convert to number, treating '-', '', etc. as 0
  function toNumberSafe(value) {
    if (value === undefined || value === null) return 0;
    if (typeof value === 'string') {
      value = value.replace(/,/g, '').trim();
      if (value === '' || value === '-' || value.toLowerCase() === 'n/a') return 0;
    }
    const num = Number(value);
    return isNaN(num) ? 0 : num;
  }

  try {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(req.file.buffer);
    const sheet = workbook.getWorksheet(1);
    if (!sheet) return res.status(400).json({ message: 'Excel sheet not found' });

    const dataRows = [];
    sheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber >= 6) dataRows.push(row.values);
    });

    console.log(`Total rows read from sheet (starting row 6): ${dataRows.length}`);

    const landsMap = new Map();

    dataRows.forEach((row, idx) => {
      const titleDeedNumber = row[2];
      const rai = toNumberSafe(row[4]);
      const ngan = toNumberSafe(row[5]);
      const wah = toNumberSafe(row[6]);

      if (!titleDeedNumber) {
        console.log(`Skipping row ${idx + 6}: missing titleDeedNumber`);
        return;
      }

      if (rai === 0 && ngan === 0 && wah === 0) {
        console.log(`Skipping row ${idx + 6}: no valid area data - rai: ${row[4]}, ngan: ${row[5]}, wah: ${row[6]}`);
        return;
      }

      if (!landsMap.has(titleDeedNumber)) {
        landsMap.set(titleDeedNumber, {
          land: {
            land_type: row[2],         // B
            title_deed_number: row[2], // B
            usage_type: row[3],        // C
            rai: rai,                  // D
            ngan: ngan,                // E
            wah: wah,                  // F
            price_per_wah: toNumberSafe(row[8]),     // H
            total_price: toNumberSafe(row[9]),       // I
          },
          buildings: [],
          tax_summary: {
            total_appraised: toNumberSafe(row[18]),    // R
            exemption_value: toNumberSafe(row[19]),    // S
            tax_base: toNumberSafe(row[21]),           // U
            tax_amount: toNumberSafe(row[22]),         // V
          }
        });
      }

      const landEntry = landsMap.get(titleDeedNumber);

      if (row[10]) {
        landEntry.buildings.push({
          building_type: row[11],
          area: toNumberSafe(row[12]),
          price_per_sqm: toNumberSafe(row[13]),
          total_price: toNumberSafe(row[14]),
          age: toNumberSafe(row[15]),
          depreciation: toNumberSafe(row[16]),
          final_price: toNumberSafe(row[17]),
        });
      }
    });

    console.log(`Valid lands to import: ${landsMap.size}`);

    if (landsMap.size === 0) {
      return res.status(400).json({ message: 'No valid data found in Excel' });
    }

    // Use your existing connection from db/connection.js
    const connection = await db.getConnection();
    try {
      await connection.beginTransaction();

      for (const [titleDeed, { land, buildings, tax_summary }] of landsMap.entries()) {
        const [landResult] = await connection.query(
          `INSERT INTO lands (land_type, title_deed_number, usage_type, rai, ngan, wah, price_per_wah, total_price)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)
           ON DUPLICATE KEY UPDATE
             land_type=VALUES(land_type), usage_type=VALUES(usage_type), rai=VALUES(rai), ngan=VALUES(ngan), wah=VALUES(wah), price_per_wah=VALUES(price_per_wah), total_price=VALUES(total_price)`,
          [land.land_type, land.title_deed_number, land.usage_type, land.rai, land.ngan, land.wah, land.price_per_wah, land.total_price]
        );

        let land_id = landResult.insertId;
        if (!land_id) {
          const [rows] = await connection.query(`SELECT id FROM lands WHERE title_deed_number = ?`, [land.title_deed_number]);
          if (rows.length) land_id = rows[0].id;
          else throw new Error('Failed to get land_id');
        }

        for (const b of buildings) {
          await connection.query(
            `INSERT INTO buildings (land_id, building_type, area, price_per_sqm, total_price, age, depreciation, final_price)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               building_type=VALUES(building_type), area=VALUES(area), price_per_sqm=VALUES(price_per_sqm), total_price=VALUES(total_price),
               age=VALUES(age), depreciation=VALUES(depreciation), final_price=VALUES(final_price)`,
            [land_id, b.building_type, b.area, b.price_per_sqm, b.total_price, b.age, b.depreciation, b.final_price]
          );
        }

        await connection.query(
          `INSERT INTO tax_summary (land_id, total_appraised, exemption_value, tax_base, tax_rate, tax_amount)
           VALUES (?, ?, ?, ?, COALESCE(?, 0), ?)
           ON DUPLICATE KEY UPDATE
             total_appraised=VALUES(total_appraised), exemption_value=VALUES(exemption_value), tax_base=VALUES(tax_base), tax_amount=VALUES(tax_amount)`,
          [land_id, tax_summary.total_appraised, tax_summary.exemption_value, tax_summary.tax_base, 0, tax_summary.tax_amount]
        );
      }

      await connection.commit();
      connection.release();

      return res.json({ message: 'Import successful', importedCount: landsMap.size });
    } catch (err) {
      await connection.rollback();
      connection.release();
      console.error('DB transaction error:', err);
      return res.status(500).json({ message: 'DB transaction failed', error: err.message });
    }
  } catch (error) {
    console.error('Import error:', error);
    return res.status(500).json({ message: 'Failed to import Excel', error: error.message });
  }
};
