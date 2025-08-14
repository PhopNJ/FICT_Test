const connection = require('../../db/connection');

function formatDate(date) {
  const d = new Date(date);
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
}

exports.renderDetail = async (req, res) => {
  try {
    const conn = await connection.getConnection();

    try {
      const query = `
        SELECT 
          lands.id,
          lands.land_type,
          lands.title_deed_number,
          lands.usage_type,
          lands.rai,
          lands.ngan,
          lands.wah,
          lands.price_per_wah,
          lands.total_price AS land_total_price,
          lands.createdAt AS land_created,
          lands.updatedAt AS land_updated,
          buildings.id AS building_id,
          buildings.building_type,
          buildings.area AS building_area,
          buildings.price_per_sqm,
          buildings.total_price AS building_total_price,
          buildings.age,
          buildings.depreciation,
          buildings.final_price,
          buildings.total_appraised,
          buildings.exemption_value,
          buildings.tax_base,
          buildings.tax_rate,
          buildings.tax_amount,
          buildings.createdAt AS building_created,
          buildings.updatedAt AS building_updated
        FROM lands
        LEFT JOIN buildings ON lands.id = buildings.land_id
        ORDER BY lands.updatedAt DESC, buildings.updatedAt DESC
      `;

      const [results] = await conn.query(query);
      conn.release();

      const usageMap = {
        agriculture: 'ประกอบเกษตรกรรม',
        vacant: 'ทิ้งไว้ว่างเปล่า',
        residential: 'อยู่อาศัย',
        mixed: 'ใช้ประโยชน์หลายประเภท',
        other: 'อื่นๆ'
      };

      const buildingTypeMap = {
        residential: 'บ้านพักอาศัย',
        commercial: 'อาคารพาณิชย์',
        factory: 'โรงงาน',
        warehouse: 'คลังสินค้า',
        office: 'อาคารสำนักงาน',
        other: 'อื่นๆ'
      };

      const landTypeMap = {
        chanote: 'โฉนดที่ดิน',
        norSor3Kor: 'น.ส.3ก',
        norSor3: 'น.ส.3',
        sorKor1: 'ส.ค.1',
        other: 'อื่นๆ'
      };

      // Group buildings by land
      const landData = {};
      results.forEach(row => {
        const landId = row.id;
        if (!landData[landId]) {
          landData[landId] = {
            id: landId,
            deed: row.title_deed_number,
            landType: landTypeMap[row.land_type] || row.land_type,
            usage: usageMap[row.usage_type] || row.usage_type,
            rai: row.rai,
            ngan: row.ngan,
            wah: row.wah,
            pricePerWah: row.price_per_wah,
            landTotalPrice: row.land_total_price ? Number(row.land_total_price) : 0,
            landCreated: formatDate(row.land_created),
            landUpdated: formatDate(row.land_updated),
            buildings: [],
            totalArea: (row.rai * 400) + (row.ngan * 100) + row.wah,
            totalBuildingValue: 0,
            totalTax: 0
          };
        }

        if (row.building_id) {
          const building = {
            id: row.building_id,
            type: buildingTypeMap[row.building_type] || row.building_type,
            area: row.building_area,
            pricePerSqm: row.price_per_sqm,
            totalPrice: row.building_total_price,
            age: row.age,
            depreciation: row.depreciation,
            finalPrice: row.final_price,
            totalAppraised: row.total_appraised,
            exemptionValue: row.exemption_value,
            taxBase: row.tax_base,
            taxRate: row.tax_rate,
            taxAmount: row.tax_amount,
            created: formatDate(row.building_created),
            updated: formatDate(row.building_updated)
          };

          landData[landId].buildings.push(building);
          landData[landId].totalBuildingValue += Number(row.final_price) || 0;
          landData[landId].totalTax += Number(row.tax_amount) || 0;
        }
      });

      const formattedData = Object.values(landData);
      const summary = {
        totalLands: formattedData.length,
        totalBuildings: formattedData.reduce((sum, land) => sum + land.buildings.length, 0),
        totalArea: formattedData.reduce((sum, land) => sum + land.totalArea, 0),
        totalLandValue: formattedData.reduce((sum, land) => sum + (land.landTotalPrice || 0), 0),
        totalBuildingValue: formattedData.reduce((sum, land) => sum + land.totalBuildingValue, 0),
        totalTax: formattedData.reduce((sum, land) => sum + land.totalTax, 0)
      };

      console.log('Summary:', summary);
      // Format numbers with commas, no decimals
      formattedData.forEach(land => {
        land.displayArea = land.totalArea.toLocaleString('th-TH') + ' ตร.วา';
        land.displayLandValue = Number(land.landTotalPrice).toLocaleString('th-TH');
        land.displayBuildingValue = Number(land.totalBuildingValue).toLocaleString('th-TH');
        land.displayTax = Number(land.totalTax).toLocaleString('th-TH');

        land.buildings.forEach(building => {
          building.displayArea = Number(building.area).toLocaleString('th-TH') + ' ตร.ม.';
          building.displayPrice = Number(building.finalPrice).toLocaleString('th-TH');
          building.displayTax = Number(building.taxAmount).toLocaleString('th-TH');
        });
      });

      res.render('detail', {
        dataList: formattedData,
        summary: {
          totalItems: summary.totalLands,
          totalBuildings: summary.totalBuildings,
          totalArea: summary.totalArea.toLocaleString('th-TH') + ' ตร.วา',
          totalLandValue: '฿' + summary.totalLandValue.toLocaleString('th-TH'),
          totalBuildingValue: '฿' + summary.totalBuildingValue.toLocaleString('th-TH'),
          totalTax: '฿' + summary.totalTax.toLocaleString('th-TH')
        }
      });

    } catch (err) {
      conn.release();
      console.error('Database error:', err);
      throw err;
    }
  } catch (err) {
    console.error('Error in renderDetail:', err);
    res.status(500).render('error', {
      message: 'Error loading data',
      error: process.env.NODE_ENV === 'development' ? err : {}
    });
  }
};


exports.deleteLand = (req, res) => {
  const landId = req.params.id;

  const deleteBuildings = 'DELETE FROM buildings WHERE land_id = ?';
  const deleteTax = 'DELETE FROM tax_summary WHERE land_id = ?';
  const deleteLand = 'DELETE FROM lands WHERE id = ?';

  connection.query(deleteBuildings, [landId], (err) => {
    if (err) return res.status(500).send('Failed to delete buildings');

    connection.query(deleteTax, [landId], (err) => {
      if (err) return res.status(500).send('Failed to delete tax summary');

      connection.query(deleteLand, [landId], (err, result) => {
        if (err) return res.status(500).send('Failed to delete land');
        if (result.affectedRows === 0) return res.status(404).send('Land not found');
        res.send('Land deleted successfully');
      });
    });
  });
};
