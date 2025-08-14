Tax Project (Dev Quick Reference)

เว็บคำนวณและบันทึกข้อมูลภาษีที่ดินและสิ่งปลูกสร้าง
รันบน Express.js + EJS และ MySQL

--------------------------------------------------
1. Setup

$ gh repo clone PhopNJ/FICT_Test
$ cd FICT_Test
$ npm install

สร้าง .env:
PORT=3000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=
DB_NAME=tax_project

รันเซิร์ฟเวอร์:
$ node app.js
เข้าหน้าเว็บ: http://localhost:3000/

--------------------------------------------------
2. โครงสร้างโปรเจกต์

/db
  connection.js       # DB connection

/public
  /css/style.css
  /script/form-script.js
  /script/filter-script.js
  /script/detail-script.js

/server
  /controllers
    formController.js
    filterController.js
    detailController.js
  /routes
    index.js          # Main routes

/views
  form.ejs
  filter.ejs
  detail.ejs

app.js
.env
package.json

--------------------------------------------------
3. Endpoints (ตัวอย่างหลัก)

/lands/       → เพิ่ม/แก้ไข/ลบข้อมูลที่ดิน
/buildings/   → เพิ่ม/แก้ไข/ลบสิ่งปลูกสร้าง
คำนวณราคาสุทธิและภาษีอัตโนมัติ

--------------------------------------------------
4. DB Table Summary

lands
id                int PK auto_increment
land_type         varchar(50)  ประเภทที่ดิน
title_deed_number varchar(50)  เลขที่โฉนด
usage_type        varchar(50)  การใช้งาน
rai, ngan, wah    int          ขนาดที่ดิน
price_per_wah     decimal(15,2) ราคาต่อตารางวา
total_price       decimal(15,2) ราคาที่ดินรวม
createdAt, updatedAt, deletedAt timestamp  สร้าง/แก้ไข/ลบ

buildings
id                int PK auto_increment
land_id           int FK → lands.id
building_type     varchar(50)  ประเภทสิ่งปลูกสร้าง
area              decimal(10,2) ขนาด (ตร.ม.)
price_per_sqm     decimal(15,2) ราคาต่อตร.ม.
total_price, depreciation, final_price decimal  คำนวณอัตโนมัติ
total_appraised, exemption_value, tax_base, tax_rate, tax_amount decimal  คำนวณภาษี
createdAt, updatedAt, deletedAt timestamp  สร้าง/แก้ไข/ลบ

--------------------------------------------------
5. Quick Dev Test

- ตรวจสอบ DB connection
- เปิด /lands และ /buildings เพิ่ม/แก้ไข/ลบข้อมูล
- ตรวจสอบการคำนวณราคาสุทธิและภาษี
- ตรวจสอบ CSS/JS static ถูกโหลดถูกต้อง

Note: deletedAt ใช้สำหรับ soft delete
      updatedAt ปรับอัตโนมัติเมื่อแก้ไข
