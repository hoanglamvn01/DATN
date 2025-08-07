// 📁 server/controllers/productController.js

import { db } from "../config/connectBD.js"; 

// ✅ Lấy danh sách sản phẩm hoặc tìm kiếm sản phẩm
export const getAllProducts = (req, res) => {
    const { search, category } = req.query;
    const conditions = [];
    const params = [];

    let sql = `
        SELECT
            p.product_id, p.name, p.description, p.short_description, p.ingredients, p.usage_instructions,
            p.price, p.stock_quantity, p.thumbnail, p.category_id, p.brand_id,
            b.brand_name, c.category_name,
            COALESCE(AVG(pr.rating), 0) AS rating,  
            COUNT(pr.review_id) AS reviews,          
            GROUP_CONCAT(pi.image_url ORDER BY pi.image_id ASC) AS images
        FROM
            products p
        LEFT JOIN brands b ON p.brand_id = b.brand_id
        LEFT JOIN categories c ON p.category_id = c.category_id
        LEFT JOIN reviews pr ON p.product_id = pr.product_id -- ✅ JOIN VỚI BẢNG REVIEWS
        LEFT JOIN product_images pi ON p.product_id = pi.product_id
    `;
    if (category) {
        conditions.push(`c.slug = ?`);
        params.push(category);
    }
    if (search) {
        conditions.push(`(p.name LIKE ? OR p.description LIKE ? OR p.short_description LIKE ? OR p.ingredients LIKE ? OR p.usage_instructions LIKE ?)`);
        const searchTerm = `%${search}%`;
        params.push(searchTerm, searchTerm, searchTerm, searchTerm, searchTerm);
    }
    if (conditions.length > 0) {
        sql += ` WHERE ` + conditions.join(' AND ');
    }
    sql += ` GROUP BY p.product_id ORDER BY p.product_id DESC`;
    
    // ✅ SỬA LỖI: SỬ DỤNG ASYNC/AWAIT ĐỂ TƯƠNG THÍCH VỚI CONNECTION POOL
    db.query(sql, params, (err, result) => {
        if (err) {
            console.error('Lỗi khi lấy sản phẩm (getAllProducts):', err);
            return res.status(500).json({ error: "Lỗi máy chủ khi lấy danh sách sản phẩm.", details: err.message });
        }
        const processedResults = result.map(p => ({
            ...p,
            images: p.images && typeof p.images === 'string' ? p.images.split(',') : (p.images || []),
            rating: parseFloat(p.rating) || 0,
            reviews: parseInt(p.reviews) || 0
        }));
        res.json(processedResults);
    });
};

// ✅ Lấy chi tiết sản phẩm theo ID
export const getProductById = (req, res) => {
  const { id } = req.params;

  const sql = `
    SELECT
        p.product_id,
        p.name,
        p.description,
        p.short_description,
        p.ingredients, -- ✅ THÊM TRƯỜNG MỚI
        p.usage_instructions, -- ✅ THÊM TRƯỜNG MỚI
        p.price,
        p.quantity AS stock_quantity,
        p.thumbnail,
        p.category_id,
        p.brand_id,
        p.discount_price,
        b.brand_name,
        c.category_name,
        c.slug AS category_slug,
        COALESCE(AVG(pr.rating), 0) AS rating,
        COUNT(pr.review_id) AS reviews,
        GROUP_CONCAT(DISTINCT pi.image_url ORDER BY pi.image_id ASC) AS other_images_filenames,
        COALESCE(SUM(oi.quantity), 0) AS total_sold_quantity
    FROM products p
    LEFT JOIN brands b ON p.brand_id = b.brand_id
    LEFT JOIN categories c ON p.category_id = c.category_id
    LEFT JOIN reviews pr ON p.product_id = pr.product_id
    LEFT JOIN product_images pi ON p.product_id = pi.product_id
    LEFT JOIN order_items oi ON p.product_id = oi.product_id
    LEFT JOIN orders o ON oi.order_id = o.order_id AND o.order_status = 'completed'
    WHERE p.product_id = ?
    GROUP BY p.product_id, p.name, p.description, p.short_description,
             p.ingredients, p.usage_instructions, -- ✅ THÊM 2 TRƯỜNG MỚI VÀO GROUP BY
             p.price, p.quantity, p.thumbnail, p.category_id, p.brand_id,
             p.discount_price, b.brand_name, c.category_name, c.slug
    LIMIT 1
  `;

  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error('Lỗi khi lấy chi tiết sản phẩm (getProductById):', err);
      return res.status(500).json({ message: "Lỗi máy chủ khi lấy chi tiết sản phẩm." });
    }

    if (result.length === 0) {
      return res.status(404).json({ message: "Không tìm thấy sản phẩm này." });
    }

    const productData = result[0];

    // ... (phần xử lý ảnh không đổi) ...
    if (productData.other_images_filenames) {
      productData.images = productData.other_images_filenames.split(',');
    } else {
      productData.images = [];
    }
    if (productData.thumbnail && !productData.images.includes(productData.thumbnail)) {
        productData.images.unshift(productData.thumbnail);
    } else if (productData.thumbnail && productData.images.length === 0) {
        productData.images.push(productData.thumbnail);
    } else if (!productData.thumbnail && productData.images.length > 0) {
    } else if (!productData.thumbnail && productData.images.length === 0) {
        productData.images.push("default_product.jpg");
    }

    productData.rating = parseFloat(productData.rating) || 0;
    productData.reviews = parseInt(productData.reviews) || 0;
    productData.total_sold_quantity = parseInt(productData.total_sold_quantity) || 0;

    res.json(productData);
  });
};

