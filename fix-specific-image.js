// Fix specific broken image in database
import fetch from 'node-fetch';

async function fixSpecificImage() {
  try {
    console.log('🔍 Getting all products to check images...');
    
    const response = await fetch('http://localhost:5000/api/products');
    const products = await response.json();
    
    const brokenImageId = 'photo-1583391733956-6c78276477e2';
    const workingImageUrl = 'https://images.unsplash.com/photo-1594633313593-bab3825d0caf?w=400&h=400&fit=crop&auto=format';
    
    for (const product of products) {
      if (product.images && product.images.some(img => img.includes(brokenImageId))) {
        console.log(`🔧 Fixing product: ${product.name} (ID: ${product.id})`);
        
        // Replace all instances of broken image
        const fixedImages = product.images.map(img => 
          img.includes(brokenImageId) ? workingImageUrl : img
        );
        
        // Also fix imageUrl if it exists
        let fixedImageUrl = product.imageUrl;
        if (fixedImageUrl && fixedImageUrl.includes(brokenImageId)) {
          fixedImageUrl = workingImageUrl;
        }
        
        const updateData = {
          name: product.name,
          description: product.description,
          price: product.price,
          category: product.category,
          storeId: product.storeId,
          images: fixedImages,
          imageUrl: fixedImageUrl || product.imageUrl,
          stock: product.stock || 100,
          isActive: product.isActive !== false
        };
        
        console.log('Update data:', { id: product.id, images: fixedImages, imageUrl: fixedImageUrl });
        
        const updateResponse = await fetch(`http://localhost:5000/api/products/${product.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(updateData)
        });
        
        if (updateResponse.ok) {
          console.log(`✅ Successfully fixed product: ${product.name}`);
        } else {
          const errorText = await updateResponse.text();
          console.log(`❌ Failed to fix product: ${product.name} - ${errorText}`);
        }
      }
    }
    
    console.log('🎉 Image fix process completed!');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixSpecificImage();