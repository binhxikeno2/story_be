# Hướng dẫn sử dụng Cookies để bypass Cloudflare

## Cách lấy Cookies từ Browser

### Chrome/Edge:

1. Mở trang web `https://x3dl.net/wp/category/ippan-manga/` trong Chrome
2. Nhấn `F12` để mở DevTools
3. Vào tab **Application** (hoặc **Storage**)
4. Bên trái, chọn **Cookies** > `https://x3dl.net`
5. Copy tất cả cookies (format: `name1=value1; name2=value2; ...`)

### Firefox:

1. Mở trang web trong Firefox
2. Nhấn `F12` để mở DevTools
3. Vào tab **Storage**
4. Chọn **Cookies** > `https://x3dl.net`
5. Copy tất cả cookies

### Cách copy nhanh (Chrome):

1. Mở DevTools (`F12`)
2. Vào tab **Console**
3. Chạy lệnh:

```javascript
document.cookie;
```

4. Copy kết quả

### Cookie nào cần lấy?

**Quan trọng nhất:**

- `cf_clearance` - Cookie chính của Cloudflare để bypass "Verifying you are human"

**Nên lấy thêm:**

- `_dtsu`, `_cc_id` - Các cookie tracking khác
- Tất cả cookies khác (để giống browser thật nhất)

**Cách format:**

- Copy tất cả cookies từ bảng (Name=Value)
- Format: `name1=value1; name2=value2; name3=value3`
- Ví dụ: `_dtsu=104012; _cc_id=d17c07; cf_clearance=oggyO; cookie=24bdc; ...`

## Cách thêm vào .env

**File `.env` nằm ở root của project** (cùng cấp với `package.json`)

Thêm vào file `.env`:

```env
CRAWL_COOKIES=__cf_bm=xxx; cf_clearance=yyy; _cfuvid=zzz; ...
```

**Ví dụ:**

```env
CRAWL_COOKIES=__cf_bm=abc123; cf_clearance=xyz789; _cfuvid=def456
```

**Lưu ý:**

- Cookies có thể hết hạn sau vài giờ/ngày
- Cần cập nhật lại cookies nếu bị chặn lại
- Không commit file `.env` lên git (đã có trong .gitignore)
- Sau khi thêm cookies, **restart server** để áp dụng thay đổi

## Test cookies

Sau khi thêm cookies vào `.env`, restart server và thử crawl lại.
