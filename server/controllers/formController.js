const connection = require('../../db/connection');

exports.renderForm = (req, res) => {
  res.render('form');
};

exports.submitForm = async (req, res) => {
  const timestamp = new Date();
  console.log('⏱️ Form submission started');

  // Get connection from pool
  const conn = await connection.getConnection();

  try {
    const { buildingData = [], ...landData } = req.body;

    // 1️⃣ Insert land (using transaction)
    await conn.beginTransaction();

    const [landResult] = await conn.query(
      `INSERT INTO lands 
       (land_type, title_deed_number, usage_type, rai, ngan, wah, price_per_wah, total_price, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        landData.landType,
        landData.titleDeedNumber,
        landData.landUsageType,
        landData.landRai,
        landData.landNgan,
        landData.landWah,
        landData.pricePerSqWah,
        landData.landTotalPrice,
        timestamp,
        timestamp
      ]
    );

    const landId = landResult.insertId;
    console.log(`✅ Land inserted. ID: ${landId}`);

    // 2️⃣ Insert buildings
    if (buildingData.length > 0) {
      console.log(`🏗️ Starting insertion of ${buildingData.length} buildings`);
      
      for (const [index, building] of buildingData.entries()) {
        console.log(`🔄 Processing building ${index + 1}`);
        
        // Ensure all required fields have values
        const buildingValues = [
          landId,
          building.type || 'unknown',
          building.area || 0,
          building.pricePerSqM || 0,
          building.totalPrice || 0,
          building.age || 0,
          building.depreciation || 0, // Will now accept larger values
          building.finalPrice || 0,
          timestamp,
          timestamp,
          null,
          building.summaryTotalAppraised || 0,
          building.exemptionValue || 0,
          building.taxBase || 0,
          building.taxRate || 0,
          building.taxAmount || 0
        ];

        console.log('Building values:', buildingValues); // Debug log

        await conn.query(
          `INSERT INTO buildings
           (land_id, building_type, area, price_per_sqm, total_price, age, 
            depreciation, final_price, createdAt, updatedAt, deletedAt,
            total_appraised, exemption_value, tax_base, tax_rate, tax_amount)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          buildingValues
        );
        
        console.log(`✅ Building ${index + 1} inserted`);
      }
    }

    await conn.commit();
    console.log('🎉 Transaction committed successfully');
    res.redirect('/form');

  } catch (err) {
    await conn.rollback();
    console.error('❌ Transaction rolled back due to error:', {
      message: err.message,
      sql: err.sql,
      code: err.code,
      stack: err.stack
    });

    res.status(500).json({
      error: 'Processing failed',
      details: process.env.NODE_ENV === 'development' ? {
        message: err.message,
        sql: err.sql
      } : undefined
    });
  } finally {
    if (conn) conn.release();
    console.log('🔌 Connection released back to pool');
  }
};