// ✅ Thêm sản phẩm
export const createProduct = (req, res) => {
  const { name, price, stock_quantity, description, short_description, ingredients, usage_instructions, category_id, brand_id } = req.body;
  const thumbnail = req.files && req.files['thumbnail'] && req.files['thumbnail'][0] ? req.files['thumbnail'][0].filename : null;
  const otherImages = req.files && req.files['other_images'] ? req.files['other_images'].map(file => file.filename) : [];

  if (!name || !price || !stock_quantity || !thumbnail || !category_id || !brand_id) {
    return res.status(400).json({ error: 'Vui lòng điền đầy đủ thông tin bắt buộc (bao gồm ảnh thumbnail).' });
  }

  db.query('INSERT INTO products (name, price, quantity, description, short_description, ingredients, usage_instructions, thumbnail, category_id, brand_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [name, price, stock_quantity, description, short_description, ingredients, usage_instructions, thumbnail, category_id, brand_id],
    (err, result) => {
      if (err) {
        console.error('Lỗi khi thêm sản phẩm:', err);
        return res.status(500).json({ error: "Lỗi máy chủ khi thêm sản phẩm." });
      }

      const productId = result.insertId;
      if (otherImages.length > 0) {
        const imageValues = otherImages.map(img => [productId, img]);
        db.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [imageValues], (imgErr) => {
          if (imgErr) {
            console.error('Lỗi khi lưu ảnh phụ:', imgErr);
          }
        });
      }

      res.json({ message: "✅ Thêm sản phẩm thành công", id: productId });
    }
  );
};

// ✅ Cập nhật sản phẩm
export const updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, price, stock_quantity, description, short_description, ingredients, usage_instructions, category_id, brand_id, existing_images } = req.body;
  const thumbnailFile = req.files && req.files['thumbnail'] && req.files['thumbnail'][0] ? req.files['thumbnail'][0].filename : null;
  const newOtherImagesFiles = req.files && req.files['other_images'] ? req.files['other_images'].map(file => file.filename) : [];

  db.query("SELECT thumbnail FROM products WHERE product_id = ?", [id], (err, results) => {
    if (err) {
      console.error('Lỗi khi lấy ảnh cũ để cập nhật sản phẩm:', err);
      return res.status(500).json({ error: "Lỗi máy chủ khi cập nhật sản phẩm." });
    }

    const oldThumbnail = results[0]?.thumbnail;
    const finalThumbnail = thumbnailFile || oldThumbnail;

    db.query(
      'UPDATE products SET name=?, price=?, stock_quantity=?, description=?, short_description=?, ingredients=?, usage_instructions=?, category_id=?, brand_id=?, thumbnail=? WHERE product_id=?',
      [name, price, stock_quantity, description, short_description, ingredients, usage_instructions, category_id, brand_id, finalThumbnail, id],
      (err) => {
        if (err) {
          console.error('Lỗi khi cập nhật sản phẩm chính:', err);
          return res.status(500).json({ error: "Lỗi máy chủ khi cập nhật sản phẩm." });
        }
        let currentExistingImages = [];
        if (existing_images && typeof existing_images === 'string') {
          try {
            currentExistingImages = JSON.parse(existing_images);
          } catch (e) {
            console.error("Lỗi parse existing_images:", e);
          }
        } else if (Array.isArray(existing_images)) {
          currentExistingImages = existing_images;
        }

        db.query('DELETE FROM product_images WHERE product_id = ?', [id], (deleteErr) => {
          if (deleteErr) {
            console.error('Lỗi khi xóa ảnh phụ cũ:', deleteErr);
          }
          const allNewImages = [...currentExistingImages, ...newOtherImagesFiles];
          if (allNewImages.length > 0) {
            const imageValues = allNewImages.map(img => [id, img]);
            db.query('INSERT INTO product_images (product_id, image_url) VALUES ?', [imageValues], (insertErr) => {
              if (insertErr) {
                console.error('Lỗi khi lưu ảnh phụ mới/cập nhật:', insertErr);
              }
            });
          }
        });
        
        res.json({ message: "✅ Cập nhật sản phẩm thành công" });
      }
    );
  });
};

