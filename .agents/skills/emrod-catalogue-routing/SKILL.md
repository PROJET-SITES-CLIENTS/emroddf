---
name: emrod-catalogue-routing
description: "Corrige l'architecture du catalogue (3 niveaux) et met en place des URLs basées sur des slugs."
---

# Instructions

Ce skill permet d'appliquer la correction de la structure du catalogue pour EMROD SARL.

## 1. Mettre à jour `src/lib/api.ts`
1. Ajoutez une fonction utilitaire pour générer des slugs :
```typescript
function slugify(text: string): string {
  return text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');
}
```
2. Mettez à jour l'interface `Product` pour inclure `categorySlug` et `modelSlug`.
3. Dans `fetchCatalogue`, lors de la création de l'objet `Product`, ajoutez :
```typescript
categorySlug: slugify(category.name),
modelSlug: slugify(productFolder.name),
```
4. Dans `fetchProductDetail`, modifiez la logique pour chercher par slug :
```typescript
export async function fetchProductDetail(categorySlug: string, modelSlug: string) {
  const catalogue = await fetchCatalogue();
  const product = catalogue.find(p => p.categorySlug === categorySlug && p.modelSlug === modelSlug);
  if (!product) throw new Error("Produit introuvable");
  
  // Get all images inside this specific folder
  const q = `'${product.folderId}' in parents and mimeType contains 'image/' and trashed = false`;
  const files = await fetchDriveFiles(q, "files(id, name, description)");

  const mainImage = files.find((f: any) => (f.description || "").trim()) || files[0];
  const meta = parseMeta(mainImage?.description || "");

  return {
    ...product,
    prix: meta.prix,
    prixNumeric: meta.prixNumeric,
    description: meta.description,
    images: files.map((f: any) => ({ id: f.id, name: f.name })),
  };
}
```

## 2. Mettre à jour `src/App.tsx`
Changez la route :
```tsx
<Route path="catalogue/:categorySlug/:modelSlug" element={<ProductDetail />} />
```

## 3. Mettre à jour `src/pages/Services.tsx`
Modifiez les liens (`Link to=...`) dans les cartes produits :
```tsx
<Link to={`/catalogue/${item.categorySlug}/${item.modelSlug}`} className="...">
```

## 4. Mettre à jour `src/pages/ProductDetail.tsx`
Mettez à jour les paramètres de route :
```tsx
const { categorySlug, modelSlug } = useParams<{ categorySlug: string; modelSlug: string }>();

useEffect(() => {
  if (categorySlug && modelSlug) {
    fetchProductDetail(categorySlug, modelSlug)
      // ...
  }
}, [categorySlug, modelSlug]);
```
