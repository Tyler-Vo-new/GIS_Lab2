# ArcGIS 3D LAB2: VẼ CÔNG TRÌNH KIẾN TRÚC 3D

## Giới thiệu

Nhánh main sử dụng ArcGIS API for JavaScript để hiển thị bản đồ 3D, dựng tường và gắn cửa sổ.

## Cách chạy

1.	Trong `index.html`, file chính sẽ là `main.js`, hiển thị nhà thờ và bản đồ thông qua file này
2.	Không thể import, export các hàm như JavaScript thông thường, nếu muốn sử dụng, cần đặt script ở trong `index.html`
3.	Chú ý thứ tự cách đặt các script trong `index.html`, file `main.js` ở cuối, các hàm tiện ích trong `utils.js` đặt ở đầu thì mới có thể sử dụng thoải mái các hàm trong `main.js`
4.	Chú ý cách sử dụng window.<tên hàm> = <hàm>, đối với từng vật thể sử dụng hàm để tạo dựng, tránh sử dụng cùng tên
5.	Nếu muốn tìm một điểm cụ thể, bấm vào map và vào mục console của trình duyệt sẽ có degree (độ cụ thể của điểm)

## Cấu trúc

- `main.js`: Khởi tạo bản đồ, thêm tường, thêm cửa sổ, mái nhà v.v.
- Thư mục `3D_Models` chứa các models mesh tải về
-  Thư mục `Utils`, chứa các hàm sau:
- `Utils/utils.js`: Hàm tiện ích, bao gồm tìm điểm dựa trên khoảng cách, tìm hướng tường, tìm vật thể trên map theo id, v.v.
- `Utils/cuaSoDung.js`: Hàm mẫu tạo cửa sổ nhỏ đơn giản, dựa trên id tường đã tạo.