// ✅ Xoá sản phẩm
export const deleteProduct = (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM products WHERE product_id = ?", [id], (err) => {
    if (err) {
      console.error('Lỗi khi xóa sản phẩm:', err);
      return res.status(500).json({ error: "Lỗi máy chủ khi xóa sản phẩm." });
    }
    res.json({ message: "🗑️ Xoá sản phẩm thành công" });
  });
};

// ✅ Lấy sản phẩm theo brand slug
export const getProductsByBrandSlug = (req, res) => {
  const { slug } = req.params;

  const sql = `
    SELECT p.* FROM products p
    JOIN brands b ON p.brand_id = b.brand_id
    WHERE b.slug = ?
  `;

  db.query(sql, [slug], (err, result) => {
    if (err) {
      console.error('Lỗi khi truy vấn sản phẩm theo brand slug:', err);
      return res.status(500).json({ error: "Lỗi máy chủ khi lấy sản phẩm theo thương hiệu." });
    }
    if (result.length === 0) return res.status(404).json({ message: 'Không tìm thấy sản phẩm thuộc thương hiệu này.' });

    res.json(result);
  });
};

// ✅ Lấy sản phẩm theo category slug
export const getProductsByCategorySlug = (req, res) => {
  const { slug } = req.params;

  const sql = `
    SELECT 
        p.product_id, 
        p.name, 
        p.description, 
        p.short_description, 
        p.ingredients, -- ✅ THÊM TRƯỜNG MỚI
        p.usage_instructions, -- ✅ THÊM TRƯỜNG MỚI
        p.price, 
        p.stock_quantity, 
        p.thumbnail, 
        p.category_id, 
        p.brand_id, 
        b.brand_name, 
        c.category_name, 
        c.slug AS category_slug, 
        COALESCE(AVG(pr.rating), 0) AS rating,  
        COUNT(pr.review_id) AS reviews,          
        GROUP_CONCAT(pi.image_url ORDER BY pi.image_id ASC) AS images 
    FROM 
        products p
    JOIN 
        categories c ON p.category_id = c.category_id
    LEFT JOIN 
        brands b ON p.brand_id = b.brand_id  
    LEFT JOIN 
        reviews pr ON p.product_id = pr.product_id 
    LEFT JOIN 
        product_images pi ON p.product_id = pi.product_id
    WHERE 
        c.slug = ?
    GROUP BY 
        p.product_id, p.name, p.description, p.short_description, p.ingredients, p.usage_instructions,
        p.price, p.stock_quantity, p.thumbnail, 
        p.category_id, p.brand_id, b.brand_name, c.category_name, c.slug
    ORDER BY p.product_id DESC
    LIMIT 10
  `;

  db.query(sql, [slug], (err, result) => {
    if (err) {
      console.error('Lỗi khi truy vấn sản phẩm theo category slug (getProductsByCategorySlug):', err);
      console.error('SQL Query:', sql);
      console.error('SQL Params:', [slug]);
      return res.status(500).json({ error: 'Lỗi server khi lấy sản phẩm theo danh mục.' });
    }

    if (result.length === 0) {
      return res.status(200).json([]);
    }

    const processedResults = result.map(p => {
        let imagesArray = [];
        if (p.images && typeof p.images === 'string') {
            imagesArray = p.images.split(',');
        }
        if (p.thumbnail && !imagesArray.includes(p.thumbnail)) {
            imagesArray.unshift(p.thumbnail);
        } else if (p.thumbnail && imagesArray.length === 0) {
            imagesArray.push(p.thumbnail);
        }
        
        return {
            ...p,
            images: imagesArray,
            rating: parseFloat(p.rating) || 0,
            reviews: parseInt(p.reviews) || 0
        };
    });

    res.json(processedResults);
  });
};